/**
 * `rd-input-otp` のマークアップ契約（ティア A、ADR-0012）。
 * 桁ごとの `<input>` は**利用側が light DOM に書く**（`otpCellsMarkup` は文字列を組む純関数）。
 *
 * 値は桁ごとに `name-1..N` の N フィールドとして送信される。JS が無くても Tab で 1 桁ずつ
 * 入力して送信できる。連結した値が欲しい利用側は `el.value` を読むか、サーバで連結する。
 */
import type { Contract } from '../_shared/contract.js'
import type { MarkupTree } from '../_shared/markup.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    // 桁。`checkContract` は `querySelector` なので最初の 1 個で判定する
    control: ':scope > fieldset input',
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-input-otp',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 桁は生 HTML。利用側が `otpCellsMarkup(...)` で組む
          { tag: 'div', attrs: { part: 'cells' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
} as const satisfies Contract

/** 桁 1 個分の木。`markup()` の木とは別（`otpCellsMarkup` が並べて `children` に渡す） */
const cellTree: MarkupTree = {
  tag: 'input',
  attrs: {
    type: 'text',
    inputmode: 'numeric',
    pattern: '[0-9]',
    maxlength: '1',
    id: '$id',
    name: '$name',
    'aria-label': '$label',
    required: true,
    autocomplete: '$autocomplete',
  },
}

export type OtpCellsMarkupProps = {
  /** 桁の `name` / `id` の接頭辞。`code` なら `code-1` … `code-6` */
  readonly name: string
  /** 桁数。既定 6。**`markup()` だけが使う**（部品は実際の `<input>` の数を数える） */
  readonly length?: number
  /** `autocomplete="one-time-code"` を**最初の 1 桁だけ**に付ける。既定 true */
  readonly autocomplete?: boolean
}

/**
 * 桁の `<input>` を並べた HTML を組む。属性値はエスケープされる。
 * `aria-label` は「N 桁目」で固定（`markup()` は静的なので UI 言語を見ない。
 * 英語が要る利用側は `children` を自分で組む）。
 */
export const otpCellsMarkup = (props: OtpCellsMarkupProps): string =>
  Array.from({ length: props.length ?? 6 }, (_, index) =>
    renderMarkup(cellTree, {
      id: `${props.name}-${index + 1}`,
      name: `${props.name}-${index + 1}`,
      label: `${index + 1} 桁目`,
      ...(index === 0 && props.autocomplete !== false ? { autocomplete: 'one-time-code' } : {}),
    }),
  ).join('')

export type InputOtpMarkupProps = {
  /** `<legend>`。group のアクセシブル名になる。省略不可 */
  readonly label: string
  /** 桁。**エスケープされない**ので `otpCellsMarkup` の出力だけを渡す */
  readonly children: string
  readonly hint?: string
  readonly error?: string
}

export const markup = (props: InputOtpMarkupProps): string => renderMarkup(contract.tree, props)
