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

/** 面の内容が溢れているか（縦横どちらでも） */
export const isOverflowing = (pane: HTMLElement): boolean =>
  pane.scrollHeight > pane.clientHeight || pane.scrollWidth > pane.clientWidth

/**
 * 溢れた面だけ Tab で届くようにする（axe `scrollable-region-focusable`）。
 * 溢れていない面に tabindex を残すと、Tab の止まる所が増えるだけなので外す。
 * ResizeObserver は面（部品の割合が変わる・窓が変わる）と slot の中身（slotchange）の
 * 両方で回す。面の大きさは割合と窓で変わり、溢れるかどうかは中身でも変わるため。
 */
export const overflowWatcher = (root: ShadowRoot | null): { readonly dispose: () => void } => {
  const panes = [...(root?.querySelectorAll('[part=start], [part=end]') ?? [])].filter(
    (pane): pane is HTMLElement => pane instanceof HTMLElement,
  )
  const sync = (): void => {
    for (const pane of panes) {
      if (isOverflowing(pane)) {
        pane.setAttribute('tabindex', '0')
      } else {
        pane.removeAttribute('tabindex')
      }
    }
  }
  // 測れない環境（ResizeObserver が無い）では一度だけ測る。Chromium には在る
  if (typeof ResizeObserver === 'undefined') {
    sync()
    return { dispose: (): void => undefined }
  }
  const observer = new ResizeObserver(sync)
  const slots: HTMLSlotElement[] = []
  for (const pane of panes) {
    observer.observe(pane)
    const slot = pane.querySelector('slot')
    if (slot instanceof HTMLSlotElement) {
      slot.addEventListener('slotchange', sync)
      slots.push(slot)
    }
  }
  return {
    dispose: (): void => {
      observer.disconnect()
      for (const slot of slots) {
        slot.removeEventListener('slotchange', sync)
      }
    },
  }
}

/**
 * shadow のつまみにドラッグを配線し、面の溢れの監視を起こす（つまみが無ければ配線だけ飛ばす）。
 * 返り値を `disconnectedCallback` で呼ぶと両方止まる。
 */
export const wireShadow = (root: ShadowRoot | null, drag: DragController): (() => void) => {
  const handle = root?.querySelector('[part=handle]')
  if (handle instanceof HTMLElement) {
    drag.wire(handle)
  }
  const watcher = overflowWatcher(root)
  return (): void => {
    drag.dispose()
    watcher.dispose()
  }
}
