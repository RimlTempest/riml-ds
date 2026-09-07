import { describe, expect, it } from 'vitest'
import { markup } from './checkbox.contract.js'

describe('markup', () => {
  it('<label> が <input type="checkbox"> と文言を包む形を返す', () => {
    expect(markup({ id: 'terms', label: '規約に同意する', name: 'terms' })).toBe(
      '<rd-checkbox><label>'
        + '<input type="checkbox" id="terms" name="terms">規約に同意する</label></rd-checkbox>',
    )
  })

  it('switch / hint / error / required / defaultChecked は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'mail',
        label: 'お知らせを受け取る',
        name: 'mail',
        asSwitch: true,
        defaultChecked: true,
        required: true,
        defaultValue: 'yes',
        hint: 'いつでも解除できます',
      }),
    ).toBe(
      '<rd-checkbox switch hint="いつでも解除できます"><label>'
        + '<input type="checkbox" id="mail" name="mail" value="yes" checked required>'
        + 'お知らせを受け取る</label></rd-checkbox>',
    )
  })

  it('label と error をエスケープする', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', name: 'a', error: '"y"' })).toBe(
      '<rd-checkbox error="&quot;y&quot;"><label>'
        + '<input type="checkbox" id="a" name="a">&lt;b&gt;x&lt;/b&gt;</label></rd-checkbox>',
    )
  })
})
