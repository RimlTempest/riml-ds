import { describe, expect, it } from 'vitest'
import type { Candidate } from './text-filter.js'
import { filterCandidates, normalize, parseFilterMode } from './text-filter.js'

const ALL: readonly Candidate[] = [
  { value: 'kana', label: 'かな' },
  { value: 'kanji', label: '漢字' },
  { value: 'katakana', label: 'カナ' },
]

describe('normalize', () => {
  it('半角カナと全角を NFKC でそろえる', () => {
    expect(normalize('ｶﾅ')).toBe(normalize('カナ'))
    expect(normalize('ＡＢ')).toBe('ab')
  })

  it('大文字小文字と前後の空白を無視する', () => {
    expect(normalize('  Kana  ')).toBe('kana')
  })
})

describe('parseFilterMode', () => {
  it('既定は contains', () => {
    expect(parseFilterMode(null)).toBe('contains')
    expect(parseFilterMode(undefined)).toBe('contains')
    expect(parseFilterMode('')).toBe('contains')
    expect(parseFilterMode('unknown')).toBe('contains')
  })

  it('prefix と none は受け取る', () => {
    expect(parseFilterMode('prefix')).toBe('prefix')
    expect(parseFilterMode('none')).toBe('none')
    expect(parseFilterMode('contains')).toBe('contains')
  })
})

describe('filterCandidates', () => {
  it('contains は部分一致（正規化して比べる）', () => {
    expect(filterCandidates(ALL, 'か', 'contains').map((c) => c.value)).toEqual(['kana'])
    expect(filterCandidates(ALL, 'ｶﾅ', 'contains').map((c) => c.value)).toEqual(['katakana'])
    // 値でも引ける（大文字小文字は無視する）
    expect(filterCandidates(ALL, 'KAN', 'contains').map((c) => c.value)).toEqual([
      'kana',
      'kanji',
      'katakana',
    ])
  })

  it('prefix は前方一致', () => {
    expect(filterCandidates(ALL, 'kan', 'prefix').map((c) => c.value)).toEqual(['kana', 'kanji'])
    expect(filterCandidates(ALL, 'ana', 'prefix')).toEqual([])
  })

  it('none は絞らない（サーバー側で絞る利用側向け）', () => {
    expect(filterCandidates(ALL, 'か', 'none')).toEqual(ALL)
  })

  it('query が空なら全件', () => {
    expect(filterCandidates(ALL, '', 'contains')).toEqual(ALL)
    expect(filterCandidates(ALL, '   ', 'prefix')).toEqual(ALL)
  })

  it('一致しなければ 0 件', () => {
    expect(filterCandidates(ALL, 'ローマ字', 'contains')).toEqual([])
  })
})
