/**
 * `rd-meter` のマークアップ契約（ティア A、ADR-0012）。
 * ネイティブ `<meter>` / `<progress>` を**利用側が light DOM に書く**。部品は生成しない。
 * JS が無くてもネイティブの見た目で値が読める（brand.md §7.5）。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > meter, :scope > progress',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-meter',
    attrs: { tone: '$tone' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'meter',
        attrs: { id: '$id', value: '$value', max: '$max', min: '$min' },
        children: [{ prop: 'text' }],
      },
    ],
  },
} as const satisfies Contract

export type MeterMarkupProps = {
  readonly id: string
  readonly label: string
  /** `<meter>` の値。数値の文字列で渡す（属性はすべて文字列） */
  readonly value: string
  readonly max: string
  readonly min?: string
  /** 中身のフォールバック文言。`<meter>` を描けないブラウザに出る（例「3.2 GB / 10 GB」） */
  readonly text: string
  /**
   * 塗りの意味色。既定（省略）は accent。
   * 属性名を `data-tone` にしないのは、ラッパー生成器がハイフン付きの JSX prop を出せないため。
   */
  readonly tone?: 'success' | 'warning' | 'danger'
}

export const markup = (props: MeterMarkupProps): string => renderMarkup(contract.tree, props)
