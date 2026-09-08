import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  markup as dataTableMarkup,
  dataTableRowMarkup,
} from './data-table.contract.js'
import { RdDataTable } from './data-table.element.js'
// rd-data-table を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './data-table.define.js'

const FIXTURE = dataTableMarkup({
  caption: '保存したコード',
  head: dataTableHeadMarkup([{ label: '名前', sort: 'text' }]),
  body: dataTableBodyMarkup([dataTableRowMarkup([{ text: 'a.png' }])]),
})

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/data-table/data-table.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdDataTable, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: この部品の振る舞いをテストから書く（red → green）')
