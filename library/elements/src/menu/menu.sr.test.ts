import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { markup, menuItemMarkup } from './menu.contract.js'
// rd-menu を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './menu.define.js'
import { RdMenu } from './menu.element.js'

const FIXTURE = markup({
  id: 'row-actions',
  label: '操作',
  items:
    menuItemMarkup({ label: '複製', href: '#duplicate' })
    + menuItemMarkup({ label: '削除', separated: true }),
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

it('トリガーは「メニューを持つ・閉じている」ことまで読まれる', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(4)).join('\n')
  expect(spoken).toContain('操作')
  expect(spoken).toContain('menu')
})

it('開いたリストは menu、項目は menuitem として読まれる', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  const list = el.querySelector('[popover]')
  if (list instanceof HTMLElement) {
    list.showPopover()
  }
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = (await spokenAll(12)).join('\n')
  expect(spoken).toContain('menu')
  expect(spoken).toContain('menuitem')
  expect(spoken).toContain('複製')
  expect(spoken).toContain('削除')
})
