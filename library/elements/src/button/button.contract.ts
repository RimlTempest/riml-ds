/**
 * `rd-button` のマークアップ契約（ティア A、ADR-0012）。
 * ネイティブの `<button>` / `<a href>` を子として包む。送信・押下はブラウザが素で行う。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'
import type { ButtonVariant } from './button.logic.js'

export const contract = {
  pe: 'A',
  roles: { control: ':scope > button, :scope > a[href]' },
  required: ['control'],
  tree: {
    tag: 'rd-button',
    attrs: { variant: '$variant', loading: '$loading' },
    children: [{ tag: 'button', attrs: { type: '$type' }, children: [{ prop: 'label' }] }],
  },
} as const satisfies Contract

export type ButtonMarkupProps = {
  readonly label: string
  readonly type?: 'button' | 'submit' | 'reset'
  readonly variant?: ButtonVariant
  readonly loading?: boolean
}

/** props からティア A のマークアップを作る。Storybook・e2e・ラッパー生成器が同じ木から出す */
export const markup = (props: ButtonMarkupProps): string => renderMarkup(contract.tree, props)
