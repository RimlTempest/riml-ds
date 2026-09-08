/**
 * `rd-slider` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` / `<input type="range">` / `<output for>` は**利用側が light DOM に書く**。
 * 値・範囲・刻みはネイティブが持ち、部品は塗りの割合と `<output>` の文言を書くだけ。
 *
 * `<output>` の中身に初期値を書いてあるのは、JS が無いときにそこが動かないため
 * （ティア A: 動く ≠ 同じ見た目）。目盛（`<datalist>`）は利用側が置き、`list` で結ぶ。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="range"]',
    // 任意。無ければ部品は文言を書かない
    output: ':scope > output',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-slider',
    attrs: { orientation: '$orientation', hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          type: 'range',
          id: '$id',
          name: '$name',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          step: '$step',
          list: '$list',
        },
      },
      { tag: 'output', attrs: { for: '$id' }, children: [{ prop: 'defaultValue' }] },
    ],
  },
} as const satisfies Contract

export type SliderOrientation = 'horizontal' | 'vertical'

export type SliderMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  /** 初期値。数値の文字列で渡す（属性はすべて文字列） */
  readonly defaultValue: string
  readonly min?: string
  readonly max?: string
  readonly step?: string
  /** 目盛の `<datalist>` の id。`<datalist>` 自体は利用側が置く */
  readonly list?: string
  /** 既定は horizontal。縦向きは上が最大になる */
  readonly orientation?: SliderOrientation
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: SliderMarkupProps): string => renderMarkup(contract.tree, props)
