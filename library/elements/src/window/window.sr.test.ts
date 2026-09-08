import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdWindow } from './window.element.js'
// rd-window を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './window.define.js'

const WINDOW =
  '<rd-window closable expandable collapsible>'
  + '<h2 slot="title">バックアップの設定</h2><p>毎晩 3 時に実行します。</p></rd-window>'

/** 文言は最も近い `[lang]` で決まる（`_shared/lang.ts`）。試験ページの lang に左右されない形で置く */
const japaneseWindow = async (): Promise<RdWindow> => {
  const host = await fixtureOf(HTMLDivElement, `<div lang="ja">${WINDOW}</div>`)
  const el = host.querySelector('rd-window')
  if (!(el instanceof RdWindow)) {
    throw new Error('rd-window が要る')
  }
  await el.updateComplete
  return el
}

/** phrase が読まれるまで順に進む（仮想 SR の移動は本質的に逐次なので再帰で書く） */
const advanceTo = async (phrase: string, remaining: number): Promise<string> => {
  const spoken = await virtual.lastSpokenPhrase()
  if (spoken.includes(phrase) || remaining === 0) {
    return spoken
  }
  await virtual.next()
  return advanceTo(phrase, remaining - 1)
}

/** 読み上げに現れた語をぜんぶ集める（ボタンの名前が見出しに混ざっていないことを見るため）。
    仮想 SR の移動は本質的に逐次なので、`advanceTo` と同じく再帰で書く */
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

it('見出しは h2 のまま読まれる（部品は見出しを作らない）', async () => {
  const el = await japaneseWindow()
  await virtual.start({ container: el })
  expect(await advanceTo('バックアップの設定', 12)).toContain('バックアップの設定')
})

it('本文が読み上げに含まれる', async () => {
  const el = await japaneseWindow()
  await virtual.start({ container: el })
  expect(await advanceTo('毎晩 3 時に実行します。', 12)).toContain('毎晩 3 時に実行します。')
})

/**
 * ボタンは shadow にある。仮想 SR は light DOM だけを辿るので、帯は shadow の中から読む
 * （ブラウザ本体の読み上げは合成木を辿る。そちらは `bun run a11y`（axe）と VRT が見る）。
 */
it('3 つのボタンが「閉じる」「広げる」「たたむ」として読まれる', async () => {
  const el = await japaneseWindow()
  const bar = el.shadowRoot?.querySelector('[part=bar]')
  expect(bar).toBeInstanceOf(HTMLElement)
  if (!(bar instanceof HTMLElement)) {
    return
  }
  await virtual.start({ container: bar })
  const spoken = (await spokenAll(6)).join('\n')
  expect(spoken).toContain('閉じる')
  expect(spoken).toContain('広げる')
  expect(spoken).toContain('たたむ')
  // ボタンの名前は見出しに混ざらない（帯 ⊃ 見出し。ADR-0014 決定 2）
  expect(spoken).not.toContain('バックアップの設定')
})
