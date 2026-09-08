import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { markup } from './splitter.contract.js'
// rd-splitter を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './splitter.define.js'
import { RdSplitter } from './splitter.element.js'

const FIXTURE = markup({
  label: 'サイドバーの幅',
  start: '<p>一覧の中身。</p>',
  end: '<p>本文の中身。</p>',
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

/**
 * つまみは shadow にある。仮想 SR は light DOM だけを辿るので、つまみは shadow の中から読む
 * （`window.sr.test.ts` と同じ形。合成木の読み上げは `bun run a11y`（axe）が見る）。
 */
const handleOf = (el: RdSplitter): HTMLElement => {
  const handle = el.shadowRoot?.querySelector('[part=handle]')
  if (!(handle instanceof HTMLElement)) {
    throw new Error('[part=handle] が無い')
  }
  return handle
}

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('つまみは名前と現在値を持つ separator として読まれる', async () => {
  const el = await fixtureOf(RdSplitter, FIXTURE)
  await virtual.start({ container: handleOf(el) })
  const spoken = (await spokenAll(2)).join('\n')
  expect(spoken).toContain('separator')
  expect(spoken).toContain('サイドバーの幅')
  expect(spoken).toContain('50')
})

it('割合が変わると読み上げの現在値も変わる', async () => {
  const el = await fixtureOf(RdSplitter, FIXTURE)
  el.position = 30
  await el.updateComplete
  await virtual.start({ container: handleOf(el) })
  const spoken = (await spokenAll(2)).join('\n')
  expect(spoken).toContain('30')
  expect(spoken).not.toContain('50')
})

it('2 つの面の中身はどちらもそのまま読まれる（つまみは中身を隠さない）', async () => {
  const el = await fixtureOf(RdSplitter, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(8)).join('\n')
  expect(spoken).toContain('一覧の中身。')
  expect(spoken).toContain('本文の中身。')
})
