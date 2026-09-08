import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { commandGroupMarkup, commandItemMarkup, markup } from './command.contract.js'
// rd-command を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './command.define.js'
import { RdCommand } from './command.element.js'

const FIXTURE = markup({
  id: 'palette',
  label: 'コマンド',
  groups:
    commandGroupMarkup({
      label: 'ページ',
      items: commandItemMarkup({ label: 'ホーム', href: '#home' }),
    })
    + commandGroupMarkup({
      label: '操作',
      items: commandItemMarkup({ label: '新しいノート', value: 'new' }),
    }),
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

const readAll = async (el: RdCommand, steps: number): Promise<string> => {
  await virtual.start({ container: el })
  return (await spokenAll(steps)).join('\n')
}

const type = async (el: RdCommand, value: string): Promise<void> => {
  const control = el.querySelector('input')
  if (control !== null) {
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await el.updateComplete
}

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('入力欄は searchbox、グループは名前付きの list、項目はリンクとボタンとして読まれる', async () => {
  const el = await fixtureOf(RdCommand, FIXTURE)
  const spoken = await readAll(el, 12)
  expect(spoken).toContain('コマンド')
  expect(spoken).toContain('searchbox')
  expect(spoken).toContain('ページ')
  expect(spoken).toContain('link')
  expect(spoken).toContain('button')
  expect(spoken).toContain('新しいノート')
})

it('絞ったあとの隠れた項目とグループは読まれない', async () => {
  const el = await fixtureOf(RdCommand, FIXTURE)
  await type(el, 'ノート')
  const spoken = await readAll(el, 10)
  expect(spoken).toContain('新しいノート')
  expect(spoken).not.toContain('ホーム')
  expect(spoken).not.toContain('ページ')
})

it('0 件のときだけ status として文言が読まれる', async () => {
  const el = await fixtureOf(RdCommand, FIXTURE)
  await type(el, 'みつからない')
  const spoken = await readAll(el, 10)
  expect(spoken).toContain('status')
  expect(spoken).toContain('見つかりません')
})
