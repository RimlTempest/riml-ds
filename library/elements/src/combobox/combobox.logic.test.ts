import { describe, expect, it } from 'vitest'
import { computeView, type ViewInput } from '../_shared/field.js'
import type { Candidate } from './combobox.logic.js'
import {
  computeComboboxView,
  filterCandidates,
  nextActive,
  normalize,
  optionId,
  parseFilter,
} from './combobox.logic.js'

const ALL: readonly Candidate[] = [
  { value: 'kana', label: 'かな' },
  { value: 'kanji', label: '漢字' },
  { value: 'katakana', label: 'カナ' },
]

const field = (over: Partial<ViewInput> = {}) =>
  computeView({
    controlId: 'reading',
    error: '',
    validity: {},
    validationMessage: '',
    attrs: {},
    japanese: true,
    malformed: false,
    invalid: false,
    touched: false,
    hasHint: false,
    hasError: false,
    filled: false,
    ...over,
  })

describe('normalize', () => {
  it('半角カナと全角を NFKC でそろえる', () => {
    expect(normalize('ｶﾅ')).toBe(normalize('カナ'))
    expect(normalize('ＡＢ')).toBe('ab')
  })

  it('大文字小文字と前後の空白を無視する', () => {
    expect(normalize('  Kana  ')).toBe('kana')
  })
})

describe('parseFilter', () => {
  it('既定は contains', () => {
    expect(parseFilter(null)).toBe('contains')
    expect(parseFilter(undefined)).toBe('contains')
    expect(parseFilter('')).toBe('contains')
    expect(parseFilter('unknown')).toBe('contains')
  })

  it('prefix と none は受け取る', () => {
    expect(parseFilter('prefix')).toBe('prefix')
    expect(parseFilter('none')).toBe('none')
    expect(parseFilter('contains')).toBe('contains')
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

  it('query が空なら全件（Alt+↓ で全候補を見られる）', () => {
    expect(filterCandidates(ALL, '', 'contains')).toEqual(ALL)
    expect(filterCandidates(ALL, '   ', 'prefix')).toEqual(ALL)
  })

  it('一致しなければ 0 件', () => {
    expect(filterCandidates(ALL, 'ローマ字', 'contains')).toEqual([])
  })
})

describe('nextActive', () => {
  it('↓ と ↑ だけを扱い、端で折り返す', () => {
    expect(nextActive(-1, 3, 'ArrowDown')).toBe(0)
    expect(nextActive(0, 3, 'ArrowDown')).toBe(1)
    expect(nextActive(2, 3, 'ArrowDown')).toBe(0)
    expect(nextActive(0, 3, 'ArrowUp')).toBe(2)
  })

  it('Home / End は入力欄のカーソル移動に任せる（横取りしない）', () => {
    expect(nextActive(0, 3, 'Home')).toBeUndefined()
    expect(nextActive(0, 3, 'End')).toBeUndefined()
    expect(nextActive(0, 3, 'ArrowLeft')).toBeUndefined()
    expect(nextActive(0, 3, 'Enter')).toBeUndefined()
  })

  it('候補が無ければ何も返さない', () => {
    expect(nextActive(-1, 0, 'ArrowDown')).toBeUndefined()
  })
})

describe('optionId', () => {
  it('リストの名前と番号から一意な id を作る', () => {
    expect(optionId('rd-combobox-1', 2)).toBe('rd-combobox-1-option-2')
  })
})

describe('computeComboboxView', () => {
  it('閉じているときは open も activeId も出さない', () => {
    const view = computeComboboxView({
      open: false,
      active: -1,
      count: 3,
      query: '',
      name: 'rd-combobox-1',
      field: field(),
    })
    expect([...view.states]).toEqual([])
    expect(view.activeId).toBeUndefined()
    expect(view.inputAttrs).toEqual({
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': 'false',
      'aria-controls': 'rd-combobox-1',
    })
  })

  it('開いていれば open 状態と aria-expanded="true"', () => {
    const view = computeComboboxView({
      open: true,
      active: 1,
      count: 3,
      query: 'か',
      name: 'rd-combobox-1',
      field: field(),
    })
    expect(view.states.has('open')).toBe(true)
    expect(view.inputAttrs['aria-expanded']).toBe('true')
    expect(view.activeId).toBe('rd-combobox-1-option-1')
  })

  it('範囲外の active では aria-activedescendant を出さない', () => {
    const base = { open: true, count: 3, query: 'か', name: 'rd-combobox-1', field: field() }
    expect(computeComboboxView({ ...base, active: -1 }).activeId).toBeUndefined()
    expect(computeComboboxView({ ...base, active: 3 }).activeId).toBeUndefined()
  })

  it('絞った結果が 0 件なら empty（query が空のときは付けない）', () => {
    const base = { open: false, active: -1, count: 0, name: 'rd-combobox-1', field: field() }
    expect(computeComboboxView({ ...base, query: 'ローマ字' }).states.has('empty')).toBe(true)
    expect(computeComboboxView({ ...base, query: '' }).states.has('empty')).toBe(false)
  })

  it('field の状態（hinted / filled …）をそのまま引き継ぐ', () => {
    const view = computeComboboxView({
      open: true,
      active: 0,
      count: 1,
      query: 'か',
      name: 'rd-combobox-1',
      field: field({ hasHint: true, filled: true }),
    })
    expect([...view.states].toSorted()).toEqual(['filled', 'hinted', 'open'])
  })

  it('malformed のときは他の状態を出さない（field に従う）', () => {
    const view = computeComboboxView({
      open: true,
      active: 0,
      count: 1,
      query: 'か',
      name: 'rd-combobox-1',
      field: field({ malformed: true }),
    })
    expect([...view.states]).toEqual(['malformed'])
  })
})
