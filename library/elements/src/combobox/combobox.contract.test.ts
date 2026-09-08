import { describe, expect, it } from 'vitest'
import { comboboxOptionMarkup, markup } from './combobox.contract.js'

const OPTIONS = '<option value="kana">かな</option><option value="kanji">漢字</option>'

describe('markup', () => {
  it('<label for> と <input list> と <datalist id> を対にし、options をそのまま入れる', () => {
    expect(
      markup({
        id: 'reading',
        listId: 'reading-list',
        label: '読み',
        name: 'reading',
        children: OPTIONS,
      }),
    ).toBe(
      '<rd-combobox><label for="reading">読み</label>'
        + '<input id="reading" name="reading" list="reading-list" type="text" autocomplete="off">'
        + `<datalist id="reading-list">${OPTIONS}</datalist></rd-combobox>`,
    )
  })

  it('JS が無くても候補が出る形（input[list] と autocomplete="off"）を必ず出す', () => {
    const html = markup({ id: 'a', listId: 'a-list', label: 'A', name: 'a', children: OPTIONS })
    expect(html).toContain('<input id="a" name="a" list="a-list" type="text" autocomplete="off">')
  })

  it('filter / hint / error / required / pattern / defaultValue は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'reading',
        listId: 'reading-list',
        label: '読み',
        name: 'reading',
        children: OPTIONS,
        filter: 'prefix',
        required: true,
        placeholder: 'かな',
        pattern: '[ぁ-ん]+',
        title: 'ひらがな',
        defaultValue: 'かな',
        hint: '候補から選ぶか、そのまま入力できます',
      }),
    ).toBe(
      '<rd-combobox hint="候補から選ぶか、そのまま入力できます" filter="prefix">'
        + '<label for="reading">読み</label>'
        + '<input id="reading" name="reading" list="reading-list" type="text" autocomplete="off"'
        + ' required placeholder="かな" pattern="[ぁ-ん]+" title="ひらがな" value="かな">'
        + `<datalist id="reading-list">${OPTIONS}</datalist></rd-combobox>`,
    )
  })

  it('label と error はエスケープし、children（options）はエスケープしない', () => {
    expect(
      markup({
        id: 'a',
        listId: 'a-list',
        label: '<b>x</b>',
        name: 'a',
        children: OPTIONS,
        error: '"y"',
      }),
    ).toBe(
      '<rd-combobox error="&quot;y&quot;"><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + '<input id="a" name="a" list="a-list" type="text" autocomplete="off">'
        + `<datalist id="a-list">${OPTIONS}</datalist></rd-combobox>`,
    )
  })
})

describe('comboboxOptionMarkup', () => {
  it('value だけなら表示名を持たない <option> を出す', () => {
    expect(comboboxOptionMarkup({ value: 'kana' })).toBe('<option value="kana"></option>')
  })

  it('label があれば表示名にする', () => {
    expect(comboboxOptionMarkup({ value: 'kana', label: 'かな' })).toBe(
      '<option value="kana">かな</option>',
    )
  })

  it('値も表示名もエスケープする', () => {
    expect(comboboxOptionMarkup({ value: '"a"', label: '<b>' })).toBe(
      '<option value="&quot;a&quot;">&lt;b&gt;</option>',
    )
  })
})
