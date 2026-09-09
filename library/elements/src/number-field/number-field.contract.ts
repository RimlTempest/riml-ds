/**
 * `rd-number-field` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<input type="number">` は**利用側が light DOM に書く**。部品は生成しない。
 * `id` は呼び側が渡す（React は `useId`、Astro は props）。
 *
 * **値の真実は `<input>`**。`min` / `max` / `step` / `required` も `<input>` の属性なので、
 * JS が来なくてもネイティブの送信・検証・↑↓ の刻みがそのまま働く（部品は読むだけ）。
 * `inputmode` も `pattern` も書かない——`type="number"` がモバイルの数字キーボードを出す。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="number"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-number-field',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          type: 'number',
          id: '$id',
          name: '$name',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          step: '$step',
          required: '$required',
        },
      },
    ],
  },
} as const satisfies Contract

export type NumberFieldMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  /**
   * 初期値。数値の文字列で渡す（属性はすべて文字列）。省略で空欄。
   * **綴りは `defaultValue`**（React ラッパー生成器がティア A の `<input>` に対して固定している名前。
   * `text-field.contract.ts` と同じ）
   */
  readonly defaultValue?: string
  readonly min?: string
  readonly max?: string
  /** 刻み。省略は 1。`any` は使わない（ボタンで刻めないため。純関数が 1 に読む） */
  readonly step?: string
  readonly required?: boolean
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: NumberFieldMarkupProps): string => renderMarkup(contract.tree, props)
