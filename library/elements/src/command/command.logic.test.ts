import { describe, expect, it } from 'vitest'
import {
  computeStates,
  decideKey,
  emptyCopy,
  groupHidden,
  type Item,
  itemValue,
  matches,
  visibleIndexes,
} from './command.logic.js'

const item = (text: string, keywords = ''): Item => ({ text, keywords })

const ITEMS: readonly Item[] = [
  item('ホーム'),
  item('設定', 'せってい preferences config'),
  item('新しいノート', 'new note'),
]

/** 入力欄でのキー（既定は「入力欄に居て、まだどの項目にも居ない」） */
const onInput = (key: string, extra: Partial<Parameters<typeof decideKey>[0]> = {}) =>
  decideKey({
    key,
    modified: false,
    onInput: true,
    current: -1,
    count: 3,
    hasQuery: false,
    ...extra,
  })

/** 項目の上でのキー（既定は 3 件の真ん中に居る） */
const onItem = (key: string, extra: Partial<Parameters<typeof decideKey>[0]> = {}) =>
  decideKey({
    key,
    modified: false,
    onInput: false,
    current: 1,
    count: 3,
    hasQuery: true,
    ...extra,
  })

describe('matches', () => {
  it('表示テキストでも data-keywords でも当たる', () => {
    expect(matches(ITEMS[1] ?? item(''), '設', 'contains')).toBe(true)
    expect(matches(ITEMS[1] ?? item(''), 'せって', 'contains')).toBe(true)
    expect(matches(ITEMS[1] ?? item(''), 'config', 'contains')).toBe(true)
    expect(matches(ITEMS[1] ?? item(''), 'ホーム', 'contains')).toBe(false)
  })

  it('prefix は先頭一致、none と空の query は全件通す', () => {
    expect(matches(item('新しいノート', 'new'), 'new', 'prefix')).toBe(true)
    expect(matches(item('新しいノート', 'new'), 'ew', 'prefix')).toBe(false)
    expect(matches(item('新しいノート', 'new'), 'ew', 'none')).toBe(true)
    expect(matches(item('新しいノート', 'new'), '', 'contains')).toBe(true)
  })
})

describe('visibleIndexes', () => {
  it('当たった項目の番号だけを並び順で返す', () => {
    expect(visibleIndexes(ITEMS, 'ノート', 'contains')).toEqual([2])
    expect(visibleIndexes(ITEMS, '', 'contains')).toEqual([0, 1, 2])
    expect(visibleIndexes(ITEMS, 'zzz', 'contains')).toEqual([])
  })
})

describe('groupHidden', () => {
  it('その <ul> の項目が 1 つも見えていなければ隠す', () => {
    expect(groupHidden([0, 2], [1])).toBe(true)
    expect(groupHidden([0, 2], [1, 2])).toBe(false)
    expect(groupHidden([], [0, 1])).toBe(true)
  })
})

describe('decideKey（入力欄）', () => {
  it('↓ で見えている 1 件目、↑ で最後の項目へ移る', () => {
    expect(onInput('ArrowDown')).toEqual({ kind: 'focus-item', index: 0 })
    expect(onInput('ArrowUp')).toEqual({ kind: 'focus-item', index: 2 })
  })

  it('0 件なら移動も確定もしない', () => {
    expect(onInput('ArrowDown', { count: 0 })).toEqual({ kind: 'none' })
    expect(onInput('Enter', { count: 0 })).toEqual({ kind: 'none' })
  })

  it('Enter は見えている 1 件目を押す', () => {
    expect(onInput('Enter')).toEqual({ kind: 'activate-first' })
  })

  it('Esc は文字が入っているときだけ空にする（空なら外側の rd-dialog に渡す）', () => {
    expect(onInput('Escape', { hasQuery: true })).toEqual({ kind: 'clear' })
    expect(onInput('Escape')).toEqual({ kind: 'none' })
  })

  it('印字キーと Home / End は横取りしない（入力欄のカーソル移動）', () => {
    expect(onInput('a')).toEqual({ kind: 'none' })
    expect(onInput('Home')).toEqual({ kind: 'none' })
    expect(onInput('End')).toEqual({ kind: 'none' })
  })
})

describe('decideKey（項目）', () => {
  it('↓ ↑ は端で折り返し、Home / End は先頭・末尾へ', () => {
    expect(onItem('ArrowDown')).toEqual({ kind: 'focus-item', index: 2 })
    expect(onItem('ArrowDown', { current: 2 })).toEqual({ kind: 'focus-item', index: 0 })
    expect(onItem('ArrowUp', { current: 0 })).toEqual({ kind: 'focus-item', index: 2 })
    expect(onItem('Home')).toEqual({ kind: 'focus-item', index: 0 })
    expect(onItem('End')).toEqual({ kind: 'focus-item', index: 2 })
  })

  it('印字キーは入力欄に戻して打ち続けられる', () => {
    expect(onItem('せ')).toEqual({ kind: 'type', char: 'せ' })
    expect(onItem('Backspace')).toEqual({ kind: 'backspace' })
  })

  it('修飾キー付き・Enter・Space・Tab は横取りしない', () => {
    expect(onItem('a', { modified: true })).toEqual({ kind: 'none' })
    expect(onItem('Enter')).toEqual({ kind: 'none' })
    expect(onItem(' ')).toEqual({ kind: 'none' })
    expect(onItem('Tab')).toEqual({ kind: 'none' })
  })
})

describe('itemValue', () => {
  it('data-value → value → href → テキストの順で最初にあるものを使う', () => {
    const base = { dataValue: null, value: null, href: null, text: 'ホーム' }
    expect(itemValue({ ...base, dataValue: 'home', value: 'v', href: '/' })).toBe('home')
    expect(itemValue({ ...base, value: 'v', href: '/' })).toBe('v')
    expect(itemValue({ ...base, href: '/' })).toBe('/')
    expect(itemValue(base)).toBe('ホーム')
    expect(itemValue({ ...base, dataValue: '', text: '' })).toBe('')
  })
})

describe('emptyCopy', () => {
  it('empty-text があればそれ、無ければページの言語で決める', () => {
    expect(emptyCopy(true, undefined)).toBe('見つかりません')
    expect(emptyCopy(false, undefined)).toBe('No results')
    expect(emptyCopy(true, '')).toBe('見つかりません')
    expect(emptyCopy(true, '該当なし')).toBe('該当なし')
  })
})

describe('computeStates', () => {
  it('契約に合わない子なら malformed だけを出す', () => {
    expect([...computeStates({ malformed: true, filtering: true, empty: true })]).toEqual([
      'malformed',
    ])
  })

  it('絞り込み中と 0 件を伝える', () => {
    expect([...computeStates({ malformed: false, filtering: true, empty: false })]).toEqual([
      'filtering',
    ])
    expect([...computeStates({ malformed: false, filtering: true, empty: true })]).toEqual([
      'filtering',
      'empty',
    ])
    expect([...computeStates({ malformed: false, filtering: false, empty: false })]).toEqual([])
  })
})
