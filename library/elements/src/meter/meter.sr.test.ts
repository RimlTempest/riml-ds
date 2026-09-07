import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdMeter } from './meter.element.js'
// rd-meter を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './meter.define.js'

const METER =
  '<rd-meter><label for="m">ディスク使用量</label>'
  + '<meter id="m" value="3.2" max="10">3.2 GB / 10 GB</meter></rd-meter>'

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

it('<label for> で名前が付き、meter として読まれる', async () => {
  const el = await fixtureOf(RdMeter, METER)
  await virtual.start({ container: el })
  await advanceTo('meter', 8)
  const log = (await virtual.spokenPhraseLog()).join(' / ')
  expect(log).toContain('ディスク使用量')
  expect(log).toContain('meter')
})
