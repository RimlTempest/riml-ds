import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdSelect } from './select.element.js'
// rd-select を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './select.define.js'

const OPTIONS = '<option value="">選択してください</option><option value="jp">日本</option>'

/** role が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (role: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(role) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(role, remaining - 1)
}

const spokenAt = async (el: RdSelect, role: string): Promise<string> => {
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

it('combobox としてラベルと hint が読まれる', async () => {
  const el = await fixtureOf(
    RdSelect,
    `<rd-select hint="請求先の国を選んでください"><label for="c">国</label>`
      + `<select id="c" name="c">${OPTIONS}</select></rd-select>`,
  )
  const spoken = await spokenAt(el, 'combobox')
  expect(spoken).toContain('国')
  expect(spoken).toContain('請求先の国を選んでください')
})

it('invalid のときエラー文言が説明として読まれる', async () => {
  const el = await fixtureOf(
    RdSelect,
    `<rd-select><label for="c">国</label>`
      + `<select id="c" name="c" required>${OPTIONS}</select></rd-select>`,
  )
  el.querySelector('select')?.dispatchEvent(new Event('change'))
  await el.updateComplete
  const spoken = await spokenAt(el, 'combobox')
  expect(spoken).toContain('未入力です。入力してください。')
})
