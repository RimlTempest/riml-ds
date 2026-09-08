/**
 * `rd-data-table` が light DOM を読み書きするための層。判断は `data-table.logic.ts`（純関数）が
 * 持つ。ここにあるのは「読む・書く・型で絞る」だけで、`*.element.ts` を 150 行に収める
 * （ADR-0005）ための置き場でもある。
 *
 * 行は **DOM の移動**（`tbody.append`）で並べ替える。作り直さないので、行の中のフォーカスも
 * チェックも消えない。見出しは定義後に `<button part="sort">` で包む——JS が無いときに
 * 押せないボタンを置かないため（ティア A、ADR-0012）。
 */
import { checkContract } from '../_shared/contract.js'
import { syncAttribute } from '../_shared/internals.js'
import {
  contract,
  SORTABLE_SELECTOR,
  type SortDirection,
  type SortType,
} from './data-table.contract.js'
import { parseSortType, type Row } from './data-table.logic.js'

/** 見出し行の `th` すべて。`aria-sort` は `cellIndex` で引くので並べ替えの印では絞らない */
const HEADER_SELECTOR = ':scope > table > thead > tr > th'

/** 契約の子。`ok` が false なら `malformed`（部品は表を作らない） */
export type Wiring = {
  readonly ok: boolean
  readonly head: HTMLElement | undefined
  readonly body: HTMLElement | undefined
}

export const NO_WIRING: Wiring = { ok: false, head: undefined, body: undefined }

const asElement = (node: Element | undefined): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

const cellsOf = (host: HTMLElement, selector: string): readonly HTMLTableCellElement[] =>
  [...host.querySelectorAll(selector)].filter((cell) => cell instanceof HTMLTableCellElement)

/** 見出し行の `th`（左から順）。`columnStates` の並びと対応する */
export const headers = (host: HTMLElement): readonly HTMLTableCellElement[] =>
  cellsOf(host, HEADER_SELECTOR)

/**
 * 見出しの中身をボタンに移す。ボタンの文字＝見出しの文字なので `th` のアクセシブル名は変わらない。
 * 既に包まれていれば何もしない——再接続で二重に包まないため。
 */
const wrapHeader = (cell: HTMLTableCellElement): void => {
  if (cell.querySelector('[part="sort"]') !== null) {
    return
  }
  const label = [...cell.childNodes]
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('part', 'sort')
  cell.append(button)
  button.append(...label)
}

/**
 * 契約を見て `<thead>` / `<tbody>` を掴み、`th[data-sort]` の中身をボタンに移す。
 * 契約を満たさないときは**何も包まない**——JS 無しと同じ「文字の見出し」のままにする。
 */
export const wire = (host: HTMLElement): Wiring => {
  const result = checkContract(host, contract)
  if (result.kind === 'missing') {
    console.error(
      '[rd-data-table] <table class="rd-table"> と <caption> / <thead> / <tbody> が必要'
        + `（不足: ${result.roles.join(', ')}）`,
    )
    return NO_WIRING
  }
  cellsOf(host, SORTABLE_SELECTOR).forEach(wrapHeader)
  return { ok: true, head: asElement(result.found['head']), body: asElement(result.found['body']) }
}

/** 比較キー。`td[data-value]` があればそれ、無ければ表示の文字（`td` が無い行は空） */
const keyOf = (cell: HTMLTableCellElement | undefined): string =>
  cell?.dataset['value'] ?? cell?.textContent?.trim() ?? ''

/** いまの DOM の並びで `column` 番目のセルを読む。`index` は「いまの順」での位置 */
export const readRows = (body: HTMLElement | undefined, column: number): readonly Row[] =>
  [...(body?.children ?? [])]
    .filter((row) => row instanceof HTMLTableRowElement)
    .map((row, index) => ({ key: keyOf(row.cells[column]), index }))

const isIdentity = (order: readonly number[]): boolean =>
  order.every((position, index) => position === index)

/**
 * `order` の順に `<tr>` を並べ直す（`append` は移動なので作り直さない）。
 * 並びが変わらないときは DOM を触らない——`MutationObserver` が鳴き続けないため。
 */
export const applyOrder = (body: HTMLElement | undefined, order: readonly number[]): void => {
  if (body === undefined || isIdentity(order)) {
    return
  }
  const rows = [...body.children]
  body.append(...order.flatMap((position) => rows[position] ?? []))
}

/** `aria-sort` を付け外しする。値が入るのは並べ替え中の 1 列だけ（`columnStates`） */
export const applySortAttrs = (
  cells: readonly HTMLTableCellElement[],
  states: readonly (SortDirection | undefined)[],
): void => cells.forEach((cell, index) => syncAttribute(cell, 'aria-sort', states[index]))

/** 押された見出しの列番号（`th.cellIndex`）。ボタンの外なら -1 */
export const columnOf = (target: EventTarget | null): number => {
  const button = target instanceof Element ? target.closest('[part="sort"]') : null
  return button?.closest('th')?.cellIndex ?? -1
}

/** `rd-sort` の `detail.key`（`th[data-key]`。書いていなければ undefined） */
export const keyAt = (cells: readonly HTMLTableCellElement[], column: number): string | undefined =>
  cells[column]?.dataset['key']

/** 列の比べ方（`th[data-sort]`）。知らない値・印が無い列は `text` */
export const sortTypeAt = (cells: readonly HTMLTableCellElement[], column: number): SortType =>
  parseSortType(cells[column]?.getAttribute('data-sort') ?? null)

/**
 * 文字の比較に使う照合器。最も近い `[lang]` で比べる（`_shared/lang.ts` と同じ引き方。
 * 無ければ `undefined` を渡してブラウザ既定にする）。
 */
export const collatorFor = (host: HTMLElement): Intl.Collator =>
  new Intl.Collator(host.closest('[lang]')?.getAttribute('lang') ?? undefined, {
    numeric: true,
    sensitivity: 'base',
  })

/** 行の増減で並べ替え直す（`childList` だけ。セルの書き換えは見ない） */
export const observeRows = (
  body: HTMLElement | undefined,
  onChange: () => void,
): MutationObserver | undefined => {
  if (body === undefined) {
    return undefined
  }
  const observer = new MutationObserver(onChange)
  observer.observe(body, { childList: true })
  return observer
}
