import { describe, expect, it } from 'vitest'
import {
  buttonCopy,
  computeStates,
  counterText,
  pickVisible,
  targetIndex,
} from './carousel.logic.js'

describe('targetIndex', () => {
  it('loop 無しでは端で undefined を返す', () => {
    expect(targetIndex(0, 3, 1, false)).toBe(1)
    expect(targetIndex(2, 3, 1, false)).toBeUndefined()
    expect(targetIndex(0, 3, -1, false)).toBeUndefined()
    expect(targetIndex(2, 3, -1, false)).toBe(1)
  })

  it('loop なら端で折り返す', () => {
    expect(targetIndex(2, 3, 1, true)).toBe(0)
    expect(targetIndex(0, 3, -1, true)).toBe(2)
  })

  it('枚が無ければ undefined（1 枚なら loop でも自分自身）', () => {
    expect(targetIndex(0, 0, 1, true)).toBeUndefined()
    expect(targetIndex(0, -1, 1, false)).toBeUndefined()
    expect(targetIndex(0, 1, 1, true)).toBe(0)
  })
})

describe('counterText', () => {
  it('0 始まりの index を 1 始まりで見せる', () => {
    expect(counterText(0, 5)).toBe('1 / 5')
    expect(counterText(4, 5)).toBe('5 / 5')
  })
})

describe('pickVisible', () => {
  it('交差比が最大の枚を選ぶ', () => {
    expect(
      pickVisible(
        [
          { index: 0, ratio: 0.4 },
          { index: 1, ratio: 0.9 },
        ],
        0,
      ),
    ).toBe(1)
  })

  it('同率なら先頭（番号の小さい枚）を選ぶ', () => {
    expect(
      pickVisible(
        [
          { index: 2, ratio: 1 },
          { index: 1, ratio: 1 },
        ],
        0,
      ),
    ).toBe(1)
  })

  it('見えている枚が無ければ fallback', () => {
    expect(pickVisible([], 3)).toBe(3)
    expect(pickVisible([{ index: 0, ratio: 0 }], 2)).toBe(2)
  })
})

describe('buttonCopy', () => {
  it('lang で文言が変わる', () => {
    expect(buttonCopy(true)).toEqual({ prev: '前へ', next: '次へ' })
    expect(buttonCopy(false)).toEqual({ prev: 'Previous', next: 'Next' })
  })
})

describe('computeStates', () => {
  const base = { count: 5, index: 1, loop: false, unlabeled: false, malformed: false }

  it('契約を満たさなければ malformed だけ', () => {
    expect([...computeStates({ ...base, malformed: true, unlabeled: true })]).toEqual(['malformed'])
  })

  it('真ん中の枚では端の状態を出さない', () => {
    expect([...computeStates(base)]).toEqual([])
  })

  it('loop 無しの端で at-start / at-end', () => {
    expect([...computeStates({ ...base, index: 0 })]).toEqual(['at-start'])
    expect([...computeStates({ ...base, index: 4 })]).toEqual(['at-end'])
  })

  it('loop なら端でも at-start / at-end を出さない', () => {
    expect([...computeStates({ ...base, index: 0, loop: true })]).toEqual([])
  })

  it('1 枚以下なら single（両端でもある）', () => {
    expect([...computeStates({ ...base, count: 1, index: 0 })]).toEqual([
      'single',
      'at-start',
      'at-end',
    ])
  })

  it('label が無ければ unlabeled', () => {
    expect([...computeStates({ ...base, unlabeled: true })]).toEqual(['unlabeled'])
  })
})
