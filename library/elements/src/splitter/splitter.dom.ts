/**
 * `rd-splitter` が DOM を読み書きするための薄い層。判断は `splitter.logic.ts`（純関数）が持つ。
 * ここにあるのは「読む・書く・聞く」だけで、`*.element.ts` を 150 行に収める（ADR-0005）
 * ための置き場でもある。`class` は `*.element.ts` にしか書けないので、コントローラは
 * **関数 + クロージャ**で作る（`menu.dom.ts` の `contextController` と同じ形）。
 */
import type { ContractCheck } from '../_shared/contract.js'
import type { SplitterDirection } from './splitter.contract.js'
import { type Axis, type Bounds, decideKey, positionFromPointer } from './splitter.logic.js'

/** 横並びのときだけ書字方向で左右が入れ替わる。縦の積み方は `dir` で変わらない */
export const isRtl = (host: HTMLElement): boolean => host.matches(':dir(rtl)')

/** host の矩形のうち `direction` に沿った 1 軸だけ（横なら left/width、縦なら top/height） */
export const hostRect = (host: HTMLElement, direction: SplitterDirection): Axis => {
  const rect = host.getBoundingClientRect()
  return direction === 'vertical'
    ? { start: rect.top, size: rect.height }
    : { start: rect.left, size: rect.width }
}

/**
 * 割合はインラインの CSS 変数で渡す（`menu.dom.ts` が `top` / `left` を書くのと同じ考え）。
 * shadow の `grid-template-*` がこの変数を読む。
 */
export const applyPosition = (host: HTMLElement, position: number): void => {
  host.style.setProperty('--rd-splitter-position', `${position}%`)
}

/**
 * キー入力から新しい割合を決める。**DOM を読む（書字方向）のがここの仕事**で、
 * 「どのキーでいくつ動くか」の規則は `splitter.logic.ts` の `decideKey` が持つ。
 * 扱わないキーは `undefined`（呼び側は `preventDefault()` しない）。
 */
export const positionFromKey = (
  host: HTMLElement,
  event: KeyboardEvent,
  direction: SplitterDirection,
  current: number,
  bounds: Bounds,
): number | undefined =>
  decideKey(event.key, event.shiftKey, direction, isRtl(host), current, bounds)

/** 足りない子と label を 1 つの `console.error` にまとめる（開発時の手がかり。実行は止めない） */
export const reportMissing = (result: ContractCheck<Element>, label: string): void => {
  const missing = [
    result.kind === 'missing' ? `slot="start" と slot="end"（${result.roles.join(', ')}）` : '',
    label === '' ? 'label（つまみの名前）' : '',
  ].filter((problem) => problem !== '')
  if (missing.length > 0) {
    console.error(`[rd-splitter] 必要: ${missing.join(' / ')}`)
  }
}

/** `dragController` が element の private を覗かずに済むための窓口 */
export type DragParts = {
  readonly host: HTMLElement
  readonly direction: () => SplitterDirection
  readonly bounds: () => Bounds
  readonly onStart: () => void
  readonly onMove: (position: number) => void
  readonly onEnd: () => void
}

export type DragController = {
  readonly wire: (handle: HTMLElement) => void
  /** いまつかんでいるか。`:state(dragging)` の出どころ（element は自分で持たない） */
  readonly dragging: () => boolean
  readonly dispose: () => void
}

/**
 * つまみのドラッグ。`setPointerCapture` を取るので、面の外へ出ても `pointermove` が
 * **つまみに**届き続ける（`window` を購読しない ＝ 部品の外に痕跡を残さない）。
 * 主ボタン以外は無視する（右クリックでメニューを出す邪魔をしない）。
 */
export const dragController = (parts: DragParts): DragController => {
  let handle: HTMLElement | undefined = undefined
  let dragging = false

  const onDown = (event: PointerEvent): void => {
    if (event.button !== 0 || handle === undefined) {
      return
    }
    dragging = true
    handle.setPointerCapture(event.pointerId)
    // 面の中の文字が選択されるのを止める（`:state(dragging)` の `user-select` と対）
    event.preventDefault()
    parts.onStart()
  }

  const onMove = (event: PointerEvent): void => {
    if (!dragging) {
      return
    }
    const direction = parts.direction()
    const point = direction === 'vertical' ? event.clientY : event.clientX
    const rtl = direction === 'horizontal' && isRtl(parts.host)
    parts.onMove(positionFromPointer(point, hostRect(parts.host, direction), rtl, parts.bounds()))
  }

  const onUp = (event: PointerEvent): void => {
    if (!dragging) {
      return
    }
    dragging = false
    if (handle?.hasPointerCapture(event.pointerId) === true) {
      handle.releasePointerCapture(event.pointerId)
    }
    parts.onEnd()
  }

  const LISTENERS = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onUp],
  ] as const

  return {
    dragging: (): boolean => dragging,
    wire: (element: HTMLElement): void => {
      handle = element
      for (const [type, listener] of LISTENERS) {
        element.addEventListener(type, listener)
      }
    },
    dispose: (): void => {
      for (const [type, listener] of LISTENERS) {
        handle?.removeEventListener(type, listener)
      }
      handle = undefined
    },
  }
}

/** shadow のつまみを掴んでドラッグを配線する（見つからなければ何もしない） */
export const wireHandle = (root: ShadowRoot | null, drag: DragController): void => {
  const handle = root?.querySelector('[part=handle]')
  if (handle instanceof HTMLElement) {
    drag.wire(handle)
  }
}
