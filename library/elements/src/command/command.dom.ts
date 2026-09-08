/**
 * `rd-command` が light DOM を読み書きするための層。判断は `command.logic.ts`（純関数）が持ち、
 * ここにあるのは「読む・書く・型で絞る」だけ——`*.element.ts` を 150 行に収める（ADR-0005）
 * ための置き場でもある。
 *
 * **項目は利用側が書いた `<a>` / `<button>` のまま**扱う（`combobox.dom.ts` と違い、この層は
 * 項目を描かない）。隠すのは `<li hidden>` と `<ul hidden>` だけ。
 */
import { html, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import type { FilterMode } from '../_shared/text-filter.js'
import { contract, ITEM_SELECTOR } from './command.contract.js'
import { groupHidden, type Item, itemValue, visibleIndexes } from './command.logic.js'

/** click の発生元をたどる先。`ITEM_SELECTOR` は `:scope` を含むので `closest` に渡せない */
const CLICKABLE = 'a[href], button'

/** 契約の子。`ok` が false なら `malformed`（部品は自分で `<input>` を作らない） */
export type Wiring = {
  readonly ok: boolean
  readonly control: HTMLInputElement | undefined
}

export const NO_WIRING: Wiring = { ok: false, control: undefined }

/** 項目 1 つ。`li` と `ul` は隠す相手、`item` は絞り込みに渡す検索文字列 */
export type ItemNode = {
  readonly element: HTMLElement
  readonly li: HTMLElement | undefined
  readonly ul: HTMLElement | undefined
  readonly item: Item
}

/** 1 回の絞り込みの結果。`visible` は**見えている項目だけ**を並び順で持つ */
export type FilterResult = {
  readonly visible: readonly HTMLElement[]
  readonly count: number
}

export const NO_MATCHES: FilterResult = { visible: [], count: 0 }

const asInput = (element: Element | undefined): HTMLInputElement | undefined =>
  element instanceof HTMLInputElement ? element : undefined

const asElement = (node: Element | null | undefined): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

/** 空の `id` にだけ既定値を入れる。利用側が書いていればそのまま尊重する */
const ensureId = (element: Element, fallback: string): string => {
  element.id = element.id === '' ? fallback : element.id
  return element.id
}

/**
 * 契約を見て子を掴み、入力欄から**すべての `<ul>`** を `aria-controls` で指す
 * （グループは `<ul>` を分けるだけなので、指す先も複数になる）。
 * `role` は載せない——`<input type="search">` のまま、常に見えている一覧を指すだけ。
 */
export const wire = (host: HTMLElement, name: string): Wiring => {
  const result = checkContract(host, contract)
  if (result.kind === 'missing') {
    const missing = result.roles.join(', ')
    console.error(
      `[rd-command] <label for> と <input type="search"> と <ul> が必要（不足: ${missing}）`,
    )
    return NO_WIRING
  }
  const control = asInput(result.found['control'])
  const ids = [...host.querySelectorAll(':scope > ul')].map((list, index) =>
    ensureId(list, `${name}-list-${index}`),
  )
  control?.setAttribute('aria-controls', ids.join(' '))
  return { ok: control !== undefined, control }
}

/** 項目の検索文字列は「表示テキスト + `data-keywords`（空白区切りの別名）」 */
export const readItems = (host: HTMLElement): readonly ItemNode[] =>
  [...host.querySelectorAll(ITEM_SELECTOR)].flatMap((node) => {
    const element = asElement(node)
    return element === undefined
      ? []
      : [
          {
            element,
            li: asElement(element.parentElement),
            ul: asElement(element.parentElement?.parentElement),
            item: {
              text: element.textContent?.trim() ?? '',
              keywords: element.dataset['keywords'] ?? '',
            },
          },
        ]
  })

/** `<ul>` ごとの項目の番号（見出しだけ残さないために `<ul>` 単位で判断する） */
const groupsOf = (
  nodes: readonly ItemNode[],
): readonly { readonly ul: HTMLElement; readonly indexes: readonly number[] }[] =>
  [...new Set(nodes.flatMap((node) => (node.ul === undefined ? [] : [node.ul])))].map((ul) => ({
    ul,
    indexes: nodes.flatMap((node, index) => (node.ul === ul ? [index] : [])),
  }))

/**
 * 絞り込みの結果を light DOM に書く。**`hidden` 属性しか書かない**——
 * `observeItems` が `attributes` を見ないので、ここでの書き込みが観測を呼び戻さない。
 */
export const applyFilter = (
  nodes: readonly ItemNode[],
  query: string,
  mode: FilterMode,
): FilterResult => {
  const visible = visibleIndexes(
    nodes.map((node) => node.item),
    query,
    mode,
  )
  nodes.forEach((node, index) => {
    node.li?.toggleAttribute('hidden', !visible.includes(index))
  })
  groupsOf(nodes).forEach((group) => {
    group.ul.toggleAttribute('hidden', groupHidden(visible, group.indexes))
  })
  return {
    visible: visible.flatMap((index) => {
      const node = nodes[index]
      return node === undefined ? [] : [node.element]
    }),
    count: visible.length,
  }
}

/**
 * 項目の増減・書き換えに追随する。`attributes` は見ない——`applyFilter` が書く
 * `hidden` で呼び戻されて無限に回るのを防ぐ（保守メモ）。
 */
export const observeItems = (host: HTMLElement, onChange: () => void): MutationObserver => {
  const observer = new MutationObserver(onChange)
  observer.observe(host, { childList: true, subtree: true, characterData: true })
  return observer
}

/** `KeyboardEvent` でなければ空のキー（`Listeners` は `Event` しか渡さない） */
export const keyOf = (event: Event): { readonly key: string; readonly modified: boolean } =>
  event instanceof KeyboardEvent
    ? { key: event.key, modified: event.ctrlKey || event.metaKey || event.altKey }
    : { key: '', modified: false }

/** 見えている項目の中での現在地。項目の上で押されたのでなければ -1 */
export const visibleIndexOf = (event: Event, visible: readonly HTMLElement[]): number =>
  visible.findIndex((item) => item === event.target)

export const focusVisible = (visible: readonly HTMLElement[], index: number): void =>
  visible[index]?.focus()

/** 値を書いて `input` を発火する（利用側のリスナにも同じ形で届く） */
export const setQuery = (control: HTMLInputElement | undefined, value: string): void => {
  if (control === undefined) {
    return
  }
  control.value = value
  control.dispatchEvent(new Event('input', { bubbles: true }))
}

/** 項目の上で打たれた 1 文字を入力欄の末尾に足す（`char` が無ければ末尾を 1 文字消す） */
export const typeInto = (control: HTMLInputElement | undefined, char: string | undefined): void => {
  const current = control?.value ?? ''
  setQuery(control, char === undefined ? current.slice(0, -1) : `${current}${char}`)
  control?.focus()
}

/**
 * 0 件の知らせ。**常に描いて `hidden` で切り替える**——`role="status"` の領域は
 * 最初から木にあるべきで、後から挿すと読み上げが間に合わない（ADR-0008 §6）。
 */
export const renderEmpty = (copy: string, show: boolean): TemplateResult =>
  html`<p part="empty" role="status" ?hidden=${!show}>${copy}</p>`

/**
 * 押された項目を知らせる。**既定動作は妨げない**（リンクは飛び、ボタンは利用側の
 * `click` が動く）。値は `data-value` → `value` → `href` → テキストの順。
 */
export const commitItem = (host: HTMLElement, event: Event, nodes: readonly ItemNode[]): void => {
  const target = event.target instanceof Element ? event.target.closest(CLICKABLE) : null
  const node = nodes.find((candidate) => candidate.element === target)
  if (node === undefined) {
    return
  }
  const detail = {
    value: itemValue({
      dataValue: node.element.getAttribute('data-value'),
      value: node.element.getAttribute('value'),
      href: node.element.getAttribute('href'),
      text: node.item.text,
    }),
    label: node.item.text,
  }
  host.dispatchEvent(new CustomEvent('rd-select', { bubbles: true, composed: true, detail }))
}
