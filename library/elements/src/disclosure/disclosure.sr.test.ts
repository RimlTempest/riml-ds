import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdDisclosure } from './disclosure.element.js'
// rd-disclosure を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './disclosure.define.js'

/** phrase が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (phrase: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(phrase) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(phrase, remaining - 1)
}

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('見出しが開閉できるものとして読まれる', async () => {
  const el = await fixtureOf(
    RdDisclosure,
    '<rd-disclosure><details open><summary>送料について</summary>'
      + '<p>全国一律 500 円です。</p></details></rd-disclosure>',
  )
  await virtual.start({ container: el })
  expect(await advanceTo('送料について', 6)).toContain('送料について')
})
