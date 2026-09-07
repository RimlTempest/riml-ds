import { describe, expect, it } from 'vitest'
import { markup } from './disclosure.contract.js'

describe('markup', () => {
  it('<details> と <summary> を持つ HTML を返す', () => {
    expect(markup({ label: '送料について', children: '<p>全国一律 500 円です。</p>' })).toBe(
      '<rd-disclosure><details><summary>送料について</summary>'
        + '<p>全国一律 500 円です。</p></details></rd-disclosure>',
    )
  })

  it('group / open は指定したときだけ属性に出る。label はエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '', group: 'faq', open: true })).toBe(
      '<rd-disclosure><details name="faq" open><summary>&lt;b&gt;x&lt;/b&gt;</summary>'
        + '</details></rd-disclosure>',
    )
  })
})
