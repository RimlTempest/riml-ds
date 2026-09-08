import { describe, expect, it } from 'vitest'
import { contract, markup, panelMarkup, tabMarkup } from './tabs.contract.js'

const TABS =
  tabMarkup({ href: '#overview', label: '概要' }) + tabMarkup({ href: 'usage', label: '使い方' })
const PANELS =
  panelMarkup({ id: 'overview', children: '<p>概要の本文。</p>' })
  + panelMarkup({ id: 'usage', children: '<p>使い方の本文。</p>' })

describe('tabMarkup', () => {
  it('<li> に包んだページ内リンクを返す（JS 無しでもリンクとして動く）', () => {
    expect(tabMarkup({ href: '#overview', label: '概要' })).toBe(
      '<li><a href="#overview">概要</a></li>',
    )
  })

  it('# を省いた id でも断片リンクにする', () => {
    expect(tabMarkup({ href: 'usage', label: '使い方' })).toBe(
      '<li><a href="#usage">使い方</a></li>',
    )
  })

  it('文言はエスケープする', () => {
    expect(tabMarkup({ href: '#a', label: '<b>x</b>' })).toBe(
      '<li><a href="#a">&lt;b&gt;x&lt;/b&gt;</a></li>',
    )
  })
})

describe('panelMarkup', () => {
  it('id を持つ <section> を返す（href の飛び先）', () => {
    expect(panelMarkup({ id: 'overview', children: '<p>本文</p>' })).toBe(
      '<section id="overview"><p>本文</p></section>',
    )
  })
})

describe('markup', () => {
  it('タブの列（slot="tabs"）とパネルを並べた木を返す', () => {
    expect(markup({ label: '設定', tabs: TABS, panels: PANELS })).toBe(
      '<rd-tabs label="設定"><ul slot="tabs">'
        + '<li><a href="#overview">概要</a></li><li><a href="#usage">使い方</a></li>'
        + '</ul><section id="overview"><p>概要の本文。</p></section>'
        + '<section id="usage"><p>使い方の本文。</p></section></rd-tabs>',
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
