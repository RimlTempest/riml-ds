import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup, otpCellsMarkup } from './input-otp.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const cell = (index: number, extra = ''): string =>
  `<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" id="code-${index}" `
  + `name="code-${index}" aria-label="${index} 桁目" title="0〜9 の数字 1 文字" required${extra}>`

describe('otpCellsMarkup', () => {
  it('既定は 6 桁で、autocomplete は最初の 1 桁だけに付く', () => {
    const html = otpCellsMarkup({ name: 'code' })
    expect(html).toBe(
      cell(1, ' autocomplete="one-time-code"') + cell(2) + cell(3) + cell(4) + cell(5) + cell(6),
    )
  })

  it('length で桁数を変えられる', () => {
    expect(otpCellsMarkup({ name: 'code', length: 2, autocomplete: false })).toBe(cell(1) + cell(2))
  })

  it('aria-label は「N 桁目」（markup は静的なので言語を見ない）', () => {
    expect(otpCellsMarkup({ name: 'code', length: 1, autocomplete: false })).toContain(
      'aria-label="1 桁目"',
    )
  })

  it('name をエスケープする', () => {
    expect(otpCellsMarkup({ name: '"x"', length: 1, autocomplete: false })).toContain(
      'name="&quot;x&quot;-1"',
    )
  })
})

describe('markup', () => {
  it('<fieldset> が <legend> と桁の入れ物を包む形を返す', () => {
    expect(
      markup({ label: '確認コード', children: otpCellsMarkup({ name: 'code', length: 1 }) }),
    ).toBe(
      '<rd-input-otp><fieldset><legend>確認コード</legend><div part="cells">'
        + cell(1, ' autocomplete="one-time-code"')
        + '</div></fieldset></rd-input-otp>',
    )
  })

  it('hint / error は指定したときだけ属性になる', () => {
    expect(markup({ label: '確認コード', children: '', hint: '6 桁の数字' })).toBe(
      '<rd-input-otp hint="6 桁の数字"><fieldset><legend>確認コード</legend>'
        + '<div part="cells"></div></fieldset></rd-input-otp>',
    )
  })

  it('legend と error をエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '', error: '"y"' })).toBe(
      '<rd-input-otp error="&quot;y&quot;"><fieldset><legend>&lt;b&gt;x&lt;/b&gt;</legend>'
        + '<div part="cells"></div></fieldset></rd-input-otp>',
    )
  })
})

describe('contract', () => {
  it('fieldset / legend / control が必須（control は最初の 1 桁で判定する）', () => {
    expect(contract.required).toEqual(['fieldset', 'legend', 'control'])
    expect(
      checkContract(
        hostWith([
          contract.roles['fieldset'] ?? '',
          contract.roles['legend'] ?? '',
          contract.roles['control'] ?? '',
        ]),
        contract,
      ).kind,
    ).toBe('ok')
  })

  it('<legend> が無ければ missing になる', () => {
    expect(
      checkContract(
        hostWith([contract.roles['fieldset'] ?? '', contract.roles['control'] ?? '']),
        contract,
      ),
    ).toEqual({ kind: 'missing', roles: ['legend'] })
  })
})
