import { describe, expect, it } from 'vitest'
import { computeCheckboxStates, switchRole } from './checkbox.logic.js'

const input = (
  overrides: Readonly<Record<string, boolean>>,
): Parameters<typeof computeCheckboxStates>[0] => ({
  malformed: false,
  invalid: false,
  touched: false,
  hasHint: false,
  hasError: false,
  filled: false,
  checked: false,
  indeterminate: false,
  asSwitch: false,
  ...overrides,
})

describe('computeCheckboxStates', () => {
  it('共通のフォーム状態に checked / indeterminate / switch を足す', () => {
    expect([...computeCheckboxStates(input({ checked: true, hasHint: true }))].toSorted()).toEqual([
      'checked',
      'hinted',
    ])
    expect(
      [...computeCheckboxStates(input({ indeterminate: true, asSwitch: true }))].toSorted(),
    ).toEqual(['indeterminate', 'switch'])
  })

  it('契約に合わない子のときは malformed だけを出す', () => {
    expect([...computeCheckboxStates(input({ malformed: true, checked: true }))]).toEqual([
      'malformed',
    ])
  })

  it('error があれば errored と invalid が付く', () => {
    expect([...computeCheckboxStates(input({ hasError: true }))].toSorted()).toEqual([
      'errored',
      'invalid',
    ])
  })
})

describe('switchRole', () => {
  it('switch のときだけ role=switch を返す（JS 無しはチェックボックスのまま）', () => {
    expect(switchRole(true)).toBe('switch')
    expect(switchRole(false)).toBeUndefined()
  })
})
