import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdCommand } from './command.element.js'
// rd-command を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './command.define.js'

const FIXTURE =
  '<rd-command><label for="a">ラベル</label><input id="a" type="search">'
  + '<ul><li><a href="/">ホーム</a></li></ul></rd-command>'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/command/command.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdCommand, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: この部品の振る舞いをテストから書く（red → green）')
