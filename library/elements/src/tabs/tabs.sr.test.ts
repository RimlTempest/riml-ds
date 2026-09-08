import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { markup, panelMarkup, tabMarkup } from './tabs.contract.js'
import { RdTabs } from './tabs.element.js'
// rd-tabs を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './tabs.define.js'

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

/** 読み上げに現れた語をぜんぶ集める（仮想 SR の移動は逐次なので再帰で書く） */
const spokenAll = async (
  steps: number,
  seen: readonly string[] = [],
): Promise<readonly string[]> => {
  const spoken = [...seen, await virtual.lastSpokenPhrase()]
  if (steps <= 1) {
    return spoken
  }
  await virtual.next()
  return spokenAll(steps - 1, spoken)
}

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('タブの列と各タブが tablist / tab として読まれる', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(8)).join('\n')
  expect(spoken).toContain('tablist')
  expect(spoken).toContain('設定')
  expect(spoken).toContain('tab')
  expect(spoken).toContain('概要')
})

it('選択中のタブは selected として、開いているパネルは tabpanel として読まれる', async () => {
  const el = await fixtureOf(RdTabs, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(12)).join('\n')
  expect(spoken).toContain('selected')
  expect(spoken).toContain('tabpanel')
  // 閉じているパネルは hidden なので読まれない
  expect(spoken).not.toContain('使い方の本文。')
})
