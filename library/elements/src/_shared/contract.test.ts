import { describe, expect, it } from 'vitest'
import type { Contract, ContractHost } from './contract.js'
import { checkContract } from './contract.js'

const contract: Contract = {
  pe: 'A',
  roles: { label: ':scope > label', control: ':scope > input' },
  required: ['label', 'control'],
  tree: { tag: 'rd-text-field' },
}

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('checkContract', () => {
  it('必須の役割がすべて見つかれば ok と見つけた要素を返す', () => {
    const result = checkContract(hostWith([':scope > label', ':scope > input']), contract)
    expect(result.kind).toBe('ok')
    expect(result.kind === 'ok' ? Object.keys(result.found).toSorted() : []).toEqual([
      'control',
      'label',
    ])
  })

  it('足りない役割を列挙して missing を返す', () => {
    const result = checkContract(hostWith([':scope > label']), contract)
    expect(result).toEqual({ kind: 'missing', roles: ['control'] })
  })

  it('必須でない役割が無くても ok（found には載らない）', () => {
    const optional: Contract = { ...contract, required: ['control'] }
    const result = checkContract(hostWith([':scope > input']), optional)
    expect(result).toEqual({ kind: 'ok', found: { control: ':scope > input' } })
  })
})
