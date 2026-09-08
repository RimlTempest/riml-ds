/**
 * `rd-data-table` のマークアップ契約（ティア A、ADR-0012）。
 * 表そのもの（`<table class="rd-table">` と `<caption>` / `<thead>` / `<tbody>`）は
 * **利用側が light DOM に書く**。部品は行を作らない——並べ替えるだけ。
 *
 * 並べ替えられる列は `th[data-sort]` で利用側が印を付ける（`text` / `number` / `date`）。
 * セルの比較キーは `td[data-value]`、無ければ `textContent`。「1,234 GB」のような
 * 表示用の文言と比較キーを分けるためにある。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

/**
 * 並べ替えられる見出し。**`roles` には入れない**——`checkContract` は `querySelector` で
 * 1 個目しか見ないので、複数一致する役割は契約で必須にできない（`rd-menu` の `ITEM_SELECTOR` と同じ）。
 */
export const SORTABLE_SELECTOR = ':scope > table > thead > tr > th[data-sort]'

export const contract = {
  pe: 'A',
  roles: {
    table: ':scope > table',
    caption: ':scope > table > caption',
    head: ':scope > table > thead',
    body: ':scope > table > tbody',
  },
  required: ['table', 'caption', 'head', 'body'],
  tree: {
    tag: 'rd-data-table',
    attrs: { column: '$column', direction: '$direction', manual: '$manual' },
    children: [
      {
        tag: 'table',
        attrs: { class: 'rd-table' },
        children: [
          { tag: 'caption', children: [{ prop: 'caption' }] },
          // 見出し行と本体は生 HTML。利用側が dataTableHeadMarkup() / dataTableBodyMarkup() で組み立てる
          { raw: '$head' },
          { raw: '$body' },
        ],
      },
    ],
  },
} as const satisfies Contract

/** 並べ替えの向き。`aria-sort` の値と同じ綴り（APG「Sortable Table」） */
export type SortDirection = 'ascending' | 'descending'

/** 列の比べ方。既定は `text`（`Intl.Collator`） */
export type SortType = 'text' | 'number' | 'date'

/** 見出し 1 つ。`sort` を書いた列だけが並べ替えられる */
export type DataTableColumn = {
  readonly label: string
  /** 書くとその列が並べ替えられるようになる */
  readonly sort?: SortType
  /** `rd-sort` の `detail.key`。利用側がサーバー側の列名を入れる */
  readonly key?: string
  /** 数の列（桁を揃えて行末に寄せる。`.rd-table` の atoms） */
  readonly numeric?: boolean
}

/** セル 1 つ。`value` があれば比較キーになる（「1,234」を 1234 として比べる） */
export type DataTableCell = {
  readonly text: string
  readonly value?: string
  readonly numeric?: boolean
}

export type DataTableMarkupProps = {
  readonly caption: string
  /** `dataTableHeadMarkup()` の断片。**エスケープされない** */
  readonly head: string
  /** `dataTableBodyMarkup()` の断片。**エスケープされない** */
  readonly body: string
  /** 最初に並べ替える列（0 始まり）。属性は文字列なので `'1'` の形で渡す */
  readonly column?: string
  readonly direction?: SortDirection
  /** 行を動かさず `aria-sort` と `rd-sort` だけにする（サーバー側で並べ替える利用側） */
  readonly manual?: boolean
}

/** `data-*` の属性 1 つ。値が無ければ書かない（boolean は存在で true） */
const dataAttr = (name: string, value: string | undefined): string =>
  value === undefined ? '' : ` data-${name}="${escapeHtml(value)}"`

const flagAttr = (name: string, on: boolean | undefined): string =>
  on === true ? ` data-${name}` : ''

/** 見出し行。`scope="col"` は表の意味論に要る（読み上げが列の名前として使う） */
export const dataTableHeadMarkup = (columns: readonly DataTableColumn[]): string => {
  const cells = columns
    .map(
      (column) =>
        `<th scope="col"${dataAttr('sort', column.sort)}${dataAttr('key', column.key)}`
        + `${flagAttr('numeric', column.numeric)}>${escapeHtml(column.label)}</th>`,
    )
    .join('')
  return `<thead><tr>${cells}</tr></thead>`
}

/** 行 1 つ。比較キーが表示と違うときだけ `data-value` を書く */
export const dataTableRowMarkup = (cells: readonly DataTableCell[]): string => {
  const tds = cells
    .map(
      (cell) =>
        `<td${dataAttr('value', cell.value)}${flagAttr('numeric', cell.numeric)}>`
        + `${escapeHtml(cell.text)}</td>`,
    )
    .join('')
  return `<tr>${tds}</tr>`
}

/** `dataTableRowMarkup()` の断片をまとめる（`<tbody>` は 1 つだけ） */
export const dataTableBodyMarkup = (rows: readonly string[]): string =>
  `<tbody>${rows.join('')}</tbody>`

export const markup = (props: DataTableMarkupProps): string => renderMarkup(contract.tree, props)
