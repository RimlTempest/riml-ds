/**
 * `rd-text-field` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<input>` は**利用側が light DOM に書く**。部品は生成しない。
 * `id` は呼び側が渡す（React は `useId`、Astro は props）。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input, :scope > textarea',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-text-field',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: '$type',
          required: '$required',
          autocomplete: '$autocomplete',
          value: '$defaultValue',
        },
      },
    ],
  },
} as const satisfies Contract

export type TextFieldType = 'text' | 'email' | 'url' | 'tel' | 'search' | 'password'

export type TextFieldMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  readonly type?: TextFieldType
  readonly required?: boolean
  readonly autocomplete?: string
  readonly defaultValue?: string
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: TextFieldMarkupProps): string => renderMarkup(contract.tree, props)
