import { describe, expect, it } from 'vitest'
import {
  computeTabsView,
  initialIndex,
  panelAttributes,
  type TabView,
  tabAttributes,
} from './tabs.logic.js'

/** 配列の要素が必ず在ることを型に伝える（無ければテストの前提が壊れている） */
const never = (): TabView => {
  throw new Error('タブが要る')
}

const HREFS = ['#overview', '#usage', '#faq']

describe('initialIndex', () => {
  it('location.hash に一致するタブを選ぶ', () => {
    expect(initialIndex({ hrefs: HREFS, hash: '#usage', selected: '#faq' })).toBe(1)
  })

  it('hash が一致しなければ selected 属性を見る', () => {
    expect(initialIndex({ hrefs: HREFS, hash: '#other', selected: '#faq' })).toBe(2)
    expect(initialIndex({ hrefs: HREFS, hash: '', selected: 'faq' })).toBe(2)
  })

  it('どちらも一致しなければ先頭', () => {
    expect(initialIndex({ hrefs: HREFS, hash: '', selected: '' })).toBe(0)
    expect(initialIndex({ hrefs: [], hash: '#usage', selected: '' })).toBe(0)
  })
})

describe('computeTabsView', () => {
  const base = {
    hrefs: HREFS,
    ids: ['', '', ''],
    index: 1,
    label: '設定',
    orientation: 'horizontal',
    malformed: false,
  } as const

  it('選択中のタブだけ aria-selected と tabindex 0 を持つ（roving tabindex）', () => {
    const view = computeTabsView(base)
    expect(view.tabs.map((tab) => tab.selected)).toEqual([false, true, false])
    expect(view.tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1])
  })

  it('id が無いタブにはパネルの id から名前を振る（2 つ並べても衝突しない）', () => {
    const view = computeTabsView({ ...base, ids: ['', 'mine', ''] })
    expect(view.tabs.map((tab) => tab.id)).toEqual(['rd-tab-overview', 'mine', 'rd-tab-faq'])
    expect(view.tabs.map((tab) => tab.panelId)).toEqual(['overview', 'usage', 'faq'])
  })

  it('label が空なら unlabeled（利用側に console.error で知らせる）', () => {
    expect([...computeTabsView({ ...base, label: '' }).states]).toEqual(['unlabeled'])
    expect([...computeTabsView(base).states]).toEqual([])
  })

  it('縦並びは vertical、契約に合わなければ malformed', () => {
    expect([...computeTabsView({ ...base, orientation: 'vertical' }).states]).toEqual(['vertical'])
    expect([...computeTabsView({ ...base, malformed: true }).states]).toEqual(['malformed'])
  })

  it('variant は :state() に出ない（見た目は [variant] 属性で当てる）', () => {
    expect([...computeTabsView(base).states]).toEqual([])
  })

  it('index が範囲外でも 1 つだけ選ばれる', () => {
    const view = computeTabsView({ ...base, index: 9 })
    expect(view.tabs.filter((tab) => tab.selected)).toHaveLength(1)
    expect(view.tabs[0]?.selected).toBe(true)
  })
})

describe('tabAttributes / panelAttributes', () => {
  const view = computeTabsView({
    hrefs: HREFS,
    ids: [],
    index: 0,
    label: '設定',
    orientation: 'horizontal',
    malformed: false,
  })

  it('タブは role=tab と aria-controls / aria-selected / tabindex を持つ', () => {
    expect(tabAttributes(view.tabs[0] ?? never())).toEqual({
      role: 'tab',
      id: 'rd-tab-overview',
      'aria-controls': 'overview',
      'aria-selected': 'true',
      tabindex: '0',
    })
    expect(tabAttributes(view.tabs[1] ?? never())['aria-selected']).toBe('false')
    expect(tabAttributes(view.tabs[1] ?? never())['tabindex']).toBe('-1')
  })

  it('パネルは role=tabpanel とタブへの aria-labelledby を持つ', () => {
    expect(panelAttributes(view.tabs[0] ?? never())).toEqual({
      role: 'tabpanel',
      'aria-labelledby': 'rd-tab-overview',
      tabindex: '0',
    })
  })
})
