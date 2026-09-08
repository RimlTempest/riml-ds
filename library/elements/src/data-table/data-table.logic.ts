/**
 * `rd-data-table` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * `Intl.Collator` は DOM ではないので引数で受け取る（言語は `data-table.dom.ts` が決める）。
 */
import type { SortDirection, SortType } from './data-table.contract.js'

/** 並べ替える 1 行分。`key` は比較キー、`index` は元の並びでの位置 */
export type Row = { readonly key: string; readonly index: number }

export type StateInput = { readonly column: number; readonly malformed: boolean }

const SORT_TYPES: ReadonlySet<string> = new Set(['text', 'number', 'date'])

/** 知らない値・空文字・属性が無い場合は `text`（既定の比べ方） */
export const parseSortType = (raw: string | null): SortType =>
  raw !== null && SORT_TYPES.has(raw) && raw !== 'text'
    ? raw === 'number'
      ? 'number'
      : 'date'
    : 'text'

/** `descending` だけが降順。それ以外はすべて昇順（APG の例と同じ既定） */
export const parseDirection = (raw: string | null): SortDirection =>
  raw === 'descending' ? 'descending' : 'ascending'

/**
 * 見出しを押したときの次の向き。別の列なら昇順から始め、同じ列なら反転する。
 * 「並べ替え無し」には戻さない（APG「Sortable Table」の例と同じ）。
 */
export const nextDirection = (
  column: number,
  current: number,
  direction: SortDirection,
): SortDirection => {
  if (column !== current) {
    return 'ascending'
  }
  return direction === 'ascending' ? 'descending' : 'ascending'
}

/** 数として読めなければ `undefined`（＝並びの末尾へ送る） */
const numberOf = (key: string, type: SortType): number | undefined => {
  const value = type === 'number' ? Number.parseFloat(key) : Date.parse(key)
  return Number.isNaN(value) ? undefined : value
}

const compareNumbers = (a: number | undefined, b: number | undefined, sign: number): number => {
  if (a === undefined || b === undefined) {
    // 読めない値は向きに関わらず末尾。どちらも読めなければ同値（元の順のまま）
    return a === b ? 0 : a === undefined ? 1 : -1
  }
  return a === b ? 0 : sign * (a < b ? -1 : 1)
}

/**
 * 並べ替えた結果の「元の index の並び」。安定（同値は元の順）で、
 * `number` / `date` で読めない値は向きに関わらず末尾に来る。
 */
export const sortOrder = (
  rows: readonly Row[],
  type: SortType,
  direction: SortDirection,
  collator: Intl.Collator,
): readonly number[] => {
  const sign = direction === 'descending' ? -1 : 1
  const compare = (a: Row, b: Row): number =>
    type === 'text'
      ? sign * collator.compare(a.key, b.key)
      : compareNumbers(numberOf(a.key, type), numberOf(b.key, type), sign)
  return rows
    .toSorted((a, b) => {
      const order = compare(a, b)
      // 同値は元の順（toSorted は安定だが、比較関数でも明示して読めるようにする）
      return order === 0 ? a.index - b.index : order
    })
    .map((row) => row.index)
}

/** 各見出しの `aria-sort`。値が入るのは並べ替え中の 1 列だけ（APG） */
export const columnStates = (
  count: number,
  column: number,
  direction: SortDirection,
): readonly (SortDirection | undefined)[] =>
  Array.from({ length: count }, (_, index) => (index === column ? direction : undefined))

/** 属性と契約の状態を `:state()` の集合にする */
export const computeStates = (input: StateInput): ReadonlySet<string> =>
  input.malformed
    ? new Set(['malformed'])
    : input.column >= 0
      ? new Set(['sorted'])
      : new Set<string>()
