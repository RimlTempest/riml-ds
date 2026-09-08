import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdCheckboxGroup } from './checkbox-group.element.js'
// rd-checkbox-group を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './checkbox-group.define.js'

const GROUP =
  '<rd-checkbox-group hint="いくつでも選べます"><fieldset><legend>タグ</legend>'
  + '<div part="options">'
  + '<label><input type="checkbox" id="tag-a" name="tags" value="a">仕事</label>'
  + '<label><input type="checkbox" id="tag-b" name="tags" value="b">私用</label>'
  + '</div></fieldset></rd-checkbox-group>'

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

it('legend が group の名前として読まれる', async () => {
  const el = await fixtureOf(RdCheckboxGroup, GROUP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('group', 8)
  expect(spoken).toContain('タグ')
})

it('選択肢は checkbox として読まれ、hint も一緒に読まれる', async () => {
  const el = await fixtureOf(RdCheckboxGroup, GROUP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('checkbox', 8)
  expect(spoken).toContain('仕事')
  expect(spoken).toContain('not checked')
  // hint は各 checkbox の aria-describedby で結ぶので、選択肢と一緒に読まれる
  expect(spoken).toContain('いくつでも選べます')
})
