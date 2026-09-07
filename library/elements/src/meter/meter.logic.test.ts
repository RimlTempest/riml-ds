import { describe, expect, it } from 'vitest'
import { computeFill, computeMeterView } from './meter.logic.js'

describe('computeFill', () => {
  it('min..max のあいだの割合を 0–1 で返す', () => {
    expect(computeFill({ value: 3.2, min: 0, max: 10 })).toEqual({
      ok: true,
      value: { fill: 0.32 },
    })
    expect(computeFill({ value: 5, min: 0, max: 10 })).toEqual({ ok: true, value: { fill: 0.5 } })
    expect(computeFill({ value: 7, min: 5, max: 9 })).toEqual({ ok: true, value: { fill: 0.5 } })
  })

  it('範囲の外は 0–1 に丸める', () => {
    expect(computeFill({ value: -4, min: 0, max: 10 })).toEqual({ ok: true, value: { fill: 0 } })
    expect(computeFill({ value: 40, min: 0, max: 10 })).toEqual({ ok: true, value: { fill: 1 } })
  })

  it('max <= min は invalid-range（throw しない）', () => {
    expect(computeFill({ value: 1, min: 10, max: 10 })).toEqual({
      ok: false,
      error: 'invalid-range',
    })
    expect(computeFill({ value: 1, min: 10, max: 2 })).toEqual({
      ok: false,
      error: 'invalid-range',
    })
  })

  it('NaN は invalid-range', () => {
    expect(computeFill({ value: Number.NaN, min: 0, max: 10 })).toEqual({
      ok: false,
      error: 'invalid-range',
    })
    expect(computeFill({ value: 1, min: Number.NaN, max: 10 })).toEqual({
      ok: false,
      error: 'invalid-range',
    })
    expect(computeFill({ value: 1, min: 0, max: Number.NaN })).toEqual({
      ok: false,
      error: 'invalid-range',
    })
  })
})

describe('computeMeterView', () => {
  const attrs = { value: '3.2', min: '0', max: '10' }

  it('属性の文字列を読んで fill にする', () => {
    const view = computeMeterView({ attrs, indeterminate: false, malformed: false })
    expect(view.fill).toBe(0.32)
    expect([...view.states]).toEqual([])
  })

  it('省略された min / max は HTML の既定（0 と 1）', () => {
    const view = computeMeterView({
      attrs: { value: '0.4', min: undefined, max: undefined },
      indeterminate: false,
      malformed: false,
    })
    expect(view.fill).toBe(0.4)
  })

  it('value 無しの <progress> は fill 0 の indeterminate', () => {
    const view = computeMeterView({
      attrs: { value: undefined, min: undefined, max: '10' },
      indeterminate: true,
      malformed: false,
    })
    expect(view.fill).toBe(0)
    expect([...view.states]).toEqual(['indeterminate'])
  })

  it('範囲が壊れていれば fill 0 のまま（例外を投げない）', () => {
    const view = computeMeterView({
      attrs: { value: '5', min: '10', max: '2' },
      indeterminate: false,
      malformed: false,
    })
    expect(view.fill).toBe(0)
  })

  it('契約の子が無ければ malformed だけを立てる', () => {
    const view = computeMeterView({ attrs, indeterminate: false, malformed: true })
    expect([...view.states]).toEqual(['malformed'])
    expect(view.fill).toBe(0)
  })
})
