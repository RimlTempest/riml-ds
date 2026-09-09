import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './calendar.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  it('<label for> と <input type="date"> を light DOM に出す', () => {
    expect(markup({ id: 'due', label: '期限', name: 'due' })).toBe(
      '<rd-calendar><label for="due">期限</label><input id="due" name="due" type="date"></rd-calendar>',
    )
  })

  it('today / week-start はホストの属性に出る', () => {
    const html = markup({ id: 'due', label: '期限', today: '2026-09-09', weekStart: '1' })
    expect(html).toContain('<rd-calendar today="2026-09-09" week-start="1">')
  })

  it('min / max / required は <input> の属性に出る（ホストには出ない）', () => {
    const html = markup({
      id: 'due',
      label: '期限',
      name: 'due',
      defaultValue: '2026-09-15',
      min: '2026-09-05',
      max: '2026-09-25',
      required: true,
    })
    expect(html).toContain(
      '<input id="due" name="due" type="date" value="2026-09-15" min="2026-09-05" max="2026-09-25" required>',
    )
    expect(html).toContain('<rd-calendar>')
  })

  it('picker はホストの真偽属性として出る（存在で true）', () => {
    const html = markup({ id: 'due', label: '期限', today: '2026-09-09', picker: true })
    expect(html).toContain('<rd-calendar today="2026-09-09" picker>')
  })

  it('省略した prop は属性ごと出さない', () => {
    const html = markup({ id: 'due', label: '期限' })
    expect(html).not.toContain('name=')
    expect(html).not.toContain('required')
    expect(html).not.toContain('week-start')
    expect(html).not.toContain('picker')
  })

  it('文言をエスケープする', () => {
    expect(markup({ id: 'f', label: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})

describe('contract', () => {
  it('ティア A で、<label> と <input type="date"> を必須にする', () => {
    expect(contract.pe).toBe('A')
    expect(contract.required).toEqual(['label', 'control'])
    expect(contract.roles['control']).toBe(':scope > input[type="date"]')
  })

  it('必須の役割が揃っていれば ok', () => {
    const present = [contract.roles['label'] ?? '', contract.roles['control'] ?? '']
    expect(checkContract(hostWith(present), contract).kind).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['label', 'control'],
    })
  })

  it('<input> だけ欠けても missing になる', () => {
    expect(checkContract(hostWith([contract.roles['label'] ?? '']), contract)).toEqual({
      kind: 'missing',
      roles: ['control'],
    })
  })
})
