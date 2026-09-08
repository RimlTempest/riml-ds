/**
 * `rd-toggle` のマークアップ契約（ティア A、ADR-0012）。
 * `<button type="button" aria-pressed>` は**利用側が light DOM に書く**。部品は生成しない。
 *
 * 押下の真実は `aria-pressed` 属性だけ。JS が無いときは「押しても変わらない普通のボタン」に
 * 縮退する（害は無い）。**送信に載せる値なら `rd-checkbox`（`switch`）を使う**。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'
import type { ToggleVariant } from './toggle.logic.js'

export const contract = {
  pe: 'A',
  roles: { control: ':scope > button' },
  required: ['control'],
  tree: {
    tag: 'rd-toggle',
    attrs: { variant: '$variant' },
    children: [
      {
        tag: 'button',
        attrs: { type: 'button', 'aria-pressed': '$pressed' },
        children: [{ prop: 'label' }],
      },
    ],
  },
} as const satisfies Contract

export type ToggleMarkupProps = {
  /** ボタンのアクセシブル名。省略不可 */
  readonly label: string
  /**
   * `aria-pressed` の値。**省略すると `'false'` を書く** — 属性ごと消えると
   * toggle ではなくただのボタンになるため。
   */
  readonly pressed?: 'true' | 'false'
  readonly variant?: ToggleVariant
}

export const markup = (props: ToggleMarkupProps): string =>
  renderMarkup(contract.tree, { ...props, pressed: props.pressed ?? 'false' })
