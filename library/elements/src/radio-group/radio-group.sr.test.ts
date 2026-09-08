import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdRadioGroup } from './radio-group.element.js'
// rd-radio-group を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './radio-group.define.js'

const GROUP =
  '<rd-radio-group hint="あとで変更できます"><fieldset><legend>プラン</legend>'
  + '<div part="options">'
  + '<label><input type="radio" id="plan-free" name="plan" value="free" required>無料</label>'
  + '<label><input type="radio" id="plan-pro" name="plan" value="pro">有料</label>'
  + '<label><input type="radio" id="plan-team" name="plan" value="team">チーム</label>'
  + '</div></fieldset></rd-radio-group>'

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
  const el = await fixtureOf(RdRadioGroup, GROUP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('group', 8)
  expect(spoken).toContain('プラン')
})

it('選択肢は radio として何番目かとともに読まれ、hint も一緒に読まれる', async () => {
  const el = await fixtureOf(RdRadioGroup, GROUP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('radio', 8)
  expect(spoken).toContain('無料')
  expect(spoken).toContain('1')
  expect(spoken).toContain('3')
  // hint は各 radio の aria-describedby で結ぶので、選択肢と一緒に読まれる
  expect(spoken).toContain('あとで変更できます')
})
