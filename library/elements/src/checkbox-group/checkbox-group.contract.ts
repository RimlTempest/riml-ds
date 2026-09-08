/**
 * `rd-checkbox-group` のマークアップ契約（ティア A、ADR-0012）。
 * `<fieldset>` / `<legend>` / `<label><input type="checkbox">` は**利用側が light DOM に書く**。
 * 部品は生成しない（`checkboxOptionMarkup` は文字列を組む純関数で、DOM を作らない）。
 *
 * `segmented` は**見た目だけ**を区画に変える（`rd-radio-group` と対になる複数選択版）。
 * 送信・読み上げは checkbox のままで、JS が無くても退行しない。
 *
 * `required` は radio と違い**各 checkbox に個別に効く**（HTML の仕様）。「1 つ以上選べ」は
 * `min` 属性で部品が見る（**JS が無いと効かない**。`docs/proposals/checkbox-group.md`）。
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
    control: ':scope > fieldset input[type="checkbox"]',
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-checkbox-group',
    attrs: { segmented: '$segmented', min: '$min', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 選択肢は生 HTML。利用側が `checkboxOptionMarkup(...)` で組む
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
        type: 'checkbox',
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

export type CheckboxOptionMarkupProps = {
  readonly id: string
  /** 同じ `name` を並べると `?tags=a&tags=b` の形で送信される */
  readonly name: string
  readonly value: string
  readonly label: string
  readonly defaultChecked?: boolean
  readonly disabled?: boolean
  /**
   * radio と違い**その 1 個だけ**が必須になる（HTML の仕様）。
   * 「どれか 1 つ以上」は group の `min` 属性で表す。
   */
  readonly required?: boolean
}

/** `<label><input type="checkbox" …>文言</label>` を組む。文言も属性値もエスケープされる */
export const checkboxOptionMarkup = (props: CheckboxOptionMarkupProps): string =>
  renderMarkup(optionTree, props)

export type CheckboxGroupMarkupProps = {
  /** `<legend>`。group のアクセシブル名になる。省略不可 */
  readonly label: string
  /** 選択肢。**エスケープされない**ので `checkboxOptionMarkup` の出力だけを渡す */
  readonly children: string
  /** 見た目だけを区画（セグメント）にする。役割は checkbox のまま */
  readonly segmented?: boolean
  /** 最低いくつ選ぶか。`'1'` で「1 つ以上」。**JS が無いと効かない** */
  readonly min?: string
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: CheckboxGroupMarkupProps): string =>
  renderMarkup(contract.tree, props)
