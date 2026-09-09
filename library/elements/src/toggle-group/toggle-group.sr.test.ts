import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdToggleGroup } from './toggle-group.element.js'
// rd-toggle-group を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './toggle-group.define.js'

const GROUP =
  '<rd-toggle-group><fieldset><legend>書式</legend><div part="options">'
  + '<button type="button" value="bold" aria-pressed="true">太字</button>'
  + '<button type="button" value="italic" aria-pressed="false">斜体</button>'
  + '</div></fieldset></rd-toggle-group>'

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

it('legend が group の名前として読まれる（部品自身に role は付けない）', async () => {
  const el = await fixtureOf(RdToggleGroup, GROUP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('group', 8)
  expect(spoken).toContain('書式')
})

it('group のあとに押下ボタンが「押されている」ものとして読まれる', async () => {
  const el = await fixtureOf(RdToggleGroup, GROUP)
  await virtual.start({ container: el })
  await advanceTo('group', 8)
  const spoken = await advanceTo('button', 8)
  expect(spoken).toContain('太字')
  expect(spoken).toContain('pressed')
  expect(spoken).not.toContain('not pressed')
})

it('押されていないボタンは「押されていない」と読まれる', async () => {
  const el = await fixtureOf(RdToggleGroup, GROUP)
  await virtual.start({ container: el })
  await advanceTo('button', 8)
  await virtual.next()
  const spoken = await advanceTo('button', 8)
  expect(spoken).toContain('斜体')
  expect(spoken).toContain('not pressed')
})
