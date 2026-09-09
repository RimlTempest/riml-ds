import { describe, expect, it } from 'vitest'
import {
  canStep,
  computeNumberFieldView,
  decimalsOf,
  type NumberFieldStateInput,
  parseStep,
  stepValue,
} from './number-field.logic.js'

/** `_shared/field.ts` の状態入力そのまま。契約が欠けていないときの既定 */
const STATE: NumberFieldStateInput = {
  malformed: false,
  invalid: false,
  touched: false,
  hasHint: false,
  hasError: false,
  filled: true,
}

const viewInput = (
  extra: Partial<Parameters<typeof computeNumberFieldView>[0]>,
): Parameters<typeof computeNumberFieldView>[0] => ({
  ...STATE,
  controlId: 'copies',
  error: '',
  validity: {},
  validationMessage: '',
  attrs: {},
  japanese: true,
  disabled: false,
  value: '1',
  ...extra,
})

describe('parseStep', () => {
  it('無い・any・0・負・数値でない は 1 に読む', () => {
    expect(parseStep(undefined)).toBe(1)
    expect(parseStep('')).toBe(1)
    expect(parseStep('any')).toBe(1)
    expect(parseStep('0')).toBe(1)
    expect(parseStep('-1')).toBe(1)
    expect(parseStep('abc')).toBe(1)
  })

  it('正の数はそのまま', () => {
    expect(parseStep('0.1')).toBe(0.1)
    expect(parseStep('5')).toBe(5)
  })
})

describe('decimalsOf', () => {
  it('小数点以下の桁数を数える', () => {
    expect(decimalsOf('1')).toBe(0)
    expect(decimalsOf('0.1')).toBe(1)
    expect(decimalsOf('0.25')).toBe(2)
    expect(decimalsOf('')).toBe(0)
  })

  it('指数表記は 0 に落とす（桁を数えても意味が無い）', () => {
    expect(decimalsOf('1e-3')).toBe(0)
  })
})

describe('stepValue', () => {
  it('空欄は 0 から刻む（min が無ければ 1 / -1）', () => {
    expect(stepValue({ value: '' }, 1)).toBe('1')
    expect(stepValue({ value: '' }, -1)).toBe('-1')
  })

  it('空欄で min があれば、どちら向きでも min から始まる', () => {
    expect(stepValue({ value: '', min: '5' }, 1)).toBe('5')
    expect(stepValue({ value: '', min: '5' }, -1)).toBe('5')
  })

  it('読めない値は空欄と同じに扱う（throw しない）', () => {
    expect(stepValue({ value: 'abc' }, 1)).toBe('1')
  })

  it('step の桁で丸める（0.2 + 0.1 が 0.30000000000000004 にならない）', () => {
    expect(stepValue({ value: '0.2', step: '0.1' }, 1)).toBe('0.3')
  })

  it('現在値の桁が step より細かければ、そちらの桁で丸める', () => {
    expect(stepValue({ value: '1.5', step: '1' }, 1)).toBe('2.5')
  })

  it('max / min で止める', () => {
    expect(stepValue({ value: '3', max: '3' }, 1)).toBe('3')
    expect(stepValue({ value: '0', min: '0' }, -1)).toBe('0')
  })

  it('step="any" は 1 刻みとして扱う（ボタンで刻めるように）', () => {
    expect(stepValue({ value: '2', step: 'any' }, 1)).toBe('3')
  })
})

describe('canStep', () => {
  it('max 以上なら + は押せず、min 以下なら - は押せない', () => {
    expect(canStep({ value: '3', min: '0', max: '3' }, 1)).toBe(false)
    expect(canStep({ value: '3', min: '0', max: '3' }, -1)).toBe(true)
    expect(canStep({ value: '0', min: '0', max: '3' }, -1)).toBe(false)
    expect(canStep({ value: '0', min: '0', max: '3' }, 1)).toBe(true)
  })

  it('空欄と読めない値はどちらも押せる', () => {
    expect(canStep({ value: '', min: '0', max: '3' }, 1)).toBe(true)
    expect(canStep({ value: '', min: '0', max: '3' }, -1)).toBe(true)
    expect(canStep({ value: 'abc' }, 1)).toBe(true)
  })

  it('min / max が無ければどちらも押せる', () => {
    expect(canStep({ value: '100' }, 1)).toBe(true)
    expect(canStep({ value: '-100' }, -1)).toBe(true)
  })
})

describe('computeNumberFieldView', () => {
  it('境界では押せるボタンだけが残る', () => {
    const view = computeNumberFieldView(viewInput({ value: '3', min: '0', max: '3' }))
    expect(view.canIncrement).toBe(false)
    expect(view.canDecrement).toBe(true)
  })

  it('disabled ならどちらも押せない', () => {
    const view = computeNumberFieldView(viewInput({ disabled: true, value: '1' }))
    expect(view.canIncrement).toBe(false)
    expect(view.canDecrement).toBe(false)
  })

  it('文言は日本語 UI と英語 UI で変わる', () => {
    expect(computeNumberFieldView(viewInput({})).decrementLabel).toBe('減らす')
    expect(computeNumberFieldView(viewInput({})).incrementLabel).toBe('増やす')
    const english = computeNumberFieldView(viewInput({ japanese: false }))
    expect(english.decrementLabel).toBe('Decrease')
    expect(english.incrementLabel).toBe('Increase')
  })

  it('_shared/field.ts の状態と文言をそのまま持つ', () => {
    const view = computeNumberFieldView(
      viewInput({ hasHint: true, hasError: true, error: '在庫が足りません。' }),
    )
    expect(view.message).toBe('在庫が足りません。')
    expect([...view.states].toSorted()).toEqual(['errored', 'filled', 'hinted', 'invalid'])
    expect(view.describedBy).toBe('copies-hint copies-error')
  })
})
