/**
 * `rd-tabs` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * 「どのタブが選ばれているか」と「そのとき各タブ・各パネルに付く属性」だけを決める。
 */
import type { Orientation } from '../_shared/roving-focus.js'

/** `#` の有無を無視して断片を比べる（`selected="usage"` も `selected="#usage"` も同じ） */
const fragment = (value: string): string => (value.startsWith('#') ? value : `#${value}`)

/**
 * 最初に開くタブ。**`location.hash` → `selected` 属性 → 先頭**の順（ディープリンクが最優先）。
 * `rd-tabs` は hash を**読むだけ**で書かない（履歴を汚さない。保守メモ）。
 */
export const initialIndex = (input: {
  readonly hrefs: readonly string[]
  readonly hash: string
  readonly selected: string
}): number => {
  const byHash = input.hash === '' ? -1 : input.hrefs.indexOf(fragment(input.hash))
  if (byHash !== -1) {
    return byHash
  }
  const bySelected = input.selected === '' ? -1 : input.hrefs.indexOf(fragment(input.selected))
  return bySelected === -1 ? 0 : bySelected
}

export type TabView = {
  /** タブ自身の id（`aria-labelledby` の先）。無ければ `rd-tab-<n>` を振る */
  readonly id: string
  /** `aria-controls` の先（パネルの id） */
  readonly panelId: string
  readonly selected: boolean
  /** roving tabindex。選択中だけ 0（Tab キーで列に入る場所を 1 つにする） */
  readonly tabIndex: number
}

export type TabsView = { readonly tabs: readonly TabView[]; readonly states: ReadonlySet<string> }

export type TabsViewInput = {
  /** 各タブの `href`（`#panel`） */
  readonly hrefs: readonly string[]
  /** 各タブに既に付いている id（無ければ空文字） */
  readonly ids: readonly string[]
  readonly index: number
  readonly label: string
  readonly orientation: Orientation
  readonly malformed: boolean
}

/** 範囲外の index は先頭に丸める（タブが減ったときに選択が消えない） */
const clamp = (index: number, count: number): number =>
  Number.isInteger(index) && index >= 0 && index < count ? index : 0

/**
 * `variant` はここに出さない——見た目は `[variant]` 属性で当てる（`:state()` は
 * 「読み上げに出ない振る舞いの状態」だけ。ADR-0008 §3）。
 */
export const computeTabsView = (input: TabsViewInput): TabsView => {
  const selectedIndex = clamp(input.index, input.hrefs.length)
  const tabs = input.hrefs.map((href, index) => {
    const panelId = href.replace(/^#/u, '')
    const own = input.ids[index]
    return {
      // 番号ではなくパネルの id から作る。同じページに rd-tabs を 2 つ置いても衝突しない
      id: own === undefined || own === '' ? `rd-tab-${panelId}` : own,
      panelId,
      selected: index === selectedIndex,
      tabIndex: index === selectedIndex ? 0 : -1,
    }
  })
  const states = [
    input.malformed ? 'malformed' : '',
    input.label === '' ? 'unlabeled' : '',
    input.orientation === 'vertical' ? 'vertical' : '',
  ].filter((state) => state !== '')
  return { tabs, states: new Set(states) }
}

/** タブのリンクに載せる属性。`role="tab"` は `<a>` の暗黙の role を上書きする */
export const tabAttributes = (tab: TabView): Readonly<Record<string, string>> => ({
  role: 'tab',
  id: tab.id,
  'aria-controls': tab.panelId,
  'aria-selected': String(tab.selected),
  tabindex: String(tab.tabIndex),
})

/** パネルに載せる属性。`tabindex="0"` はスクロールする本文にキーボードで入るため（APG） */
export const panelAttributes = (tab: TabView): Readonly<Record<string, string>> => ({
  role: 'tabpanel',
  'aria-labelledby': tab.id,
  tabindex: '0',
})
