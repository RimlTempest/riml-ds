import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdCombobox } from './combobox.element.js'
// rd-combobox を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './combobox.define.js'

const OPTIONS = '<option value="kana">かな</option><option value="kanji">かんじ</option>'

const field = (attrs = ''): string =>
  `<rd-combobox ${attrs}><label for="reading">読み</label>`
  + `<input id="reading" name="reading" list="reading-list" type="text" autocomplete="off">`
  + `<datalist id="reading-list">${OPTIONS}</datalist></rd-combobox>`

/** 探している語が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (needle: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(needle) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(needle, remaining - 1)
}

const spokenAt = async (el: RdCombobox, needle: string): Promise<string> => {
  await virtual.start({ container: el })
  return advanceTo(needle, 8)
}

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('ラベルと combobox として読まれ、hint が説明として付く', async () => {
  const el = await fixtureOf(RdCombobox, field('hint="候補から選ぶか、そのまま入力できます"'))
  const spoken = await spokenAt(el, 'combobox')
  expect(spoken).toContain('読み')
  expect(spoken).toContain('候補から選ぶか、そのまま入力できます')
})

it('↓ で開いた候補は listbox の option として読める', async () => {
  const el = await fixtureOf(RdCombobox, field())
  el.querySelector('input')?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
  )
  await el.updateComplete
  const spoken = await spokenAt(el, 'option')
  expect(spoken).toContain('かな')
})
