import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { checkboxOptionMarkup, contract, markup } from './checkbox-group.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

const OPTIONS = [
  checkboxOptionMarkup({ id: 'tag-a', name: 'tags', value: 'a', label: '仕事' }),
  checkboxOptionMarkup({ id: 'tag-b', name: 'tags', value: 'b', label: '私用' }),
].join('')

describe('checkboxOptionMarkup', () => {
  it('<label> が <input type="checkbox"> と文言を包む形を返す', () => {
    expect(checkboxOptionMarkup({ id: 'tag-a', name: 'tags', value: 'a', label: '仕事' })).toBe(
      '<label><input type="checkbox" id="tag-a" name="tags" value="a">仕事</label>',
    )
  })

  it('defaultChecked / required / disabled は指定したときだけ出る', () => {
    expect(
      checkboxOptionMarkup({
        id: 'tag-a',
        name: 'tags',
        value: 'a',
        label: '仕事',
        defaultChecked: true,
        required: true,
        disabled: true,
      }),
    ).toBe(
      '<label><input type="checkbox" id="tag-a" name="tags" value="a" checked required disabled>'
        + '仕事</label>',
    )
  })

  it('文言をエスケープする', () => {
    expect(checkboxOptionMarkup({ id: 'a', name: 'a', value: 'a', label: '<b>x</b>' })).toBe(
      '<label><input type="checkbox" id="a" name="a" value="a">&lt;b&gt;x&lt;/b&gt;</label>',
    )
  })
})

describe('markup', () => {
  it('<fieldset> が <legend> と選択肢の入れ物を包む形を返す', () => {
    expect(markup({ label: 'タグ', children: OPTIONS })).toBe(
      '<rd-checkbox-group><fieldset><legend>タグ</legend><div part="options">'
        + '<label><input type="checkbox" id="tag-a" name="tags" value="a">仕事</label>'
        + '<label><input type="checkbox" id="tag-b" name="tags" value="b">私用</label>'
        + '</div></fieldset></rd-checkbox-group>',
    )
  })

  it('segmented / min / hint / error は指定したときだけ属性になる', () => {
    expect(
      markup({
        label: 'タグ',
        children: '',
        segmented: true,
        min: '1',
        hint: 'あとで変更できます',
      }),
    ).toBe(
      '<rd-checkbox-group segmented min="1" hint="あとで変更できます"><fieldset>'
        + '<legend>タグ</legend><div part="options"></div></fieldset></rd-checkbox-group>',
    )
  })

  it('legend と error をエスケープする', () => {
    expect(markup({ label: '<b>x</b>', children: '', error: '"y"' })).toBe(
      '<rd-checkbox-group error="&quot;y&quot;"><fieldset><legend>&lt;b&gt;x&lt;/b&gt;</legend>'
        + '<div part="options"></div></fieldset></rd-checkbox-group>',
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
