import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup, radioOptionMarkup } from './radio-group.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const OPTIONS = [
  radioOptionMarkup({
    id: 'plan-free',
    name: 'plan',
    value: 'free',
    label: '無料',
    required: true,
  }),
  radioOptionMarkup({ id: 'plan-pro', name: 'plan', value: 'pro', label: '有料' }),
].join('')

describe('radioOptionMarkup', () => {
  it('<label> が <input type="radio"> と文言を包む形を返す', () => {
    expect(radioOptionMarkup({ id: 'plan-pro', name: 'plan', value: 'pro', label: '有料' })).toBe(
      '<label><input type="radio" id="plan-pro" name="plan" value="pro">有料</label>',
    )
  })

  it('required / defaultChecked / disabled は指定したときだけ出る', () => {
    expect(
      radioOptionMarkup({
        id: 'plan-free',
        name: 'plan',
        value: 'free',
        label: '無料',
        defaultChecked: true,
        required: true,
        disabled: true,
      }),
    ).toBe(
      '<label><input type="radio" id="plan-free" name="plan" value="free" checked required disabled>'
        + '無料</label>',
    )
  })

  it('文言をエスケープする', () => {
    expect(radioOptionMarkup({ id: 'a', name: 'a', value: 'a', label: '<b>x</b>' })).toBe(
      '<label><input type="radio" id="a" name="a" value="a">&lt;b&gt;x&lt;/b&gt;</label>',
    )
  })
})

describe('markup', () => {
  it('<fieldset> が <legend> と選択肢の入れ物を包む形を返す', () => {
    expect(markup({ label: 'プラン', children: OPTIONS })).toBe(
      '<rd-radio-group><fieldset><legend>プラン</legend><div part="options">'
        + '<label><input type="radio" id="plan-free" name="plan" value="free" required>無料</label>'
        + '<label><input type="radio" id="plan-pro" name="plan" value="pro">有料</label>'
        + '</div></fieldset></rd-radio-group>',
    )
  })

  it('segmented / hint / error は指定したときだけ属性になる', () => {
    expect(
      markup({ label: 'プラン', children: '', segmented: true, hint: 'あとで変更できます' }),
    ).toBe(
      '<rd-radio-group segmented hint="あとで変更できます"><fieldset><legend>プラン</legend>'
        + '<div part="options"></div></fieldset></rd-radio-group>',
    )
  })

  it('legend と error をエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '', error: '"y"' })).toBe(
      '<rd-radio-group error="&quot;y&quot;"><fieldset><legend>&lt;b&gt;x&lt;/b&gt;</legend>'
        + '<div part="options"></div></fieldset></rd-radio-group>',
    )
  })
})

describe('contract', () => {
  it('fieldset / legend / control が必須（options は 1 個目で判定する任意役割）', () => {
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
