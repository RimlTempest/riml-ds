/**
 * `rd-menu` が light DOM を読み書きするための薄い層。判断は `menu.logic.ts`（純関数）、
 * 位置決めは `_shared/popover-anchor.ts` が持つ。ここにあるのは「読む・書く」だけで、
 * `*.element.ts` を 150 行に収める（ADR-0005）ための置き場でもある。
 */
import type { ContractCheck } from '../_shared/contract.js'
import { syncAttribute } from '../_shared/internals.js'
import { type AnchorPlacement, anchorPopover } from '../_shared/popover-anchor.js'
import { nextIndex } from '../_shared/roving-focus.js'
import {
  contextPosition,
  menuItemAttributes,
  type MenuView,
  type Point,
  triggerAttributes,
} from './menu.logic.js'

/** click の発生元をたどる先。`ITEM_SELECTOR` は `:scope` を含むので `closest` に渡せない */
const CLICKABLE = 'a[href], button, [aria-disabled="true"]'

/** `undefined` に強い `setAttribute`。属性を消す必要があるものは `syncAttribute` を使う */
export const applyAttrs = (
  el: Element | undefined,
  attrs: Readonly<Record<string, string>>,
): void => Object.entries(attrs).forEach(([name, value]) => el?.setAttribute(name, value))

/** `toggle` の `newState`。型に無いエンジンでも読めるように存在で見る */
export const opened = (event: Event): boolean =>
  'newState' in event && typeof event.newState === 'string' && event.newState === 'open'

export const asElement = (node: Element | null | undefined): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

/** id と `popovertarget` を結ぶ。利用側が書いていればそのまま尊重する */
export const wireIds = (list: HTMLElement, trigger: HTMLElement, name: string): void => {
  list.id = list.id === '' ? name : list.id
  trigger.id = trigger.id === '' ? `${list.id}-trigger` : trigger.id
  syncAttribute(trigger, 'popovertarget', trigger.getAttribute('popovertarget') ?? list.id)
}

/**
 * `click` の発生元がどの項目か。押せる祖先まで遡って並びの中の番号を返す
 * （どれでもなければ `-1`）。押せるかどうかの判断は呼び側が `aria-disabled` で行う。
 */
export const resolveItem = (event: Event, items: readonly HTMLElement[]): number => {
  const target = event.target instanceof Element ? event.target.closest(CLICKABLE) : null
  return items.findIndex((candidate) => candidate === target)
}

/**
 * ↑ ↓ Home End で隣の項目へ移す。`nextIndex` が扱わないキーでは**何もしない**
 * （既定も止めない——ページのスクロールや文字入力を奪わない）。
 */
export const focusNextItem = (event: KeyboardEvent, items: readonly HTMLElement[]): void => {
  const index = items.findIndex((item) => item === event.target)
  const next = nextIndex(index, items.length, event.key, 'vertical')
  if (next !== undefined) {
    event.preventDefault()
    items[next]?.focus()
  }
}

/** `updated()` が毎回書き写す属性。判断は `menu.logic.ts` が済ませているのでここは写すだけ */
export const applyMenuAttrs = (
  parts: {
    readonly trigger: HTMLElement | undefined
    readonly list: HTMLElement | undefined
    readonly items: readonly HTMLElement[]
  },
  view: MenuView,
): void => {
  // role="menu" は `[popover]` 自身に置く。menuitem を**直接**持つ形にする
  applyAttrs(parts.trigger, triggerAttributes(view))
  applyAttrs(parts.list, { role: 'menu' })
  syncAttribute(parts.list, 'aria-labelledby', parts.trigger?.id)
  parts.items.forEach((item, index) => applyAttrs(item, menuItemAttributes(view.items[index])))
}

/** 足りない子と label を 1 つの `console.error` にまとめる（開発時の手がかり。実行は止めない） */
export const reportMissing = (result: ContractCheck<Element>, label: string): void => {
  const missing = [
    result.kind === 'missing' ? `slot="trigger" と [popover]（${result.roles.join(', ')}）` : '',
    label === '' ? 'label（メニューの名前）' : '',
  ].filter((problem) => problem !== '')
  if (missing.length > 0) {
    console.error(`[rd-menu] 必要: ${missing.join(' / ')}`)
  }
}

/** `contextmenu` の座標。キーボード発火（Shift+F10 / Menu キー）は 0,0 なので位置を持たない */
export const pointOf = (event: MouseEvent): Point | undefined =>
  event.clientX === 0 && event.clientY === 0 ? undefined : { x: event.clientX, y: event.clientY }

/**
 * ポインタの位置に置くか、今までどおりトリガーに繋ぐか。`point` があるあいだは
 * `position-anchor` を外して inline の `top` / `left` を生かす
 * （`position-anchor` が無ければ `menu.css` の `position-area` は解決しない）。
 * `resize` / `scroll` には追随しない——`_shared/popover-anchor.ts` と同じ判断。
 */
export const positionMenu = (
  trigger: HTMLElement | undefined,
  list: HTMLElement | undefined,
  name: string,
  options: { readonly placement: AnchorPlacement; readonly point: Point | undefined },
): void => {
  if (options.point === undefined || list === undefined) {
    list?.style.removeProperty('top')
    list?.style.removeProperty('left')
    anchorPopover(trigger, list, name, { placement: options.placement })
    return
  }
  list.style.removeProperty('position-anchor')
  const style = contextPosition(options.point, list.getBoundingClientRect(), {
    width: window.innerWidth,
    height: window.innerHeight,
  })
  list.style.top = `${style.top}px`
  list.style.left = `${style.left}px`
}

/** `rd-menu` の `context` が読み書きする窓口。element の private を外に出さないための入口 */
export type ContextParts = {
  /** 初期化時にだけ読む。後から属性を切り替えても購読は変わらない */
  readonly enabled: () => boolean
  readonly host: HTMLElement
  readonly list: () => HTMLElement | undefined
}

export type ContextController = {
  readonly wire: () => void
  /** 開いているあいだだけ位置を覚える。閉じたら忘れてトリガーに繋ぎ直す */
  readonly sync: (open: boolean) => void
  readonly point: () => Point | undefined
}

/**
 * Context Menu（`rd-menu context`）。ホストに付けるので `[slot="trigger"]` の面＝
 * light DOM の子全体が対象になる。**トリガーのボタンは触らない**——右クリックは近道で、
 * 目に見えるボタンが唯一の保証された入口（APG）。JS 無しではボタンだけが働く。
 */
export const contextController = (parts: ContextParts): ContextController => {
  let point: Point | undefined = undefined
  const onContextMenu = (event: MouseEvent): void => {
    event.preventDefault()
    point = pointOf(event)
    const list = parts.list()
    if (list === undefined) {
      return
    }
    // 開いている面に showPopover() を投げると InvalidStateError で落ち、位置も動かない。
    // 開いているメニューの上でもう一度右クリックできるように、閉じてから開き直す——
    // 同じタスクの中なので `toggle` は 1 回にまとまり（newState は open）、位置だけが変わる
    if (list.matches(':popover-open')) {
      list.hidePopover()
    }
    list.showPopover()
  }
  return {
    wire: (): void => {
      if (parts.enabled()) {
        parts.host.addEventListener('contextmenu', onContextMenu)
      }
    },
    sync: (open: boolean): void => {
      point = open ? point : undefined
    },
    point: (): Point | undefined => point,
  }
}
