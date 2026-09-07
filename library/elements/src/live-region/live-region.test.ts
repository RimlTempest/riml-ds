import { afterEach, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { RdLiveRegion } from './live-region.element.js'
// rd-live-region を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './live-region.define.js'

const NBSP = '\u00a0'

const node = (el: RdLiveRegion, politeness: string): Element | null =>
  el.shadowRoot?.querySelector(`[aria-live='${politeness}']`) ?? null

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('polite と assertive の 2 つのライブリージョンを持つ', async () => {
  const el = await fixtureOf(RdLiveRegion, '<rd-live-region></rd-live-region>')
  expect(node(el, 'polite')?.getAttribute('aria-atomic')).toBe('true')
  expect(node(el, 'assertive')?.getAttribute('aria-atomic')).toBe('true')
  expect(el.shadowRoot?.querySelectorAll('[aria-live]')).toHaveLength(2)
})

it('announce() が politeness ごとのノードにだけ書く', async () => {
  const el = await fixtureOf(RdLiveRegion, '<rd-live-region></rd-live-region>')
  el.announce('保存しました')
  await el.updateComplete
  expect(node(el, 'polite')?.textContent).toBe('保存しました')
  expect(node(el, 'assertive')?.textContent).toBe('')

  el.announce('保存できません。もう一度試してください。', { politeness: 'assertive' })
  await el.updateComplete
  expect(node(el, 'assertive')?.textContent).toBe('保存できません。もう一度試してください。')
  expect(node(el, 'polite')?.textContent).toBe('保存しました')
})

it('同じ文言を続けて出すと読み直され、空文字は無視して rd-announce も出さない', async () => {
  const el = await fixtureOf(RdLiveRegion, '<rd-live-region></rd-live-region>')
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-announce', listener)

  el.announce('保存しました')
  el.announce('保存しました')
  await el.updateComplete
  expect(node(el, 'polite')?.textContent).toBe(`保存しました${NBSP}`)
  expect(listener).toHaveBeenCalledTimes(2)

  el.announce('')
  await el.updateComplete
  expect(node(el, 'polite')?.textContent).toBe(`保存しました${NBSP}`)
  expect(listener).toHaveBeenCalledTimes(2)
  const event = listener.mock.calls[0]?.[0]
  expect(event instanceof CustomEvent ? event.detail : undefined).toEqual({
    message: '保存しました',
    politeness: 'polite',
  })
})

it('shadow が serializable で、描画後の HTML に読み上げノードが出る', async () => {
  const el = await fixtureOf(RdLiveRegion, '<rd-live-region></rd-live-region>')
  el.announce('保存しました')
  await el.updateComplete
  const html = el.getHTML({ serializableShadowRoots: true })
  expect(html).toContain('part="polite"')
  expect(html).toContain('保存しました')
})
