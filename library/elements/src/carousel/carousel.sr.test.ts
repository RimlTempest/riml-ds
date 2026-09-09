import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { itemMarkup, markup } from './carousel.contract.js'
// rd-carousel を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './carousel.define.js'
import { RdCarousel } from './carousel.element.js'

const FIXTURE = markup({
  label: 'おすすめ',
  children: Array.from({ length: 3 }, (_, index) =>
    itemMarkup({ children: `<p>${index + 1} 枚目</p>` }),
  ).join(''),
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

beforeAll(() => {
  // ボタンの文言は最も近い `[lang]` で決まる（`_shared/lang.ts`）
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

const controlsOf = (el: RdCarousel): HTMLElement => {
  const controls = el.querySelector("[part='controls']")
  if (!(controls instanceof HTMLElement)) {
    throw new Error("[part='controls'] が無い")
  }
  return controls
}

/**
 * 枚は `<ul>` の子である以上 `listitem` のままでなければならない（axe `list`）。
 * `aria-roledescription` はその**言い換え**なので、仮想 SR は役割名を「slide」に差し替えて読み、
 * リストとしての位置（`position n, set size N`）はそのまま残る——これが `role` を書かない理由。
 */
it('枚は list の項目として「slide, n / N」と位置つきで読まれる', async () => {
  const el = await fixtureOf(RdCarousel, FIXTURE)
  await virtual.start({ container: el })
  const spoken = (await spokenAll(8)).join('\n')
  expect(spoken).toContain('list')
  expect(spoken).toContain('slide, 1 / 3')
  expect(spoken).toContain('position 1, set size 3')
  expect(spoken).toContain('1 枚目')
})

it('前へ／次へは名前を持つボタン、「n / N」は status として読まれる', async () => {
  const el = await fixtureOf(RdCarousel, FIXTURE)
  await virtual.start({ container: controlsOf(el) })
  const spoken = (await spokenAll(8)).join('\n')
  expect(spoken).toContain('button')
  expect(spoken).toContain('前へ')
  expect(spoken).toContain('次へ')
  // 先頭では「前へ」が `aria-disabled`（フォーカスは受け取れるまま）
  expect(spoken).toContain('disabled')
  expect(spoken).toContain('status')
  expect(spoken).toContain('1 / 3')
})
