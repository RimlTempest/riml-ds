/**
 * `rd-disclosure` のマークアップ契約（ティア A、ADR-0012）。
 * ティア A は「light DOM でネイティブを包む」作り方の名前で、フォーム部品に限らない。
 * `<details>` / `<summary>` がそのまま開閉するので、JS が無くても**動く**。
 *
 * `group`（`<details name>`）を揃えると排他アコーディオンになる（Baseline 2024）。
 * 対応していないブラウザは属性を無視し、それぞれ独立に開閉する（退行しない）。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    details: ':scope > details',
    summary: ':scope > details > summary',
  },
  required: ['details', 'summary'],
  tree: {
    tag: 'rd-disclosure',
    children: [
      {
        tag: 'details',
        attrs: { name: '$group', open: '$open' },
        children: [
          { tag: 'summary', children: [{ prop: 'label' }] },
          // 本文は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す
          { raw: '$children' },
        ],
      },
    ],
  },
} as const satisfies Contract

export type DisclosureMarkupProps = {
  readonly label: string
  /** 本文。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  /** `<details name>`。同じ値どうしは排他（1 つ開くと他が閉じる） */
  readonly group?: string
  readonly open?: boolean
}

export const markup = (props: DisclosureMarkupProps): string => renderMarkup(contract.tree, props)
