/**
 * `rd-menu` が light DOM を読み書きするための薄い層。判断は `menu.logic.ts`（純関数）、
 * 位置決めは `_shared/popover-anchor.ts` が持つ。ここにあるのは「読む・書く」だけで、
 * `*.element.ts` を 150 行に収める（ADR-0005）ための置き場でもある。
 */
import type { ContractCheck } from '../_shared/contract.js'
import { syncAttribute } from '../_shared/internals.js'
import { nextIndex } from '../_shared/roving-focus.js'
import { menuItemAttributes, type MenuView, triggerAttributes } from './menu.logic.js'

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
