import { describe, expect, it } from 'vitest'
import {
  contract,
  ITEM_SELECTOR,
  markup,
  menuItemMarkup,
  menuSeparatorMarkup,
  menuTriggerMarkup,
} from './menu.contract.js'

const ITEMS =
  menuItemMarkup({ label: '複製', href: '/duplicate' })
  + menuSeparatorMarkup()
  + menuItemMarkup({ label: '削除' })

describe('menuItemMarkup', () => {
  it('href があればリンクの項目（JS 無しでもそのまま辿れる）', () => {
    expect(menuItemMarkup({ label: '複製', href: '/duplicate' })).toBe(
      '<li><a href="/duplicate">複製</a></li>',
    )
  })

  it('href が無ければボタンの項目', () => {
    expect(menuItemMarkup({ label: '削除' })).toBe('<li><button type="button">削除</button></li>')
  })

  it('disabled は aria-disabled で示す（フォーカス可能のまま）', () => {
    expect(menuItemMarkup({ label: '削除', disabled: true })).toBe(
      '<li><button type="button" aria-disabled="true">削除</button></li>',
    )
  })

  it('文言はエスケープする', () => {
    expect(menuItemMarkup({ label: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})

describe('menuSeparatorMarkup', () => {
  it('<hr> を返す（暗黙の role が separator。role 属性を手で書かない）', () => {
    expect(menuSeparatorMarkup()).toBe('<li><hr></li>')
  })
})

describe('menuTriggerMarkup', () => {
  it('popovertarget が [popover] の id を指す（これだけで JS 無しでも開く）', () => {
    expect(menuTriggerMarkup({ id: 'row-actions', label: '操作' })).toBe(
      '<rd-button slot="trigger">'
        + '<button type="button" popovertarget="row-actions">操作</button></rd-button>',
    )
  })
})

describe('markup', () => {
  it('トリガーの popovertarget と [popover] の id が一致する', () => {
    const html = markup({ id: 'row-actions', label: '操作', items: ITEMS })
    expect(html).toContain('popovertarget="row-actions"')
    expect(html).toContain('<div popover="" id="row-actions">')
  })

  it('トリガーは slot="trigger"、項目は [popover] の中の <ul>', () => {
    expect(markup({ id: 'm', label: '操作', items: menuItemMarkup({ label: '削除' }) })).toBe(
      '<rd-menu label="操作">'
        + '<rd-button slot="trigger"><button type="button" popovertarget="m">操作</button></rd-button>'
        + '<div popover="" id="m"><ul><li><button type="button">削除</button></li></ul></div>'
        + '</rd-menu>',
    )
  })

  it('placement は指定したときだけ属性に出る', () => {
    expect(markup({ id: 'm', label: '操作', items: ITEMS, placement: 'end' })).toContain(
      '<rd-menu placement="end" label="操作">',
    )
    expect(markup({ id: 'm', label: '操作', items: ITEMS })).not.toContain('placement=')
  })
})

describe('contract', () => {
  it('ティア B で、トリガーと [popover] を必須にする', () => {
    expect(contract.pe).toBe('B')
    expect(contract.required).toEqual(['trigger', 'list'])
    expect(contract.roles['list']).toBe(':scope > [popover]')
  })

  it('項目のセレクタは roles に入れない（複数一致するので checkContract が扱えない）', () => {
    expect(Object.keys(contract.roles)).toEqual(['trigger', 'list'])
    expect(ITEM_SELECTOR).toContain('[popover]')
  })
})
