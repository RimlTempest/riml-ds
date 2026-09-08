import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './splitter.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const PROPS = { label: 'サイドバーの幅', start: '<p>一覧</p>', end: '<p>本文</p>' } as const

describe('markup', () => {
  it('契約の tree どおりの HTML を返す', () => {
    expect(markup(PROPS)).toBe(
      '<rd-splitter label="サイドバーの幅">'
        + '<div slot="start"><p>一覧</p></div>'
        + '<div slot="end"><p>本文</p></div>'
        + '</rd-splitter>',
    )
  })

  it('数値の属性は文字列にして出す（未指定なら属性ごと省く）', () => {
    const html = markup({ ...PROPS, direction: 'vertical', position: 40, min: 30, max: 70 })
    expect(html).toContain('direction="vertical"')
    expect(html).toContain('position="40"')
    expect(html).toContain('min="30"')
    expect(html).toContain('max="70"')
    expect(markup(PROPS)).not.toContain('position=')
  })

  it('ラベルをエスケープする（start / end は生 HTML のまま）', () => {
    expect(markup({ ...PROPS, label: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(markup(PROPS)).toContain('<p>一覧</p>')
  })
})

describe('contract', () => {
  it('必須の役割が揃っていれば ok', () => {
    expect(contract.pe).toBe('B')
    expect(contract.required).toEqual(['start', 'end'])
    expect(
      checkContract(
        hostWith([contract.roles['start'] ?? '', contract.roles['end'] ?? '']),
        contract,
      ).kind,
    ).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['start', 'end'],
    })
  })

  it('slot="end" だけ欠けても missing になる', () => {
    expect(checkContract(hostWith([contract.roles['start'] ?? '']), contract)).toEqual({
      kind: 'missing',
      roles: ['end'],
    })
  })
})
