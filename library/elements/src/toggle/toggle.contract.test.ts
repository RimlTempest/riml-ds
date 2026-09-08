import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './toggle.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  it('<button type="button" aria-pressed="false"> を包む形を返す', () => {
    expect(markup({ label: '一覧' })).toBe(
      '<rd-toggle><button type="button" aria-pressed="false">一覧</button></rd-toggle>',
    )
  })

  it('pressed: "true" はそのまま aria-pressed になる', () => {
    expect(markup({ label: '格子', pressed: 'true' })).toBe(
      '<rd-toggle><button type="button" aria-pressed="true">格子</button></rd-toggle>',
    )
  })

  it('variant は指定したときだけ属性になる', () => {
    expect(markup({ label: '一覧', variant: 'ghost' })).toBe(
      '<rd-toggle variant="ghost"><button type="button" aria-pressed="false">一覧</button>'
        + '</rd-toggle>',
    )
  })

  it('文言をエスケープする', () => {
    expect(markup({ label: '<b>x</b>' })).toBe(
      '<rd-toggle><button type="button" aria-pressed="false">&lt;b&gt;x&lt;/b&gt;</button>'
        + '</rd-toggle>',
    )
  })
})

describe('contract', () => {
  it('control（<button>）だけが必須', () => {
    expect(contract.required).toEqual(['control'])
    expect(checkContract(hostWith([contract.roles['control'] ?? '']), contract).kind).toBe('ok')
  })

  it('<button> が無ければ missing になる', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['control'],
    })
  })
})
