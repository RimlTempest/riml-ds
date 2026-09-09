import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './number-field.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  it('<label for> と <input type="number"> を返す', () => {
    expect(markup({ id: 'copies', label: '枚数', name: 'copies', defaultValue: '1' })).toBe(
      '<rd-number-field><label for="copies">枚数</label>'
        + '<input type="number" id="copies" name="copies" value="1"></rd-number-field>',
    )
  })

  it('min / max / step / required / hint / error が通る', () => {
    expect(
      markup({
        id: 'copies',
        label: '枚数',
        name: 'copies',
        defaultValue: '1',
        min: '1',
        max: '99',
        step: '1',
        required: true,
        hint: '1 から 99 まで',
        error: '在庫が足りません。',
      }),
    ).toBe(
      '<rd-number-field hint="1 から 99 まで" error="在庫が足りません。">'
        + '<label for="copies">枚数</label>'
        + '<input type="number" id="copies" name="copies" value="1" min="1" max="99" step="1"'
        + ' required></rd-number-field>',
    )
  })

  it('defaultValue を省くと value 属性が出ない（空欄で始まる）', () => {
    const html = markup({ id: 'copies', label: '枚数', name: 'copies' })
    expect(html).not.toContain('value=')
    expect(html).toBe(
      '<rd-number-field><label for="copies">枚数</label>'
        + '<input type="number" id="copies" name="copies"></rd-number-field>',
    )
  })

  it('label と error をエスケープする', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', name: 'a', error: '"y"' })).toBe(
      '<rd-number-field error="&quot;y&quot;"><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + '<input type="number" id="a" name="a"></rd-number-field>',
    )
  })
})

describe('contract', () => {
  it('label と control が必須', () => {
    expect(contract.required).toEqual(['label', 'control'])
    expect(
      checkContract(
        hostWith([contract.roles['label'] ?? '', contract.roles['control'] ?? '']),
        contract,
      ).kind,
    ).toBe('ok')
  })

  it('<input type="number"> が無ければ missing になる', () => {
    expect(checkContract(hostWith([contract.roles['label'] ?? '']), contract)).toEqual({
      kind: 'missing',
      roles: ['control'],
    })
  })

  it('ティア A で、control は type="number" の <input> だけ', () => {
    expect(contract.pe).toBe('A')
    expect(contract.roles['control']).toBe(':scope > input[type="number"]')
  })
})
