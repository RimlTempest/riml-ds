/**
 * `rd-dialog` のマークアップ契約（ティア B、ADR-0012）。
 * 枠（`<dialog>`）だけが shadow にあり、見出し・本文・アクションはすべて slot（light DOM）。
 * JS が無いときは `:not(:defined)` の CSS が受け、内容が inline のセクションとして読める。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'B',
  roles: { label: ':scope > [slot="label"]' },
  required: ['label'],
  tree: {
    tag: 'rd-dialog',
    attrs: { open: '$open', persistent: '$persistent' },
    children: [
      { tag: 'h2', slot: 'label', children: [{ prop: 'label' }] },
      // children は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す（renderMarkup はエスケープしない）
      { raw: '$children' },
    ],
  },
} as const satisfies Contract

export type DialogMarkupProps = {
  readonly label: string
  /** 本文とアクション。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  readonly open?: boolean
  /** Esc と背面クリックで閉じない。既定は false（閉じられる） */
  readonly persistent?: boolean
}

export const markup = (props: DialogMarkupProps): string => renderMarkup(contract.tree, props)
