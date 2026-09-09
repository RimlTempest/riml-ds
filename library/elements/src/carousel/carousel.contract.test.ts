import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, itemMarkup, markup } from './carousel.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  it('契約の tree どおりの HTML を返す', () => {
    expect(markup({ label: 'おすすめ', children: '<li>a</li>' })).toBe(
      '<rd-carousel label="おすすめ"><ul tabindex="0"><li>a</li></ul></rd-carousel>',
    )
  })

  it('loop は存在で true の属性', () => {
    expect(markup({ label: 'x', children: '', loop: true })).toBe(
      '<rd-carousel label="x" loop><ul tabindex="0"></ul></rd-carousel>',
    )
    expect(markup({ label: 'x', children: '', loop: false })).toBe(
      '<rd-carousel label="x"><ul tabindex="0"></ul></rd-carousel>',
    )
  })

  it('横に転がる箱はキーボードで届く（axe scrollable-region-focusable）', () => {
    // JS 無しでも効くので `tabindex` は契約が持つ。element は足しも消しもしない
    expect(markup({ label: 'x', children: '' })).toContain('<ul tabindex="0">')
  })

  it('label はエスケープし、children は生のまま入れる', () => {
    const html = markup({ label: '<b>x</b>', children: '<li class="a">y</li>' })
    expect(html).toContain('label="&lt;b&gt;x&lt;/b&gt;"')
    expect(html).toContain('<li class="a">y</li>')
  })
})

describe('itemMarkup', () => {
  it('1 枚を <li> で包む（中身はエスケープしない）', () => {
    expect(itemMarkup({ children: '<p>1</p>' })).toBe('<li><p>1</p></li>')
  })
})

describe('contract', () => {
  it('必須の役割は列と枚', () => {
    expect(contract.required).toEqual(['track', 'item'])
    const present = [contract.roles['track'] ?? '', contract.roles['item'] ?? '']
    expect(checkContract(hostWith(present), contract).kind).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ['track', 'item'],
    })
  })

  it('<ul> だけで <li> が無ければ item が欠ける', () => {
    expect(checkContract(hostWith([contract.roles['track'] ?? '']), contract)).toEqual({
      kind: 'missing',
      roles: ['item'],
    })
  })
})
