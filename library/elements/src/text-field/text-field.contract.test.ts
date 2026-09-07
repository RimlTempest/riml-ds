import { describe, expect, it } from 'vitest'
import { markup } from './text-field.contract.js'

describe('markup', () => {
  it('<label for> と <input id> を対にした HTML を返す', () => {
    expect(
      markup({ id: 'email', label: 'メール', name: 'email', type: 'email', required: true }),
    ).toBe(
      '<rd-text-field><label for="email">メール</label>'
        + '<input id="email" name="email" type="email" required></rd-text-field>',
    )
  })

  it('hint / error / autocomplete / defaultValue は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'name',
        label: '名前',
        name: 'name',
        hint: '本名でなくてよい',
        autocomplete: 'name',
        defaultValue: 'りむる',
      }),
    ).toBe(
      '<rd-text-field hint="本名でなくてよい"><label for="name">名前</label>'
        + '<input id="name" name="name" autocomplete="name" value="りむる"></rd-text-field>',
    )
  })

  it('label と error をエスケープする', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', name: 'a', error: '"y"' })).toBe(
      '<rd-text-field error="&quot;y&quot;"><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + '<input id="a" name="a"></rd-text-field>',
    )
  })
})
