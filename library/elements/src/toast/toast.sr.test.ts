import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdToast } from './toast.element.js'
// rd-toast を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './toast.define.js'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

/**
 * 読み上げそのものは `rd-live-region` の責務（ADR-0008 §6）。ここで固定するのは
 * 「**toast 自身は読み上げ用のノードを持たない**」こと（二重読み上げを防ぐ）。
 * 仮想 SR は shadow の中を観測しないので（live-region.sr.test.ts の skip 参照）、
 * 閉じるボタンが操作できる形で存在することだけを見る。
 */
it('toast 自身は aria-live を持たず、閉じるボタンに名前がある', async () => {
  const toast = await fixtureOf(RdToast, '<rd-toast></rd-toast>')
  toast.show({ message: '保存しました', duration: 0 })
  await toast.updateComplete
  expect(toast.shadowRoot?.querySelector('[aria-live]')).toBeNull()
  const close = toast.shadowRoot?.querySelector('[part=close]')
  expect(close?.textContent?.trim()).toBe('閉じる')
})
