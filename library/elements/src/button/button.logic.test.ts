import { describe, expect, it } from 'vitest'
import { computeButtonState, decidePress } from './button.logic.js'

describe('computeButtonState', () => {
  it('variant 名を状態にする。知らない値は primary に倒す', () => {
    expect([
      ...computeButtonState({ variant: 'danger', loading: false, contractOk: true }).states,
    ]).toEqual(['danger'])
    expect([
      ...computeButtonState({ variant: 'いつかの値', loading: false, contractOk: true }).states,
    ]).toEqual(['primary'])
  })

  it('loading のとき loading 状態と aria-busy を出す', () => {
    const state = computeButtonState({ variant: 'primary', loading: true, contractOk: true })
    expect(state.states.has('loading')).toBe(true)
    expect(state.ariaBusy).toBe('true')
  })

  it('loading でなければ aria-busy を持たない', () => {
    expect(
      computeButtonState({ variant: 'primary', loading: false, contractOk: true }).ariaBusy,
    ).toBeUndefined()
  })

  it('契約に合わない子なら malformed を出す', () => {
    expect(
      computeButtonState({ variant: 'primary', loading: false, contractOk: false }).states.has(
        'malformed',
      ),
    ).toBe(true)
  })
})

describe('decidePress', () => {
  it('loading 中の押下は止める', () => {
    expect(decidePress({ loading: true })).toEqual({ kind: 'blocked' })
    expect(decidePress({ loading: false })).toEqual({ kind: 'press' })
  })
})
