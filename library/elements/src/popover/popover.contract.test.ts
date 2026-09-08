import { describe, expect, it } from 'vitest'
import { contract, markup, popoverTriggerMarkup } from './popover.contract.js'

describe('popoverTriggerMarkup', () => {
  it('popovertarget が [popover] の id を指す（これだけで JS 無しでも開く）', () => {
    expect(popoverTriggerMarkup({ id: 'filters', label: '絞り込み' })).toBe(
      '<rd-button slot="trigger">'
        + '<button type="button" popovertarget="filters">絞り込み</button></rd-button>',
    )
  })
})

describe('markup', () => {
  it('見出しは [popover] の先頭に置く（アクセシブル名の出どころ）', () => {
    expect(markup({ id: 'filters', label: '絞り込み', children: '<p>条件を選ぶ。</p>' })).toBe(
      '<rd-popover>'
        + '<rd-button slot="trigger">'
        + '<button type="button" popovertarget="filters">絞り込み</button></rd-button>'
        + '<div popover="" id="filters"><h2 slot="label">絞り込み</h2>'
        + '<p>条件を選ぶ。</p></div>'
        + '</rd-popover>',
    )
  })

  it('placement は指定したときだけ属性に出る', () => {
    expect(markup({ id: 'f', label: 'x', children: '', placement: 'end' })).toContain(
      '<rd-popover placement="end">',
    )
  })

  it('本文はエスケープしない（信頼済みの断片）が、見出しはエスケープする', () => {
    const html = markup({ id: 'f', label: '<b>名</b>', children: '<p>そのまま</p>' })
    expect(html).toContain('&lt;b&gt;名&lt;/b&gt;')
    expect(html).toContain('<p>そのまま</p>')
  })
})

describe('contract', () => {
  it('ティア B で、トリガーと [popover] を必須にする', () => {
    expect(contract.pe).toBe('B')
    expect(contract.required).toEqual(['trigger', 'panel'])
  })

  it('見出しは必須にせず、無ければ element が unlabeled で報せる', () => {
    expect(contract.roles['label']).toBe(':scope > [popover] [slot="label"]')
    expect(contract.required).not.toContain('label')
  })
})
