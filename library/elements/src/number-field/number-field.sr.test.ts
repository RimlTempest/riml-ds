import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdNumberField } from './number-field.element.js'
// rd-number-field を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './number-field.define.js'

const FIELD =
  '<rd-number-field><label for="copies">数量</label>'
  + '<input type="number" id="copies" name="copies" min="0" max="99" value="1"></rd-number-field>'

/** 仮想 SR の移動は本質的に逐次なので再帰で書く（slider.sr.test.ts と同じ形） */
const advance = async (steps: number): Promise<void> => {
  if (steps === 0) {
    return
  }
  await virtual.next()
  return advance(steps - 1)
}

const indexOfPhrase = (log: readonly string[], text: string): number =>
  log.findIndex((phrase) => phrase.includes(text))

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('spinbutton の後に「減らす」「増やす」のボタンが読まれる', async () => {
  const el = await fixtureOf(RdNumberField, FIELD)
  await virtual.start({ container: el })
  await advance(8)
  const log = await virtual.spokenPhraseLog()
  const spinbutton = indexOfPhrase(log, 'spinbutton')
  expect(spinbutton).toBeGreaterThanOrEqual(0)
  expect(log.join('\n')).toContain('数量')
  // Tab 順には居ないが、アクセシビリティツリーには入力欄の後ろに並ぶ
  expect(indexOfPhrase(log, '減らす')).toBeGreaterThan(spinbutton)
  expect(indexOfPhrase(log, '増やす')).toBeGreaterThan(indexOfPhrase(log, '減らす'))
})

it('刻みの枕そのものは読み上げに出ない（名前の無い <span>）', async () => {
  const el = await fixtureOf(RdNumberField, FIELD)
  await virtual.start({ container: el })
  await advance(8)
  const log = await virtual.spokenPhraseLog()
  expect(log.join('\n')).not.toContain('stepper')
})
