import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdToggle } from './toggle.element.js'
// rd-toggle を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './toggle.define.js'

const TOGGLE = '<rd-toggle><button type="button" aria-pressed="false">一覧</button></rd-toggle>'

/** 読み上げが `role` を含むまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (role: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(role) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(role, remaining - 1)
}

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('button として名前と「押されていない」が読まれる', async () => {
  const el = await fixtureOf(RdToggle, TOGGLE)
  await virtual.start({ container: el })
  const spoken = await advanceTo('button', 6)
  expect(spoken).toContain('一覧')
  expect(spoken).toContain('not pressed')
})

it('押すと「押されている」に変わる', async () => {
  const el = await fixtureOf(RdToggle, TOGGLE)
  el.pressed = true
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = await advanceTo('button', 6)
  expect(spoken).toContain('一覧')
  expect(spoken).toContain('pressed')
  expect(spoken).not.toContain('not pressed')
})
