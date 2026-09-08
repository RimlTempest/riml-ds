import { describe, expect, it } from 'vitest'
import type { OtpView, OtpViewInput } from './input-otp.logic.js'
import { computeOtpView, distributePaste, nextCellIndex } from './input-otp.logic.js'

const view = (overrides: Partial<OtpViewInput> = {}): OtpView =>
  computeOtpView({
    controlId: 'code-1',
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
    values: ['', '', '', '', '', ''],
    ...overrides,
  })

describe('nextCellIndex', () => {
  it('入力後と ArrowRight は次の桁へ進む', () => {
    expect(nextCellIndex({ index: 0, count: 6, key: 'input' })).toBe(1)
    expect(nextCellIndex({ index: 0, count: 6, key: 'ArrowRight' })).toBe(1)
  })

  it('ArrowLeft と Backspace は前の桁へ戻る', () => {
    expect(nextCellIndex({ index: 3, count: 6, key: 'ArrowLeft' })).toBe(2)
    expect(nextCellIndex({ index: 3, count: 6, key: 'Backspace' })).toBe(2)
  })

  it('範囲外は端に留まる', () => {
    expect(nextCellIndex({ index: 5, count: 6, key: 'ArrowRight' })).toBe(5)
    expect(nextCellIndex({ index: 0, count: 6, key: 'Backspace' })).toBe(0)
  })

  it('知らないキーでは動かない', () => {
    expect(nextCellIndex({ index: 2, count: 6, key: 'a' })).toBe(2)
  })

  it('桁が無ければ 0 に落ちる', () => {
    expect(nextCellIndex({ index: 0, count: 0, key: 'ArrowRight' })).toBe(0)
  })
})

describe('distributePaste', () => {
  it('数字だけを桁数ぶん取り出す', () => {
    expect(distributePaste({ text: '12-34 56', count: 6 })).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('桁数を超えた分は捨てる', () => {
    expect(distributePaste({ text: '1234567', count: 3 })).toEqual(['1', '2', '3'])
  })

  it('足りなければ足りないまま返す', () => {
    expect(distributePaste({ text: 'ab1', count: 6 })).toEqual(['1'])
  })
})

describe('computeOtpView', () => {
  it('全桁埋まったら filled になり、value が連結される', () => {
    const result = view({ values: ['1', '2', '3', '4', '5', '6'] })
    expect(result.value).toBe('123456')
    expect([...result.states]).toEqual(['filled'])
  })

  it('1 桁でも空なら filled にならない', () => {
    expect([...view({ values: ['1', '2', '3', '4', '5', ''] }).states]).toEqual([])
  })

  it('未入力のまま操作されたら invalid と日本語の文言を出す', () => {
    const result = view({ validity: { valueMissing: true }, invalid: true, touched: true })
    expect(result.message).toBe('未入力です。入力してください。')
    expect([...result.states].toSorted()).toEqual(['invalid'])
  })

  it('error 属性が最優先', () => {
    const result = view({
      error: 'コードが違います。もう一度入力してください。',
      hasError: true,
      validity: { valueMissing: true },
      invalid: true,
      touched: true,
    })
    expect(result.message).toBe('コードが違います。もう一度入力してください。')
    expect([...result.states].toSorted()).toEqual(['errored', 'invalid'])
  })

  it('契約に合わない子のときは malformed だけを出す', () => {
    expect([...view({ malformed: true, hasHint: true }).states]).toEqual(['malformed'])
  })

  it('describedBy は hint と error の id を空白区切りで返す', () => {
    const result = view({ hasHint: true, hasError: true, error: '違います。', touched: true })
    expect(result.describedBy).toBe('code-1-hint code-1-error')
  })

  it('hint も error も無ければ describedBy は付けない', () => {
    expect(view().describedBy).toBeUndefined()
  })
})
