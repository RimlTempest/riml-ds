import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableRowMarkup,
  markup,
} from './data-table.contract.js'
import { RdDataTable } from './data-table.element.js'
// rd-data-table を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './data-table.define.js'

const FIXTURE = markup({
  caption: '保存したコード',
  head: dataTableHeadMarkup([
    { label: '名前', sort: 'text', key: 'name' },
    { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
  ]),
  body: dataTableBodyMarkup([
    dataTableRowMarkup([{ text: 'b.png' }, { text: '1,234', value: '1234', numeric: true }]),
    dataTableRowMarkup([{ text: 'a.png' }, { text: '820', value: '820', numeric: true }]),
  ]),
})

/** 読み上げに現れた語をぜんぶ集める（仮想 SR の移動は逐次なので再帰で書く） */
const spokenAll = async (
  steps: number,
  seen: readonly string[] = [],
): Promise<readonly string[]> => {
  const spoken = [...seen, await virtual.lastSpokenPhrase()]
  if (steps <= 1) {
    return spoken
  }
  await virtual.next()
  return spokenAll(steps - 1, spoken)
}

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('表は caption を名前にして table / columnheader として読まれる', async () => {
  const el = await fixtureOf(RdDataTable, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(10)).join('\n')
  expect(spoken).toContain('table')
  expect(spoken).toContain('保存したコード')
  expect(spoken).toContain('columnheader')
  // 見出しをボタンで包んでも列の名前は変わらない（ボタンの文字＝見出しの文字）
  expect(spoken).toContain('名前')
})

it('並べ替え中の列は aria-sort として読まれる（live region に頼らない。ADR-0008 §6）', async () => {
  const el = await fixtureOf(RdDataTable, FIXTURE)
  const button = el.querySelector('[part="sort"]')
  if (button instanceof HTMLElement) {
    button.click()
  }
  await el.updateComplete
  await virtual.start({ container: el })
  const spoken = (await spokenAll(10)).join('\n')
  expect(spoken).toContain('ascending')
})
