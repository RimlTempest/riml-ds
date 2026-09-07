import { afterEach, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdToast } from './toast.element.js'
// rd-toast / rd-live-region を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './toast.define.js'
// oxlint-disable-next-line import/no-unassigned-import
import '../live-region/live-region.define.js'
import { RdLiveRegion } from '../live-region/index.js'

const shadowText = (el: RdToast, part: string): string =>
  el.shadowRoot?.querySelector(`[part=${part}]`)?.textContent?.trim() ?? ''

/** ページに 1 つのライブリージョンを置いた状態を作る（ADR-0008 §6） */
const withRegion = async (): Promise<{ toast: RdToast; region: RdLiveRegion }> => {
  const host = await fixtureOf(
    HTMLDivElement,
    '<div><rd-toast></rd-toast><rd-live-region></rd-live-region></div>',
  )
  const toast = host.querySelector('rd-toast')
  const region = host.querySelector('rd-live-region')
  if (!(toast instanceof RdToast) || !(region instanceof RdLiveRegion)) {
    throw new Error('fixture: rd-toast と rd-live-region が必要')
  }
  await toast.updateComplete
  await region.updateComplete
  return { toast, region }
}

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('show() で文言が出て :state(open) が付く', async () => {
  const { toast } = await withRegion()
  toast.show({ message: '保存しました' })
  await toast.updateComplete
  expect(shadowText(toast, 'message')).toBe('保存しました')
  expect(toast.matches(':state(open)')).toBe(true)
  expect(toast.matches(':state(info)')).toBe(true)
})

it('duration が過ぎると自動で消え rd-dismiss が上がる', async () => {
  const { toast } = await withRegion()
  const listener = vi.fn<(event: Event) => void>()
  toast.addEventListener('rd-dismiss', listener)
  toast.show({ message: '保存しました', duration: 20 })
  await toast.updateComplete
  await expect.poll(() => toast.open).toBe(false)
  expect(listener).toHaveBeenCalledOnce()
})

it('ホバー中は自動で消さない（WCAG 2.2.1）', async () => {
  const { toast } = await withRegion()
  toast.show({ message: '保存しました', duration: 30 })
  await toast.updateComplete
  toast.shadowRoot?.querySelector('[part=control]')?.dispatchEvent(new Event('pointerenter'))
  await toast.updateComplete
  await new Promise((resolve) => {
    setTimeout(resolve, 80)
  })
  expect(toast.open).toBe(true)
  toast.shadowRoot?.querySelector('[part=control]')?.dispatchEvent(new Event('pointerleave'))
  await toast.updateComplete
  await expect.poll(() => toast.open).toBe(false)
})

it('閉じるボタンで閉じる', async () => {
  const { toast } = await withRegion()
  toast.show({ message: '保存しました', duration: 0 })
  await toast.updateComplete
  const close = toast.shadowRoot?.querySelector('[part=close]')
  expect(close).toBeInstanceOf(HTMLButtonElement)
  if (close instanceof HTMLButtonElement) {
    close.click()
  }
  await expect.poll(() => toast.open).toBe(false)
})

it('文言は rd-live-region に委譲する（自前の aria-live を持たない）', async () => {
  const { toast, region } = await withRegion()
  toast.show({ message: '保存に失敗しました', tone: 'danger', duration: 0 })
  await region.updateComplete
  expect(region.shadowRoot?.querySelector('[aria-live=assertive]')?.textContent).toBe(
    '保存に失敗しました',
  )
  expect(toast.shadowRoot?.querySelector('[aria-live]')).toBeNull()
})

it('rd-live-region がページに無ければ 1 回だけ警告する', async () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const toast = await fixtureOf(RdToast, '<rd-toast></rd-toast>')
  toast.show({ message: '保存しました', duration: 0 })
  toast.show({ message: '削除しました', duration: 0 })
  await toast.updateComplete
  expect(spy).toHaveBeenCalledOnce()
  expect(shadowText(toast, 'message')).toBe('削除しました')
})
