import { describe, expect, it } from 'vitest'
import { computeStates, decideDetailsAction } from './disclosure.logic.js'

describe('computeStates', () => {
  it('open と malformed を :state() にする', () => {
    expect([...computeStates({ open: true, malformed: false })]).toEqual(['open'])
    expect([...computeStates({ open: false, malformed: false })]).toEqual([])
  })

  it('契約に合わない子のときは malformed だけを出す', () => {
    expect([...computeStates({ open: true, malformed: true })]).toEqual(['malformed'])
  })
})

describe('decideDetailsAction', () => {
  it('属性と <details> の実状態が食い違うときだけ操作する', () => {
    expect(decideDetailsAction({ wanted: true, actual: false })).toBe('open')
    expect(decideDetailsAction({ wanted: false, actual: true })).toBe('close')
    expect(decideDetailsAction({ wanted: true, actual: true })).toBe('none')
    expect(decideDetailsAction({ wanted: false, actual: false })).toBe('none')
  })
})
