/**
 * `rd-combobox` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<input list>`、候補の `<datalist><option>` は**利用側が light DOM に書く**。
 * 部品は候補を生成しない（`rd-select` と同じ）。`id` / `listId` は呼び側が渡す
 * （React は `useId`、Astro は props）。
 *
 * `control` のセレクタが `input[list]` なのは「**JS が無くても候補が出る形**になっているか」を
 * 契約で見るため。部品は定義後に `list` 属性を外して ARIA の combobox パターンへ置き換えるので、
 * `checkContract` は `firstUpdated` の**先頭**（属性を外す前）で 1 回だけ呼ぶ。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

/**
 * `<datalist>` の候補。**`roles` には入れない**——`checkContract` は `querySelector` で
 * 1 個目しか見ないので、複数一致する役割は契約で必須にできない（`rd-menu` の `ITEM_SELECTOR` と同じ）。
 */
export const ITEM_SELECTOR = ':scope > datalist > option'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[list]',
    options: ':scope > datalist',
  },
  required: ['label', 'control', 'options'],
  tree: {
    tag: 'rd-combobox',
    attrs: { hint: '$hint', error: '$error', filter: '$filter' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          list: '$listId',
          type: 'text',
          // ブラウザの自動補完と候補リストが二重に出ないようにする（APG も off を求める）
          autocomplete: 'off',
          required: '$required',
          placeholder: '$placeholder',
          pattern: '$pattern',
          title: '$title',
          value: '$defaultValue',
        },
      },
      // `<option>` 群は生 HTML。利用側が `comboboxOptionMarkup()` で組み立てた断片だけを渡す
      // （raw の prop 名は `children` に揃える。ラッパー生成器の制約。plan 006）
      { tag: 'datalist', attrs: { id: '$listId' }, children: [{ raw: '$children' }] },
    ],
  },
} as const satisfies Contract

/** 絞り込みの仕方。`none` は「サーバー側で絞る」利用側向け */
export type ComboboxFilter = 'contains' | 'prefix' | 'none'

export type ComboboxMarkupProps = {
  readonly id: string
  /** `<datalist>` の id。`${id}-list` を利用側が渡す（React は useId） */
  readonly listId: string
  readonly label: string
  readonly name: string
  /** `<option value="…">表示名</option>` 群。**エスケープされない**ので信頼済みの断片だけ */
  readonly children: string
  readonly filter?: ComboboxFilter
  readonly required?: boolean
  readonly placeholder?: string
  /** 候補限定にしたいときはこれで縛る（ネイティブ検証。`_shared/field.ts` が文言を出す） */
  readonly pattern?: string
  readonly title?: string
  readonly defaultValue?: string
  readonly hint?: string
  readonly error?: string
}

/**
 * 候補 1 つ。`value` が値で、テキストがあれば表示名になる（無ければ `value` が表示名）。
 * `menuItemMarkup` と同じ役目で、値も表示名も必ずエスケープする。
 */
export const comboboxOptionMarkup = (props: {
  readonly value: string
  readonly label?: string
}): string => `<option value="${escapeHtml(props.value)}">${escapeHtml(props.label ?? '')}</option>`

export const markup = (props: ComboboxMarkupProps): string => renderMarkup(contract.tree, props)
