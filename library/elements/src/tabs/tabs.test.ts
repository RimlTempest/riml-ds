import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdTabs } from './tabs.element.js'
// rd-tabs を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './tabs.define.js'
import { markup, panelMarkup, tabMarkup } from './tabs.contract.js'

const FIXTURE = markup({
  label: '設定',
  tabs:
    tabMarkup({ href: '#overview', label: '概要' })
    + tabMarkup({ href: '#usage', label: '使い方' })
    + tabMarkup({ href: '#faq', label: 'よくある質問' }),
  panels:
    panelMarkup({ id: 'overview', children: '<p>概要の本文。</p>' })
    + panelMarkup({ id: 'usage', children: '<p>使い方の本文。</p>' })
    + panelMarkup({ id: 'faq', children: '<p>質問の本文。</p>' }),
})

const tabsOf = (el: RdTabs): readonly HTMLAnchorElement[] =>
  [...el.querySelectorAll('a')].filter((node) => node instanceof HTMLAnchorElement)

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/tabs/tabs.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

it('列は tablist、リンクは tab、パネルは tabpanel として公開される', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const list = el.querySelector('[slot=tabs]')
  expect(list?.getAttribute('role')).toBe('tablist')
  expect(list?.getAttribute('aria-label')).toBe('設定')
  const tabs = tabsOf(el)
  expect(tabs.map((tab) => tab.getAttribute('role'))).toEqual(['tab', 'tab', 'tab'])
  expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
  expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1])
  expect(tabs[0]?.getAttribute('aria-controls')).toBe('overview')
  const panel = el.querySelector('#overview')
  expect(panel?.getAttribute('role')).toBe('tabpanel')
  expect(panel?.getAttribute('aria-labelledby')).toBe(tabs[0]?.id)
  expect(el.querySelector('#usage')?.hasAttribute('hidden')).toBe(true)
})

it('利用側が <ul><li> を選んだら <li> を presentation にする（リストとして読み上げない）', async () => {
  const el = await fixtureOf(
    RdTabs,
    '<rd-tabs label="設定"><ul slot="tabs">'
      + '<li><a href="#a">A</a></li><li><a href="#b">B</a></li></ul>'
      + '<div id="a"></div><div id="b"></div></rd-tabs>',
  )
  const items = [...el.querySelectorAll('li')].map((item) => item.getAttribute('role'))
  expect(items).toEqual(['presentation', 'presentation'])
  expect(el.querySelector('[slot=tabs]')?.getAttribute('role')).toBe('tablist')
})

it('既定の木（<div slot="tabs">）では tablist が tab を直接持つ', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const list = el.querySelector('[slot=tabs]')
  expect(list?.tagName).toBe('DIV')
  expect([...(list?.children ?? [])].map((child) => child.getAttribute('role'))).toEqual([
    'tab',
    'tab',
    'tab',
  ])
})

it('→ で次のタブへ移り、パネルも切り替わる（自動活性化）', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const tabs = tabsOf(el)
  tabs[0]?.focus()
  tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  await el.updateComplete
  expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
  expect(document.activeElement).toBe(tabs[1])
  expect(el.querySelector('#usage')?.hasAttribute('hidden')).toBe(false)
  expect(el.querySelector('#overview')?.hasAttribute('hidden')).toBe(true)
})

it('End で末尾、Home で先頭へ。↓ は横並びでは効かない', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const tabs = tabsOf(el)
  tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  await el.updateComplete
  expect(tabs[2]?.getAttribute('aria-selected')).toBe('true')
  tabs[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  await el.updateComplete
  expect(tabs[2]?.getAttribute('aria-selected')).toBe('true')
  tabs[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  await el.updateComplete
  expect(tabs[0]?.getAttribute('aria-selected')).toBe('true')
})

it('orientation=vertical では ↓ で動き、→ は効かない', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  el.orientation = 'vertical'
  await el.updateComplete
  const tabs = tabsOf(el)
  tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  await el.updateComplete
  expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
  expect(el.matches(':state(vertical)')).toBe(true)
})

it('click では URL の hash を汚さない', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const before = location.hash
  tabsOf(el)[1]?.click()
  await el.updateComplete
  expect(location.hash).toBe(before)
  expect(tabsOf(el)[1]?.getAttribute('aria-selected')).toBe('true')
})

it('切り替えのたびに rd-change が出る', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', listener)
  tabsOf(el)[2]?.click()
  await el.updateComplete
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 'faq' } }))
})

it('selected 属性のタブから開く（location.hash が無いとき）', async () => {
  const el = await fixtureOf(
    RdTabs,
    markup({
      label: '設定',
      tabs: tabMarkup({ href: '#a', label: 'A' }) + tabMarkup({ href: '#b', label: 'B' }),
      panels: panelMarkup({ id: 'a', children: '' }) + panelMarkup({ id: 'b', children: '' }),
      selected: '#b',
    }),
  )
  expect(tabsOf(el).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true'])
})

it('variant は属性で出す（:state() には出さない）', async () => {
  const el = await fixtureOf(
    RdTabs,
    markup({
      label: '設定',
      tabs: tabMarkup({ href: '#a', label: 'A' }),
      panels: panelMarkup({ id: 'a', children: '' }),
      variant: 'browser',
    }),
  )
  expect(el.getAttribute('variant')).toBe('browser')
  expect(el.matches(':state(browser)')).toBe(false)
})

it('label が無いと unlabeled と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdTabs,
    markup({
      tabs: tabMarkup({ href: '#a', label: 'A' }),
      panels: panelMarkup({ id: 'a', children: '' }),
    }),
  )
  expect(el.matches(':state(unlabeled)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('タブが 1 つも無ければ malformed と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdTabs, '<rd-tabs label="空"><ul slot="tabs"></ul></rd-tabs>')
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('タブの当たり判定が 44px 以上ある', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  const rect = tabsOf(el)[0]?.getBoundingClientRect()
  expect(rect?.height).toBeGreaterThanOrEqual(44)
})
