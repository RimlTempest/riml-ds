import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdTextField } from './text-field.element.js'
// rd-text-field を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './text-field.define.js'

/** role が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (role: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(role) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(role, remaining - 1)
}

const spokenAt = async (el: RdTextField, role: string): Promise<string> => {
  await virtual.start({ container: el })
  return advanceTo(role, 6)
}

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('textbox としてラベルと hint が読まれる', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field hint="確認メールを送ります"><label for="e">メール</label>'
      + '<input id="e" name="e" type="email"></rd-text-field>',
  )
  const spoken = await spokenAt(el, 'textbox')
  expect(spoken).toContain('メール')
  expect(spoken).toContain('確認メールを送ります')
})

it('invalid のときエラー文言が説明として読まれる', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field>',
  )
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  const spoken = await spokenAt(el, 'textbox')
  expect(spoken).toContain('未入力です。入力してください。')
})
