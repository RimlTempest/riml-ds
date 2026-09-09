import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup, toggleItemMarkup } from './toggle-group.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const allRoles = (): readonly string[] =>
  contract.required.map((role) => contract.roles[role] ?? '')

describe('toggleItemMarkup', () => {
  it('pressed を省くと aria-pressed="false" を書く（属性ごと消すと toggle でなくなる）', () => {
    expect(toggleItemMarkup({ label: '太字', value: 'bold' })).toBe(
      '<button type="button" value="bold" aria-pressed="false">太字</button>',
    )
  })

  it('pressed: "true" はそのまま aria-pressed になる', () => {
    expect(toggleItemMarkup({ label: '斜体', value: 'italic', pressed: 'true' })).toBe(
      '<button type="button" value="italic" aria-pressed="true">斜体</button>',
    )
  })

  it('disabled は存在で true（ネイティブに任せる）', () => {
    expect(toggleItemMarkup({ label: '下線', value: 'underline', disabled: true })).toBe(
      '<button type="button" value="underline" aria-pressed="false" disabled>下線</button>',
    )
  })

  it('文言も属性値もエスケープする', () => {
    expect(toggleItemMarkup({ label: '<b>x</b>', value: '"a"' })).toBe(
      '<button type="button" value="&quot;a&quot;" aria-pressed="false">'
        + '&lt;b&gt;x&lt;/b&gt;</button>',
    )
  })
})

describe('markup', () => {
  it('<fieldset><legend> と [part="options"] を包む形を返す', () => {
    expect(
      markup({ label: '書式', children: toggleItemMarkup({ label: '太字', value: 'bold' }) }),
    ).toBe(
      '<rd-toggle-group><fieldset><legend>書式</legend><div part="options">'
        + '<button type="button" value="bold" aria-pressed="false">太字</button>'
        + '</div></fieldset></rd-toggle-group>',
    )
  })

  it('mode / orientation / variant は指定したときだけ属性になる', () => {
    expect(
      markup({
        label: '表示',
        children: '',
        mode: 'single',
        orientation: 'vertical',
        variant: 'ghost',
      }),
    ).toBe(
      '<rd-toggle-group mode="single" orientation="vertical" variant="ghost">'
        + '<fieldset><legend>表示</legend><div part="options"></div></fieldset></rd-toggle-group>',
    )
  })

  it('<legend> の文言をエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '' })).toContain(
      '<legend>&lt;b&gt;x&lt;/b&gt;</legend>',
    )
  })

  it('children は生 HTML としてそのまま入る（利用側が toggleItemMarkup で組む契約）', () => {
    expect(markup({ label: '書式', children: '<button type="button">生</button>' })).toContain(
      '<div part="options"><button type="button">生</button></div>',
    )
  })
})

describe('contract', () => {
  it('fieldset / legend / options / item がすべて必須', () => {
    expect(contract.required).toEqual(['fieldset', 'legend', 'options', 'item'])
    expect(checkContract(hostWith(allRoles()), contract).kind).toBe('ok')
  })

  it('1 つでも欠けたら missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['fieldset', 'legend', 'options', 'item'],
    })
  })

  it('<button> だけ欠けたら item が missing になる', () => {
    const without = allRoles().filter((selector) => selector !== contract.roles['item'])
    expect(checkContract(hostWith(without), contract)).toEqual({ kind: 'missing', roles: ['item'] })
  })
})
