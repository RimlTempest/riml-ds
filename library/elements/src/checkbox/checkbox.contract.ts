/**
 * `rd-checkbox` のマークアップ契約（ティア A、ADR-0012）。
 * `<label>` が `<input type="checkbox">` を**包む**形にする（`for` が要らず、文言もタップ標的に入る）。
 * `checkContract` は `querySelector` なので、1 段下でなくても契約を満たせる。
 *
 * マークアップの prop 名 `asSwitch` は属性 `switch` に写す。`switch` は JS の予約語で、
 * ラッパー生成器が `const { switch } = props` を書けないため（plan 006 の制約）。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope label',
    control: ':scope input[type="checkbox"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-checkbox',
    attrs: { switch: '$asSwitch', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'label',
        children: [
          {
            tag: 'input',
            attrs: {
              type: 'checkbox',
              id: '$id',
              name: '$name',
              value: '$defaultValue',
              checked: '$defaultChecked',
              required: '$required',
            },
          },
          { prop: 'label' },
        ],
      },
    ],
  },
} as const satisfies Contract

export type CheckboxMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  /** 送信される値。省略するとブラウザの既定（`on`） */
  readonly defaultValue?: string
  readonly defaultChecked?: boolean
  readonly required?: boolean
  /** 見た目だけをスイッチにする。役割（`role="switch"`）は JS が付ける */
  readonly asSwitch?: boolean
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: CheckboxMarkupProps): string => renderMarkup(contract.tree, props)
