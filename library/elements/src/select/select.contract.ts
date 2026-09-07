/**
 * `rd-select` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<select>`、その中の `<option>` は**利用側が light DOM に書く**。部品は生成しない。
 * `id` は呼び側が渡す（React は `useId`、Astro は props）。
 *
 * `value` 属性は「初期選択」で、`<input value>` と同じ意味論（IDL の `value` は生の選択を返す）。
 * JS が無いときは効かないので、SSR では `<option selected>` を出すこと。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > select',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-select',
    attrs: { hint: '$hint', error: '$error', value: '$defaultValue' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'select',
        attrs: { id: '$id', name: '$name', required: '$required' },
        // `<option>` 群は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す
        // （raw の prop 名は `children` に揃える。ラッパー生成器の制約。plan 006）
        children: [{ raw: '$children' }],
      },
    ],
  },
} as const satisfies Contract

export type SelectMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  /** `<option>` 群。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  readonly required?: boolean
  /** 初期選択。JS が無いときは効かない（`<option selected>` を使う） */
  readonly defaultValue?: string
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: SelectMarkupProps): string => renderMarkup(contract.tree, props)
