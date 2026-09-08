import { describe, expect, it } from 'vitest'
import type { RadioGroupView, RadioGroupViewInput } from './radio-group.logic.js'
import { computeRadioGroupView } from './radio-group.logic.js'

const view = (overrides: Partial<RadioGroupViewInput> = {}): RadioGroupView =>
  computeRadioGroupView({
    controlId: 'plan-free',
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
    segmented: false,
    ...overrides,
  })

describe('computeRadioGroupView', () => {
  it('未選択のまま操作されたら invalid と日本語の文言を出す', () => {
    const result = view({ validity: { valueMissing: true }, invalid: true, touched: true })
    expect(result.message).toBe('未入力です。入力してください。')
    expect([...result.states].toSorted()).toEqual(['invalid'])
    expect(result.ariaInvalid).toBe('true')
  })

  it('操作前は文言を出さない', () => {
    const result = view({ validity: { valueMissing: true }, invalid: true })
    expect(result.message).toBe('')
    expect([...result.states]).toEqual([])
  })

  it('error 属性が最優先', () => {
    const result = view({
      error: 'このプランは選べません。別のプランを選んでください。',
      hasError: true,
      validity: { valueMissing: true },
      invalid: true,
      touched: true,
    })
    expect(result.message).toBe('このプランは選べません。別のプランを選んでください。')
    expect([...result.states].toSorted()).toEqual(['errored', 'invalid'])
  })

  it('segmented は :state(segmented) になる', () => {
    expect([...view({ segmented: true }).states]).toEqual(['segmented'])
  })

  it('hint があれば hinted、選択済みなら filled', () => {
    expect([...view({ hasHint: true, filled: true }).states].toSorted()).toEqual([
      'filled',
      'hinted',
    ])
  })

  it('契約に合わない子のときは malformed だけを出す', () => {
    expect([...view({ malformed: true, segmented: true, hasHint: true }).states]).toEqual([
      'malformed',
    ])
  })

  it('describedBy は hint と error の id を空白区切りで返す', () => {
    const result = view({
      hasHint: true,
      hasError: true,
      error: '選んでください。',
      touched: true,
    })
    expect(result.describedBy).toBe('plan-free-hint plan-free-error')
  })

  it('hint も error も無ければ describedBy は付けない', () => {
    expect(view().describedBy).toBeUndefined()
  })
})
