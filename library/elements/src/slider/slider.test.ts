import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdSlider } from './slider.element.js'
// rd-slider を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './slider.define.js'

const FIXTURE = '<rd-slider><label for="a">ラベル</label><input id="a" name="a"></rd-slider>'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/slider/slider.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdSlider, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: この部品の振る舞いをテストから書く（red → green）')
