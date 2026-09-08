import { describe, expect, it } from 'vitest'
import {
  columnStates,
  computeStates,
  nextDirection,
  parseDirection,
  parseSortType,
  type Row,
  sortOrder,
} from './data-table.logic.js'

const collator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' })

const rowsOf = (keys: readonly string[]): readonly Row[] =>
  keys.map((key, index) => ({ key, index }))

describe('parseSortType', () => {
  it('text / number / date をそのまま読む', () => {
    expect(parseSortType('text')).toBe('text')
    expect(parseSortType('number')).toBe('number')
    expect(parseSortType('date')).toBe('date')
  })

  it('空文字・知らない値・属性が無い場合は text', () => {
    expect(parseSortType('')).toBe('text')
    expect(parseSortType('size')).toBe('text')
    expect(parseSortType(null)).toBe('text')
  })
})

describe('parseDirection', () => {
  it('descending だけを降順として読み、他はすべて昇順', () => {
    expect(parseDirection('descending')).toBe('descending')
    expect(parseDirection('ascending')).toBe('ascending')
    expect(parseDirection('desc')).toBe('ascending')
    expect(parseDirection(null)).toBe('ascending')
  })
})

describe('nextDirection', () => {
  it('別の列を押したら昇順から始める', () => {
    expect(nextDirection(2, 1, 'descending')).toBe('ascending')
    expect(nextDirection(0, -1, 'ascending')).toBe('ascending')
  })

  it('同じ列を押したら向きを反転する（「無し」には戻さない）', () => {
    expect(nextDirection(1, 1, 'ascending')).toBe('descending')
    expect(nextDirection(1, 1, 'descending')).toBe('ascending')
  })
})

describe('sortOrder', () => {
  it('text は Intl.Collator で比べる（数字は数として、大小文字は無視）', () => {
    const rows = rowsOf(['item10', 'Item2', 'item1'])
    expect(sortOrder(rows, 'text', 'ascending', collator)).toEqual([2, 1, 0])
  })

  it('descending は昇順の逆', () => {
    const rows = rowsOf(['b', 'a', 'c'])
    expect(sortOrder(rows, 'text', 'descending', collator)).toEqual([2, 0, 1])
  })

  it('number は数として比べる', () => {
    const rows = rowsOf(['10', '9', '100'])
    expect(sortOrder(rows, 'number', 'ascending', collator)).toEqual([1, 0, 2])
  })

  it('number で読めない値は向きに関わらず末尾', () => {
    const rows = rowsOf(['3', '—', '1'])
    expect(sortOrder(rows, 'number', 'ascending', collator)).toEqual([2, 0, 1])
    expect(sortOrder(rows, 'number', 'descending', collator)).toEqual([0, 2, 1])
  })

  it('date は Date.parse で比べ、読めない値は末尾', () => {
    const rows = rowsOf(['2026-09-08', '未定', '2025-01-01'])
    expect(sortOrder(rows, 'date', 'ascending', collator)).toEqual([2, 0, 1])
    expect(sortOrder(rows, 'date', 'descending', collator)).toEqual([0, 2, 1])
  })

  it('同値は元の順のまま（安定）', () => {
    const rows = rowsOf(['a', 'a', 'a'])
    expect(sortOrder(rows, 'text', 'ascending', collator)).toEqual([0, 1, 2])
    expect(sortOrder(rows, 'text', 'descending', collator)).toEqual([0, 1, 2])
  })

  it('読めない値どうしも元の順のまま', () => {
    const rows = rowsOf(['x', 'y', '1'])
    expect(sortOrder(rows, 'number', 'ascending', collator)).toEqual([2, 0, 1])
  })

  it('行が無ければ空の並び', () => {
    expect(sortOrder([], 'text', 'ascending', collator)).toEqual([])
  })
})

describe('columnStates', () => {
  it('並べ替え中の 1 列にだけ aria-sort の値が入る', () => {
    expect(columnStates(3, 1, 'descending')).toEqual([undefined, 'descending', undefined])
  })

  it('column が -1 ならどの列にも付かない', () => {
    expect(columnStates(2, -1, 'ascending')).toEqual([undefined, undefined])
  })

  it('列数の外を指していてもどの列にも付かない', () => {
    expect(columnStates(2, 5, 'ascending')).toEqual([undefined, undefined])
  })
})

describe('computeStates', () => {
  it('契約を満たさなければ malformed', () => {
    expect([...computeStates({ column: 1, malformed: true })]).toEqual(['malformed'])
  })

  it('並べ替え中なら sorted', () => {
    expect([...computeStates({ column: 0, malformed: false })]).toEqual(['sorted'])
    expect([...computeStates({ column: -1, malformed: false })]).toEqual([])
  })
})
