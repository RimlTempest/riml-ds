import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './slider.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  it('<label for> と <input type="range"> と <output for> を返す', () => {
    expect(markup({ id: 'volume', label: '音量', name: 'volume', defaultValue: '3' })).toBe(
      '<rd-slider><label for="volume">音量</label>'
        + '<input type="range" id="volume" name="volume" value="3">'
        + '<output for="volume">3</output></rd-slider>',
    )
  })

  it('min / max / step / list / orientation / hint / error が通る', () => {
    expect(
      markup({
        id: 'volume',
        label: '音量',
        name: 'volume',
        defaultValue: '3',
        min: '0',
        max: '10',
        step: '1',
        list: 'volume-ticks',
        orientation: 'vertical',
        hint: '0 から 10 まで',
      }),
    ).toBe(
      '<rd-slider orientation="vertical" hint="0 から 10 まで"><label for="volume">音量</label>'
        + '<input type="range" id="volume" name="volume" value="3" min="0" max="10" step="1"'
        + ' list="volume-ticks">'
        + '<output for="volume">3</output></rd-slider>',
    )
  })

  it('label と error をエスケープする', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', name: 'a', defaultValue: '1', error: '"y"' })).toBe(
      '<rd-slider error="&quot;y&quot;"><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + '<input type="range" id="a" name="a" value="1"><output for="a">1</output></rd-slider>',
    )
  })
})

describe('contract', () => {
  it('label と control が必須で、output は任意', () => {
    expect(contract.required).toEqual(['label', 'control'])
    expect(
      checkContract(
        hostWith([contract.roles['label'] ?? '', contract.roles['control'] ?? '']),
        contract,
      ).kind,
    ).toBe('ok')
  })

  it('<input type="range"> が無ければ missing になる', () => {
    expect(checkContract(hostWith([contract.roles['label'] ?? '']), contract)).toEqual({
      kind: 'missing',
      roles: ['control'],
    })
  })
})
