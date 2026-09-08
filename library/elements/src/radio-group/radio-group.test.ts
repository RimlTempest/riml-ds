import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdRadioGroup } from './radio-group.element.js'
// rd-radio-group を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './radio-group.define.js'

const FIXTURE =
  '<rd-radio-group><label for="a">ラベル</label><input id="a" name="a"></rd-radio-group>'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/radio-group/radio-group.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdRadioGroup, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: この部品の振る舞いをテストから書く（red → green）')
