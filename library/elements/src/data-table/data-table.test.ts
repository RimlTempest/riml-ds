import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableRowMarkup,
  markup as dataTableMarkup,
  type SortDirection,
} from './data-table.contract.js'
import { RdDataTable } from './data-table.element.js'
// rd-data-table を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './data-table.define.js'

const HEAD = dataTableHeadMarkup([
  { label: '名前', sort: 'text', key: 'name' },
  { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
  { label: '更新', sort: 'date', key: 'updated' },
  { label: '操作' },
])

const row = (name: string, size: string, bytes: string, updated: string, date: string): string =>
  dataTableRowMarkup([
    { text: name },
    { text: size, value: bytes, numeric: true },
    { text: updated, value: date },
    { text: '複製' },
  ])

const BODY = dataTableBodyMarkup([
  row('b.png', '1,234', '1234', '2026/01/02', '2026-01-02'),
  row('a.png', '820', '820', '2025/12/31', '2025-12-31'),
  row('c.png', '—', '—', '未定', '未定'),
])

type TableAttrs = {
  readonly column?: string
  readonly direction?: SortDirection
  readonly manual?: boolean
}

const table = (attrs: TableAttrs = {}): string =>
  dataTableMarkup({ caption: '保存したコード', head: HEAD, body: BODY, ...attrs })

const names = (el: RdDataTable): readonly string[] =>
  [...el.querySelectorAll('tbody > tr > td:first-child')].map((cell) => cell.textContent ?? '')

const headings = (el: RdDataTable): readonly HTMLTableCellElement[] =>
  [...el.querySelectorAll('thead th')].filter((cell) => cell instanceof HTMLTableCellElement)

const sortButton = (el: RdDataTable, column: number): HTMLElement | null => {
  const button = headings(el)[column]?.querySelector('[part="sort"]')
  return button instanceof HTMLElement ? button : null
}

const press = async (el: RdDataTable, column: number): Promise<void> => {
  sortButton(el, column)?.click()
  await el.updateComplete
}

const ariaSorts = (el: RdDataTable): readonly (string | null)[] =>
  headings(el).map((cell) => cell.getAttribute('aria-sort'))

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/data-table/data-table.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('定義後は th[data-sort] の中身だけがボタンになり、見出しの名前は変わらない', async () => {
  const el = await fixtureOf(RdDataTable, table())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelectorAll('[part="sort"]')).toHaveLength(3)
  expect(sortButton(el, 0)?.textContent).toBe('名前')
  expect(headings(el)[0]?.textContent).toBe('名前')
  // 並べ替えられない列にはボタンを置かない（押せないボタンを作らない）
  expect(sortButton(el, 3)).toBeNull()
  expect(ariaSorts(el)).toEqual([null, null, null, null])
})

it('見出しを押すと aria-sort が付き、その列で昇順に並ぶ', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 0)
  expect(ariaSorts(el)).toEqual(['ascending', null, null, null])
  expect(names(el)).toEqual(['a.png', 'b.png', 'c.png'])
  expect(el.matches(':state(sorted)')).toBe(true)
  expect(el.getAttribute('column')).toBe('0')
  expect(el.getAttribute('direction')).toBe('ascending')
})

it('同じ見出しをもう一度押すと降順になる（「無し」には戻さない）', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 0)
  await press(el, 0)
  expect(ariaSorts(el)).toEqual(['descending', null, null, null])
  expect(names(el)).toEqual(['c.png', 'b.png', 'a.png'])
})

it('別の見出しを押すと昇順から始まり、前の列の aria-sort が外れる', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 0)
  await press(el, 1)
  expect(ariaSorts(el)).toEqual([null, 'ascending', null, null])
  // 数の列は td[data-value] を比較キーにする（「1,234」を 1234 として比べる）
  expect(names(el)).toEqual(['a.png', 'b.png', 'c.png'])
})

it('数として読めないセルは向きに関わらず末尾に来る', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 1)
  await press(el, 1)
  expect(names(el)).toEqual(['b.png', 'a.png', 'c.png'])
})

it('日付の列は data-value の日付で比べる', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 2)
  expect(names(el)).toEqual(['a.png', 'b.png', 'c.png'])
})

it('ボタンが押されたときだけ rd-sort が飛ぶ（detail は column / key / direction）', async () => {
  const el = await fixtureOf(RdDataTable, table())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-sort', listener)
  await press(el, 1)
  expect(listener).toHaveBeenCalledOnce()
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: { column: 1, key: 'size', direction: 'ascending' },
    }),
  )
})

it('JS から column / direction を書き換えても並ぶが rd-sort は出さない', async () => {
  const el = await fixtureOf(RdDataTable, table())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-sort', listener)
  el.column = 0
  el.direction = 'descending'
  await el.updateComplete
  expect(names(el)).toEqual(['c.png', 'b.png', 'a.png'])
  expect(ariaSorts(el)).toEqual(['descending', null, null, null])
  expect(listener).not.toHaveBeenCalled()
})

it('初期値が属性に書いてあれば定義のときに並べ替える', async () => {
  const el = await fixtureOf(RdDataTable, table({ column: '0', direction: 'descending' }))
  expect(names(el)).toEqual(['c.png', 'b.png', 'a.png'])
  expect(ariaSorts(el)).toEqual(['descending', null, null, null])
})

it('manual は行を動かさず aria-sort と rd-sort だけを出す', async () => {
  const el = await fixtureOf(RdDataTable, table({ manual: true }))
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-sort', listener)
  await press(el, 0)
  expect(names(el)).toEqual(['b.png', 'a.png', 'c.png'])
  expect(ariaSorts(el)).toEqual(['ascending', null, null, null])
  expect(listener).toHaveBeenCalledOnce()
})

it('行が増えたら並べ替え直す', async () => {
  const el = await fixtureOf(RdDataTable, table())
  await press(el, 0)
  const body = el.querySelector('tbody')
  const added = document.createElement('template')
  added.innerHTML = row('aa.png', '1', '1', '2026/02/02', '2026-02-02')
  const first = added.content.firstElementChild
  if (first !== null) {
    body?.append(first)
  }
  await expect.poll(() => names(el)).toEqual(['a.png', 'aa.png', 'b.png', 'c.png'])
})

it('見出しのボタンはタップ標的の最小（44px）を満たす', async () => {
  const el = await fixtureOf(RdDataTable, table())
  const box = sortButton(el, 0)?.getBoundingClientRect()
  expect(box?.height).toBeGreaterThanOrEqual(44)
})

it('再接続しても見出しを二重に包まない', async () => {
  const el = await fixtureOf(RdDataTable, table())
  const parent = el.parentElement
  el.remove()
  parent?.append(el)
  await el.updateComplete
  expect(el.querySelectorAll('[part="sort"]')).toHaveLength(3)
  expect(sortButton(el, 0)?.textContent).toBe('名前')
})

it('<caption> が無いと console.error して malformed になり、見出しを包まない', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdDataTable,
    `<rd-data-table><table class="rd-table">${HEAD}${BODY}</table></rd-data-table>`,
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(el.querySelectorAll('[part="sort"]')).toHaveLength(0)
})
