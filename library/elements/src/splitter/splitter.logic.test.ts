import { describe, expect, it } from 'vitest'
import {
  ariaOrientation,
  clampPosition,
  computeStates,
  decideKey,
  parseDirection,
  positionFromPointer,
} from './splitter.logic.js'

const BOUNDS = { min: 20, max: 80 } as const

describe('parseDirection', () => {
  it('vertical 以外はすべて horizontal', () => {
    expect(parseDirection('vertical')).toBe('vertical')
    expect(parseDirection('horizontal')).toBe('horizontal')
    expect(parseDirection('')).toBe('horizontal')
    expect(parseDirection(null)).toBe('horizontal')
  })
})

describe('clampPosition', () => {
  it('整数に丸め、min..max に収める', () => {
    expect(clampPosition(50.4, 20, 80)).toBe(50)
    expect(clampPosition(50.6, 20, 80)).toBe(51)
    expect(clampPosition(-10, 20, 80)).toBe(20)
    expect(clampPosition(120, 20, 80)).toBe(80)
  })

  it('min > max なら min を返す', () => {
    expect(clampPosition(50, 80, 20)).toBe(80)
  })

  it('読めない値は min に落とす', () => {
    expect(clampPosition(Number.NaN, 20, 80)).toBe(20)
  })
})

describe('positionFromPointer', () => {
  it('host の矩形の中の割合を % にする', () => {
    expect(positionFromPointer(300, { start: 100, size: 400 }, false, BOUNDS)).toBe(50)
    expect(positionFromPointer(200, { start: 100, size: 400 }, false, BOUNDS)).toBe(25)
  })

  it('RTL では左右を反転する', () => {
    expect(positionFromPointer(200, { start: 100, size: 400 }, true, BOUNDS)).toBe(75)
  })

  it('min..max を越えない。幅ゼロの矩形は min', () => {
    expect(positionFromPointer(110, { start: 100, size: 400 }, false, BOUNDS)).toBe(20)
    expect(positionFromPointer(490, { start: 100, size: 400 }, false, BOUNDS)).toBe(80)
    expect(positionFromPointer(100, { start: 100, size: 0 }, false, BOUNDS)).toBe(20)
  })
})

describe('decideKey', () => {
  it('横並びは ← → で 1%、Shift で 10%', () => {
    expect(decideKey('ArrowRight', false, 'horizontal', false, 50, BOUNDS)).toBe(51)
    expect(decideKey('ArrowLeft', false, 'horizontal', false, 50, BOUNDS)).toBe(49)
    expect(decideKey('ArrowRight', true, 'horizontal', false, 50, BOUNDS)).toBe(60)
  })

  it('RTL の横並びは ← → を反転する', () => {
    expect(decideKey('ArrowRight', false, 'horizontal', true, 50, BOUNDS)).toBe(49)
    expect(decideKey('ArrowLeft', false, 'horizontal', true, 50, BOUNDS)).toBe(51)
  })

  it('縦並びは ↑ ↓ で動き、RTL でも反転しない', () => {
    expect(decideKey('ArrowDown', false, 'vertical', false, 50, BOUNDS)).toBe(51)
    expect(decideKey('ArrowUp', false, 'vertical', false, 50, BOUNDS)).toBe(49)
    expect(decideKey('ArrowDown', false, 'vertical', true, 50, BOUNDS)).toBe(51)
  })

  it('向きが合わない矢印は扱わない（呼び側は preventDefault しない）', () => {
    expect(decideKey('ArrowDown', false, 'horizontal', false, 50, BOUNDS)).toBeUndefined()
    expect(decideKey('ArrowRight', false, 'vertical', false, 50, BOUNDS)).toBeUndefined()
    expect(decideKey('Enter', false, 'horizontal', false, 50, BOUNDS)).toBeUndefined()
    expect(decideKey(' ', false, 'horizontal', false, 50, BOUNDS)).toBeUndefined()
  })

  it('Home は min、End は max', () => {
    expect(decideKey('Home', false, 'horizontal', false, 50, BOUNDS)).toBe(20)
    expect(decideKey('End', false, 'vertical', true, 50, BOUNDS)).toBe(80)
  })

  it('min..max を越えない', () => {
    expect(decideKey('ArrowRight', true, 'horizontal', false, 75, BOUNDS)).toBe(80)
    expect(decideKey('ArrowLeft', true, 'horizontal', false, 25, BOUNDS)).toBe(20)
  })
})

describe('ariaOrientation', () => {
  it('面の並びと仕切り線の向きは逆になる（APG の separator）', () => {
    expect(ariaOrientation('horizontal')).toBe('vertical')
    expect(ariaOrientation('vertical')).toBe('horizontal')
  })
})

describe('computeStates', () => {
  it('属性と契約の状態を :state() の集合にする', () => {
    expect([
      ...computeStates({ dragging: false, direction: 'horizontal', malformed: false }),
    ]).toEqual([])
    expect([...computeStates({ dragging: true, direction: 'vertical', malformed: true })]).toEqual([
      'dragging',
      'vertical',
      'malformed',
    ])
  })
})
