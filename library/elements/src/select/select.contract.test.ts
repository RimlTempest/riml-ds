import { describe, expect, it } from 'vitest'
import { markup } from './select.contract.js'

const OPTIONS = '<option value="jp">日本</option><option value="us">アメリカ</option>'

describe('markup', () => {
  it('<label for> と <select id> を対にし、options をそのまま入れる', () => {
    expect(markup({ id: 'country', label: '国', name: 'country', children: OPTIONS })).toBe(
      '<rd-select><label for="country">国</label>'
        + `<select id="country" name="country">${OPTIONS}</select></rd-select>`,
    )
  })

  it('hint / error / required / defaultValue は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'country',
        label: '国',
        name: 'country',
        children: OPTIONS,
        required: true,
        defaultValue: 'us',
        hint: '請求先の国を選んでください',
      }),
    ).toBe(
      '<rd-select hint="請求先の国を選んでください" value="us">'
        + '<label for="country">国</label>'
        + `<select id="country" name="country" required>${OPTIONS}</select></rd-select>`,
    )
  })

  it('label と error はエスケープし、children（options）はエスケープしない', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', name: 'a', children: OPTIONS, error: '"y"' })).toBe(
      '<rd-select error="&quot;y&quot;"><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + `<select id="a" name="a">${OPTIONS}</select></rd-select>`,
    )
  })
})
