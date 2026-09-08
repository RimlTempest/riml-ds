import { describe, expect, it } from 'vitest'
import {
  contract,
  ITEM_SELECTOR,
  markup,
  menuItemMarkup,
  menuTriggerMarkup,
} from './menu.contract.js'

const ITEMS =
  menuItemMarkup({ label: '複製', href: '/duplicate' })
  + menuItemMarkup({ label: '削除', separated: true })

describe('menuItemMarkup', () => {
  it('href があればリンクの項目（JS 無しでもそのまま辿れる）。<li> では包まない', () => {
    expect(menuItemMarkup({ label: '複製', href: '/duplicate' })).toBe(
      '<a href="/duplicate">複製</a>',
    )
  })

  it('href が無ければボタンの項目', () => {
    expect(menuItemMarkup({ label: '削除' })).toBe('<button type="button">削除</button>')
  })

  it('押せない項目は <span> + aria-disabled（ネイティブの disabled と矛盾させない）', () => {
    expect(menuItemMarkup({ label: '削除', disabled: true })).toBe(
      '<span aria-disabled="true">削除</span>',
    )
  })

  it('文言はエスケープする', () => {
    expect(menuItemMarkup({ label: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})

describe('menuItemMarkup（区切り）', () => {
  it('区切りは項目に付く印。**要素を挟まない**（role="menu" は menuitem 系しか持てない）', () => {
    expect(menuItemMarkup({ label: '削除', separated: true })).toBe(
      '<button data-separated="" type="button">削除</button>',
    )
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

  it('トリガーは slot="trigger"、項目は [popover] の直下', () => {
    expect(markup({ id: 'm', label: '操作', items: menuItemMarkup({ label: '削除' }) })).toBe(
      '<rd-menu label="操作">'
        + '<rd-button slot="trigger"><button type="button" popovertarget="m">操作</button></rd-button>'
        + '<div popover="" id="m"><button type="button">削除</button></div>'
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
    expect(ITEM_SELECTOR).toContain('[popover] >')
  })
})
