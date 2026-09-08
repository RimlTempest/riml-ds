import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { markup } from './popover.contract.js'
// rd-popover を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './popover.define.js'
import { RdPopover } from './popover.element.js'

const FIXTURE = markup({
  id: 'filters',
  label: '絞り込み',
  children: '<p>条件を選ぶ。</p>',
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

it('開いた重ね物は dialog として、見出しが名前として読まれる', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  const panel = el.querySelector('[popover]')
  if (panel instanceof HTMLElement) {
    panel.showPopover()
  }
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = (await spokenAll(10)).join('\n')
  expect(spoken).toContain('dialog')
  expect(spoken).toContain('絞り込み')
  expect(spoken).toContain('条件を選ぶ。')
})
