import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdLiveRegion } from './live-region.element.js'
// rd-live-region を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './live-region.define.js'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

/**
 * skip の理由（2026-09-07 に実測）：`@guidepup/virtual-screen-reader` 0.32.1 は
 * light DOM のライブリージョンなら読む（`spokenPhraseLog()` に `polite: …` が出る）が、
 * **shadow root の中は観測しない**。`virtual.start({ container: el.shadowRoot })` はログが空になり、
 * `container: document.body` でも shadow 内の変化を拾わない。
 * ティア C の `rd-live-region` は shadow 完結（ADR-0012）なので、この層では固定できない。
 * 読み上げの実確認は `docs/accessibility.md` の手動チェック（VoiceOver / NVDA）に残す。
 */
// oxlint-disable-next-line vitest/no-disabled-tests -- 上のコメントの理由で固定できない
it.skip('announce() した文言が読み上げログに現れる', async () => {
  const el = await fixtureOf(RdLiveRegion, '<rd-live-region></rd-live-region>')
  await virtual.start({ container: document.body })
  el.announce('保存しました')
  await el.updateComplete
  await expect
    .poll(async () => (await virtual.spokenPhraseLog()).join('\n'))
    .toContain('保存しました')
})
