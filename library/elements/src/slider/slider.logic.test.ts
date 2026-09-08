import { describe, expect, it } from 'vitest'
import type { SliderView, SliderViewInput } from './slider.logic.js'
import { computeSliderView } from './slider.logic.js'

const view = (overrides: Partial<SliderViewInput> = {}): SliderView =>
  computeSliderView({
    controlId: 'volume',
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
    filled: true,
    orientation: 'horizontal',
    value: '0',
    min: '0',
    max: '1',
    unit: '',
    ...overrides,
  })

describe('computeSliderView', () => {
  it('値と範囲から塗りの割合と <output> の文言を出す', () => {
    const result = view({ value: '3', min: '0', max: '10', unit: ' GB' })
    expect(result.fill).toBe(0.3)
    expect(result.outputText).toBe('3 GB')
  })

  it('単位が無ければ値だけを出す', () => {
    expect(view({ value: '7', min: '0', max: '10' }).outputText).toBe('7')
  })

  it('範囲の外は 0–1 に丸める', () => {
    expect(view({ value: '20', min: '0', max: '10' }).fill).toBe(1)
    expect(view({ value: '-5', min: '0', max: '10' }).fill).toBe(0)
  })

  it('max が min 以下なら 0', () => {
    expect(view({ value: '3', min: '10', max: '10' }).fill).toBe(0)
    expect(view({ value: '3', min: '10', max: '0' }).fill).toBe(0)
  })

  it('数にならない値は 0', () => {
    expect(view({ value: 'とても大きい', min: '0', max: '10' }).fill).toBe(0)
    expect(view({ value: '3', min: '0', max: 'たくさん' }).fill).toBe(0)
  })

  it('orientation が vertical なら :state(vertical)', () => {
    expect([...view({ orientation: 'vertical' }).states].toSorted()).toEqual(['filled', 'vertical'])
  })

  it('範囲を超えた値を操作後に置いたら日本語の文言を出す', () => {
    const result = view({
      value: '20',
      min: '0',
      max: '10',
      attrs: { min: '0', max: '10' },
      validity: { rangeOverflow: true },
      invalid: true,
      touched: true,
    })
    expect(result.message).toBe('大きすぎます。10 以下で入力してください。')
    expect([...result.states].toSorted()).toEqual(['filled', 'invalid'])
  })

  it('契約に合わない子のときは malformed だけを出し、塗りは 0', () => {
    const result = view({ malformed: true, value: '3', min: '0', max: '10' })
    expect([...result.states]).toEqual(['malformed'])
    expect(result.fill).toBe(0)
  })
})
