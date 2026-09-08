import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdInputOtp } from './input-otp.element.js'
// rd-input-otp を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './input-otp.define.js'

const OTP =
  '<rd-input-otp hint="6 桁の数字"><fieldset><legend>確認コード</legend><div part="cells">'
  + '<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" id="code-1" '
  + 'name="code-1" aria-label="1 桁目" required>'
  + '<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" id="code-2" '
  + 'name="code-2" aria-label="2 桁目" required>'
  + '</div></fieldset></rd-input-otp>'

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
  const el = await fixtureOf(RdInputOtp, OTP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('group', 8)
  expect(spoken).toContain('確認コード')
})

it('桁は textbox として「N 桁目」と読まれ、hint も一緒に読まれる', async () => {
  const el = await fixtureOf(RdInputOtp, OTP)
  await virtual.start({ container: el })
  const spoken = await advanceTo('textbox', 8)
  expect(spoken).toContain('1 桁目')
  expect(spoken).toContain('6 桁の数字')
})
