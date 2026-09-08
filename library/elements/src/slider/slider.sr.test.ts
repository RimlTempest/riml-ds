import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdSlider } from './slider.element.js'
// rd-slider を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './slider.define.js'

const SLIDER =
  '<rd-slider><label for="volume">音量</label>'
  + '<input type="range" id="volume" name="volume" min="0" max="10" value="3">'
  + '<output for="volume">3</output></rd-slider>'

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

it('slider として、ラベルと現在値が読まれる', async () => {
  const el = await fixtureOf(RdSlider, SLIDER)
  await virtual.start({ container: el })
  const spoken = await advanceTo('slider', 8)
  expect(spoken).toContain('音量')
  expect(spoken).toContain('3')
})

it('部品が足したトラックは読み上げに出ない（aria-hidden）', async () => {
  const el = await fixtureOf(RdSlider, SLIDER)
  await virtual.start({ container: el })
  const all = await virtual.spokenPhraseLog()
  expect(all.join('\n')).not.toContain('track')
})
