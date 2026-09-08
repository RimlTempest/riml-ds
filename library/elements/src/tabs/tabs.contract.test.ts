import { describe, expect, it } from 'vitest'
import { contract, markup, panelMarkup, tabMarkup } from './tabs.contract.js'

const TABS =
  tabMarkup({ href: '#overview', label: '概要' }) + tabMarkup({ href: 'usage', label: '使い方' })
const PANELS =
  panelMarkup({ id: 'overview', children: '<p>概要の本文。</p>' })
  + panelMarkup({ id: 'usage', children: '<p>使い方の本文。</p>' })

describe('tabMarkup', () => {
  it('ページ内リンクを返す（JS 無しでもリンクとして動く）。<li> では包まない', () => {
    expect(tabMarkup({ href: '#overview', label: '概要' })).toBe('<a href="#overview">概要</a>')
  })

  it('# を省いた id でも断片リンクにする', () => {
    expect(tabMarkup({ href: 'usage', label: '使い方' })).toBe('<a href="#usage">使い方</a>')
  })

  it('文言はエスケープする', () => {
    expect(tabMarkup({ href: '#a', label: '<b>x</b>' })).toBe(
      '<a href="#a">&lt;b&gt;x&lt;/b&gt;</a>',
    )
  })
})

describe('panelMarkup', () => {
  it('id を持つ <div> を返す（href の飛び先。tabpanel はランドマークではない）', () => {
    expect(panelMarkup({ id: 'overview', children: '<p>本文</p>' })).toBe(
      '<div id="overview"><p>本文</p></div>',
    )
  })
})

describe('markup', () => {
  it('タブの列（slot="tabs"）とパネルを並べた木を返す', () => {
    expect(markup({ label: '設定', tabs: TABS, panels: PANELS })).toBe(
      '<rd-tabs label="設定"><div slot="tabs">'
        + '<a href="#overview">概要</a><a href="#usage">使い方</a>'
        + '</div><div id="overview"><p>概要の本文。</p></div>'
        + '<div id="usage"><p>使い方の本文。</p></div></rd-tabs>',
    )
  })

  it('variant / orientation / selected は指定したときだけ属性に出る', () => {
    const html = markup({
      label: '設定',
      tabs: TABS,
      panels: PANELS,
      variant: 'browser',
      orientation: 'vertical',
      selected: '#usage',
    })
    expect(
      html.startsWith(
        '<rd-tabs variant="browser" label="設定" orientation="vertical" selected="#usage">',
      ),
    ).toBe(true)
  })

  it('label が無ければ属性ごと省く（element 側が unlabeled にする）', () => {
    expect(markup({ tabs: TABS, panels: '' })).not.toContain('label=')
  })
})

describe('contract', () => {
  it('ティア B で、タブの列とページ内リンクを必須にする', () => {
    expect(contract.pe).toBe('B')
    expect(contract.required).toEqual(['list', 'tabs'])
    expect(contract.roles['tabs']).toContain('a[href^="#"]')
  })
})
