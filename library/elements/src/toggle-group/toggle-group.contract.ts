/**
 * `rd-toggle-group` のマークアップ契約（ティア A、ADR-0012）。
 * `<fieldset>` / `<legend>` / `<button aria-pressed>` は**利用側が light DOM に書く**。
 * 部品は生成しない（`toggleItemMarkup` は文字列を組む純関数で、DOM を作らない）。
 *
 * 押下の真実は各 `<button>` の `aria-pressed` 属性だけ。JS が無いときは「押しても変わらない
 * 普通のボタンの列」に縮退する（害は無い。`rd-toggle` と同じ判断）。
 *
 * **項目は `<button>` 直書きだけ**。`rd-toggle` を中に入れる形は許さない（押下の所有者が
 * 二重になる。`docs/proposals/toggle-group.md`）。
 * **送信に載せる値なら使わない** — `rd-radio-group segmented` / `rd-checkbox-group segmented` を使う。
 */
import type { Contract } from '../_shared/contract.js'
import type { MarkupTree } from '../_shared/markup.js'
import { renderMarkup } from '../_shared/markup.js'
import type { ToggleVariant } from '../toggle/toggle.logic.js'
import type { ToggleGroupMode } from './toggle-group.logic.js'

/** 列の項目。`updated` の `querySelectorAll` と契約の `item` が同じ形を指す */
export const ITEM_SELECTOR = ':scope > fieldset > [part="options"] > button'

export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    options: ':scope > fieldset > [part="options"]',
    // 1 個以上。`checkContract` は `querySelector` なので最初の 1 個で判定する
    item: ITEM_SELECTOR,
  },
  required: ['fieldset', 'legend', 'options', 'item'],
  tree: {
    tag: 'rd-toggle-group',
    attrs: { mode: '$mode', orientation: '$orientation', variant: '$variant' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 項目は生 HTML。利用側が `toggleItemMarkup(...)` で組む
          { tag: 'div', attrs: { part: 'options' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
} as const satisfies Contract

/** 項目 1 個分の木。`markup()` の木とは別（利用側が並べて `children` に渡す） */
const itemTree: MarkupTree = {
  tag: 'button',
  attrs: {
    type: 'button',
    value: '$value',
    'aria-pressed': '$pressed',
    disabled: '$disabled',
  },
  children: [{ prop: 'label' }],
}

export type ToggleItemMarkupProps = {
  /** ボタンのアクセシブル名。省略不可 */
  readonly label: string
  /** `rd-change` の `detail.values` に載る値 */
  readonly value: string
  /**
   * `aria-pressed` の値。**省略すると `'false'` を書く** — 属性ごと消えると
   * toggle ではなくただのボタンになるため（`rd-toggle` と同じ理由）。
   */
  readonly pressed?: 'true' | 'false'
  /** 無効化はネイティブの `disabled` に任せる（部品は `disabled` 属性を持たない） */
  readonly disabled?: boolean
}

/** `<button type="button" value="…" aria-pressed="…">文言</button>` を組む */
export const toggleItemMarkup = (props: ToggleItemMarkupProps): string =>
  renderMarkup(itemTree, { ...props, pressed: props.pressed ?? 'false' })

export type ToggleGroupMarkupProps = {
  /** `<legend>`。group のアクセシブル名になる。省略不可 */
  readonly label: string
  /** 項目。**エスケープされない**ので `toggleItemMarkup` の出力だけを渡す */
  readonly children: string
  /** `single` なら 1 個だけ押せる。既定は `multiple` */
  readonly mode?: ToggleGroupMode
  /** 矢印キーの向き。既定は `horizontal` */
  readonly orientation?: 'horizontal' | 'vertical'
  /** `rd-toggle` と同じ見た目の名前を再利用する。既定は `outline` */
  readonly variant?: ToggleVariant
}

export const markup = (props: ToggleGroupMarkupProps): string => renderMarkup(contract.tree, props)
