import { describe, expect, it } from 'vitest'
import { contract, markup } from './meter.contract.js'

describe('contract', () => {
  it('control は <meter> か <progress>、label は必須（brand.md §7.5）', () => {
    expect(contract.pe).toBe('A')
    expect(contract.roles['control']).toBe(':scope > meter, :scope > progress')
    expect(contract.roles['label']).toBe(':scope > label')
    expect([...contract.required].toSorted()).toEqual(['control', 'label'])
  })
})

describe('markup', () => {
  it('<label for> とネイティブ <meter> を包んだ HTML を返す', () => {
    expect(
      markup({
        id: 'disk',
        label: 'ディスク使用量',
        value: '3.2',
        max: '10',
        text: '3.2 GB / 10 GB',
      }),
    ).toBe(
      '<rd-meter><label for="disk">ディスク使用量</label>'
        + '<meter id="disk" value="3.2" max="10">3.2 GB / 10 GB</meter></rd-meter>',
    )
  })

  it('min と tone は指定したときだけ出る', () => {
    expect(
      markup({
        id: 'a',
        label: '達成率',
        value: '7',
        min: '5',
        max: '9',
        text: '70%',
        tone: 'success',
      }),
    ).toBe(
      '<rd-meter tone="success"><label for="a">達成率</label>'
        + '<meter id="a" value="7" max="9" min="5">70%</meter></rd-meter>',
    )
  })

  it('label と text をエスケープする', () => {
    expect(markup({ id: 'a', label: '<b>x</b>', value: '1', max: '2', text: '<i>y</i>' })).toBe(
      '<rd-meter><label for="a">&lt;b&gt;x&lt;/b&gt;</label>'
        + '<meter id="a" value="1" max="2">&lt;i&gt;y&lt;/i&gt;</meter></rd-meter>',
    )
  })
})
