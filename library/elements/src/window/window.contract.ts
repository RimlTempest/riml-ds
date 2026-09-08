/**
 * `rd-window` のマークアップ契約（ティア B、ADR-0012）。
 * 枠と帯だけが shadow にあり、見出しと本文は slot（light DOM）。
 * **見出しは利用側が置く**——文書構造は利用側のもの（ADR-0014 却下案）。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'B',
  roles: { title: ':scope > [slot="title"]' },
  required: ['title'],
  tree: {
    tag: 'rd-window',
    attrs: {
      closable: '$closable',
      expandable: '$expandable',
      collapsible: '$collapsible',
      collapsed: '$collapsed',
      tone: '$tone',
    },
    children: [
      { tag: 'h2', slot: 'title', children: [{ prop: 'title' }] },
      // children は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す（renderMarkup はエスケープしない）
      { raw: '$children' },
    ],
  },
} as const satisfies Contract

export type WindowMarkupProps = {
  readonly title: string
  /** 本文。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  /** 閉じる（×）の丸を出す */
  readonly closable?: boolean
  /** 広げる（□）の丸を出す */
  readonly expandable?: boolean
  /** たたむ（−）の丸を出す */
  readonly collapsible?: boolean
  /** 最初からたたんでおく */
  readonly collapsed?: boolean
  /** 帯の色。省略は chrome（インク） */
  readonly tone?: 'chrome' | 'accent' | 'warning' | 'danger'
}

export const markup = (props: WindowMarkupProps): string => renderMarkup(contract.tree, props)
