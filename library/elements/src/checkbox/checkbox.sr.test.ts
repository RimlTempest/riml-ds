import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdCheckbox } from './checkbox.element.js'
// rd-checkbox を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './checkbox.define.js'

/** role が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (role: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(role) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(role, remaining - 1)
}

const spokenAt = async (el: RdCheckbox, role: string): Promise<string> => {
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

it('checkbox として包む <label> の文言が読まれる', async () => {
  const el = await fixtureOf(
    RdCheckbox,
    '<rd-checkbox><label><input type="checkbox" id="t" name="t">規約に同意する</label></rd-checkbox>',
  )
  expect(await spokenAt(el, 'checkbox')).toContain('規約に同意する')
})

it('switch 属性のときは switch として読まれる', async () => {
  const el = await fixtureOf(
    RdCheckbox,
    '<rd-checkbox switch><label><input type="checkbox" id="m" name="m">お知らせ</label></rd-checkbox>',
  )
  expect(await spokenAt(el, 'switch')).toContain('お知らせ')
})
