/**
 * `rd-radio-group` のマークアップ契約（ティア A、ADR-0012）。
 * `<fieldset>` / `<legend>` / `<label><input type="radio">` は**利用側が light DOM に書く**。
 * 部品は生成しない（`radioOptionMarkup` は文字列を組む純関数で、DOM を作らない）。
 *
 * `segmented` は**見た目だけ**を区画に変える（`rd-checkbox` の `switch` と同じ判断）。
 * 送信・矢印キーでの移動・読み上げは radio のままで、JS が無くても退行しない。
 */
import type { Contract } from '../_shared/contract.js'
import type { MarkupTree } from '../_shared/markup.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    // 1 個以上。`checkContract` は `querySelector` なので最初の 1 個で判定する
    options: ':scope > fieldset label',
    control: ':scope > fieldset input[type="radio"]',
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-radio-group',
    attrs: { segmented: '$segmented', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 選択肢は生 HTML。利用側が `radioOptionMarkup(...)` で組む
          { tag: 'div', attrs: { part: 'options' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
} as const satisfies Contract

/** 選択肢 1 個分の木。`markup()` の木とは別（利用側が並べて `children` に渡す） */
const optionTree: MarkupTree = {
  tag: 'label',
  children: [
    {
      tag: 'input',
      attrs: {
        type: 'radio',
        id: '$id',
        name: '$name',
        value: '$value',
        checked: '$defaultChecked',
        required: '$required',
        disabled: '$disabled',
      },
    },
    { prop: 'label' },
  ],
}

export type RadioOptionMarkupProps = {
  readonly id: string
  readonly name: string
  readonly value: string
  readonly label: string
  readonly defaultChecked?: boolean
  readonly disabled?: boolean
  /**
   * `required` は**最初の 1 個にだけ**付ければよい。同名 radio のどれかに `required` があれば
   * HTML の仕様で group 全体が必須になる。
   */
  readonly required?: boolean
}

/** `<label><input type="radio" …>文言</label>` を組む。文言も属性値もエスケープされる */
export const radioOptionMarkup = (props: RadioOptionMarkupProps): string =>
  renderMarkup(optionTree, props)

export type RadioGroupMarkupProps = {
  /** `<legend>`。group のアクセシブル名になる。省略不可 */
  readonly label: string
  /** 選択肢。**エスケープされない**ので `radioOptionMarkup` の出力だけを渡す */
  readonly children: string
  /** 見た目だけを区画（セグメント）にする。役割は radio のまま */
  readonly segmented?: boolean
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: RadioGroupMarkupProps): string => renderMarkup(contract.tree, props)
