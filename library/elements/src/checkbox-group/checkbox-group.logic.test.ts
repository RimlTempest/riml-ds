import { describe, expect, it } from 'vitest'
import type { CheckboxGroupView, CheckboxGroupViewInput } from './checkbox-group.logic.js'
import { computeCheckboxGroupView } from './checkbox-group.logic.js'

const view = (overrides: Partial<CheckboxGroupViewInput> = {}): CheckboxGroupView =>
  computeCheckboxGroupView({
    controlId: 'tag-a',
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
    segmented: false,
    checkedCount: 0,
    min: 0,
    ...overrides,
  })

describe('computeCheckboxGroupView', () => {
  it('min 未満のまま操作されたら invalid と「未入力です」を出す（文言は writing.md の表）', () => {
    const result = view({ min: 1, touched: true })
    expect(result.message).toBe('未入力です。入力してください。')
    expect([...result.states].toSorted()).toEqual(['invalid'])
  })

  it('min を満たせば invalid にならず filled になる', () => {
    const result = view({ min: 1, checkedCount: 1, touched: true })
    expect(result.message).toBe('')
    expect([...result.states]).toEqual(['filled'])
  })

  it('min が 0 なら下限を見ない', () => {
    expect([...view({ touched: true }).states]).toEqual([])
  })

  it('操作前は文言を出さない', () => {
    expect(view({ min: 1 }).message).toBe('')
  })

  it('error 属性が最優先', () => {
    const result = view({
      error: 'この組み合わせは選べません。1 つだけ選んでください。',
      hasError: true,
      min: 1,
      touched: true,
    })
    expect(result.message).toBe('この組み合わせは選べません。1 つだけ選んでください。')
    expect([...result.states].toSorted()).toEqual(['errored', 'invalid'])
  })

  it('ネイティブの invalid（required な checkbox）も invalid になる', () => {
    const result = view({ validity: { valueMissing: true }, invalid: true, touched: true })
    expect(result.message).toBe('未入力です。入力してください。')
    expect([...result.states].toSorted()).toEqual(['invalid'])
  })

  it('segmented は :state(segmented) になる', () => {
    expect([...view({ segmented: true }).states]).toEqual(['segmented'])
  })

  it('契約に合わない子のときは malformed だけを出す', () => {
    expect([...view({ malformed: true, segmented: true, checkedCount: 2 }).states]).toEqual([
      'malformed',
    ])
  })

  it('describedBy は hint と error の id を空白区切りで返す', () => {
    const result = view({ hasHint: true, hasError: true, error: '選んでください。', touched: true })
    expect(result.describedBy).toBe('tag-a-hint tag-a-error')
  })

  it('hint も error も無ければ describedBy は付けない', () => {
    expect(view().describedBy).toBeUndefined()
  })
})
