import { describe, expect, it } from 'vitest'
import { computeToggleView, nextPressed, toAriaPressed, toToggleVariant } from './toggle.logic.js'

describe('nextPressed', () => {
  it('押下のたびに反転する', () => {
    expect(nextPressed(false)).toBe(true)
    expect(nextPressed(true)).toBe(false)
  })
})

describe('toToggleVariant', () => {
  it('知らない値は outline に寄せる', () => {
    expect(toToggleVariant('ghost')).toBe('ghost')
    expect(toToggleVariant('outline')).toBe('outline')
    expect(toToggleVariant('nope')).toBe('outline')
  })
})

describe('computeToggleView', () => {
  it('variant は必ず状態に出る', () => {
    expect([
      ...computeToggleView({ pressed: false, variant: 'outline', malformed: false }).states,
    ]).toEqual(['outline'])
  })

  it('押下中は pressed が足される', () => {
    expect(
      [
        ...computeToggleView({ pressed: true, variant: 'ghost', malformed: false }).states,
      ].toSorted(),
    ).toEqual(['ghost', 'pressed'])
  })

  it('契約の子が無ければ malformed だけを出す', () => {
    expect([
      ...computeToggleView({ pressed: true, variant: 'ghost', malformed: true }).states,
    ]).toEqual(['malformed'])
  })
})

describe('toAriaPressed', () => {
  it('属性を消さずに ‘true’ / ‘false’ を書く（消すと toggle でなくなる）', () => {
    expect(toAriaPressed(true)).toBe('true')
    expect(toAriaPressed(false)).toBe('false')
  })
})
