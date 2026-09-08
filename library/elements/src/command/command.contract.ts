/**
 * `rd-command` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<input type="search">`、項目の `<ul><li>` は**利用側が light DOM に書く**。
 * 部品は項目を生成しない（`rd-menu` と同じ）。`id` は呼び側が渡す（React は `useId`、Astro は props）。
 *
 * 項目を**本物のリンク／ボタンのまま**にするのがこの部品の要（`role="option"` に書き換えない）。
 * JS が無ければ入力欄は飾りになるが、一覧はそのまま辿れる。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

/**
 * 押せる項目。**`roles` には入れない**——`checkContract` は `querySelector` で 1 個目しか
 * 見ないので、複数一致する役割は契約で必須にできない（`rd-menu` の `ITEM_SELECTOR` と同じ）。
 */
export const ITEM_SELECTOR = ':scope > ul > li > :is(a[href], button)'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="search"]',
    list: ':scope > ul',
  },
  required: ['label', 'control', 'list'],
  tree: {
    tag: 'rd-command',
    attrs: { filter: '$filter', 'empty-text': '$emptyText' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          type: 'search',
          // 履歴の吹き出しと項目の一覧が二重に出ないようにする
          autocomplete: 'off',
          placeholder: '$placeholder',
          // 初期の絞り込み文字（React の uncontrolled な `defaultValue` に写る）
          value: '$defaultValue',
        },
      },
      // 項目は生 HTML。利用側が `commandGroupMarkup()` / `commandItemMarkup()` で組み立てる
      { raw: '$groups' },
    ],
  },
} as const satisfies Contract

/** 絞り込みの仕方。`none` は「サーバー側で絞る」利用側向け */
export type CommandFilter = 'contains' | 'prefix' | 'none'

export type CommandMarkupProps = {
  readonly id: string
  readonly label: string
  /** `commandGroupMarkup()` を並べた断片。**エスケープされない**ので信頼済みの断片だけ */
  readonly groups: string
  readonly placeholder?: string
  /** 最初から入っている絞り込み文字。JS 無しでも `<input value>` として残る */
  readonly defaultValue?: string
  readonly filter?: CommandFilter
  /** 0 件のときの文言。既定はページの言語で決まる（`command.logic.ts` の `emptyCopy`） */
  readonly emptyText?: string
}

export type CommandGroupMarkupProps = {
  /** 見出し。`command.css` が `aria-label` から描くので、DOM に二重の文字を置かない */
  readonly label?: string
  /** `commandItemMarkup()` を並べた断片。**エスケープされない** */
  readonly items: string
}

export type CommandItemMarkupProps = {
  readonly label: string
  /** 移動する項目はリンクにする（JS 無しでも辿れる。⌘クリックで新しいタブも残る） */
  readonly href?: string
  /** `rd-select` の `value`。省略すると `href` かテキストが値になる */
  readonly value?: string
  /** 空白区切りの別名（「設定 preferences config」）。表示テキストと一緒に検索される */
  readonly keywords?: string
  /** 近道の表示。見た目だけで、キーの購読は利用側が行う */
  readonly shortcut?: string
}

/** 値が無ければ属性ごと出さない（`undefined` と空文字を同じに扱う） */
const attr = (name: string, value: string | undefined): string =>
  value === undefined || value === '' ? '' : ` ${name}="${escapeHtml(value)}"`

/**
 * グループ 1 つ。**`<ul>` を分けるだけ**が「グループ」の実体で、見出しは `aria-label` から
 * CSS が描く。`<li>` に見出しを混ぜると項目の並びに紛れる（読み上げの数が合わなくなる）。
 */
export const commandGroupMarkup = (props: CommandGroupMarkupProps): string =>
  `<ul${attr('aria-label', props.label)}>${props.items}</ul>`

/**
 * 項目 1 つ。`href` があればリンク、無ければボタン。**役割は書き換えない**——
 * リンクの「Enter で飛ぶ」「⌘クリックで新しいタブ」をネイティブに残す（`docs/proposals/command.md`）。
 * リンクは `value` 属性を持てないので値は `data-value` に、ボタンは `value` に入れる。
 */
export const commandItemMarkup = (props: CommandItemMarkupProps): string => {
  const shortcut =
    props.shortcut === undefined || props.shortcut === ''
      ? ''
      : `<kbd class="rd-kbd">${escapeHtml(props.shortcut)}</kbd>`
  const inner = `${escapeHtml(props.label)}${shortcut}`
  const keywords = attr('data-keywords', props.keywords)
  const control =
    props.href === undefined
      ? `<button type="button"${attr('value', props.value)}${keywords}>${inner}</button>`
      : `<a href="${escapeHtml(props.href)}"${attr('data-value', props.value)}${keywords}>${inner}</a>`
  return `<li>${control}</li>`
}

export const markup = (props: CommandMarkupProps): string => renderMarkup(contract.tree, props)
