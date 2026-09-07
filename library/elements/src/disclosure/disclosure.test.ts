import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdDisclosure } from './disclosure.element.js'
// rd-disclosure を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './disclosure.define.js'

const DISCLOSURE =
  '<rd-disclosure><details><summary>送料について</summary>'
  + '<p>全国一律 500 円です。</p></details></rd-disclosure>'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/disclosure/disclosure.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdDisclosure, DISCLOSURE)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelector('summary')?.textContent).toBe('送料について')
})

it('<summary> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdDisclosure, '<rd-disclosure><details></details></rd-disclosure>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('summary をクリックすると開き、rd-toggle { open: true } が上がる', async () => {
  const el = await fixtureOf(RdDisclosure, DISCLOSURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  el.querySelector('summary')?.click()
  await expect.poll(() => el.open).toBe(true)
  expect(el.matches(':state(open)')).toBe(true)
  const event = listener.mock.calls[0]?.[0]
  expect(event instanceof CustomEvent ? event.detail : undefined).toEqual({ open: true })
})

it('open プロパティで <details> を開閉できる', async () => {
  const el = await fixtureOf(RdDisclosure, DISCLOSURE)
  el.open = true
  await el.updateComplete
  expect(el.querySelector('details')?.open).toBe(true)
  el.open = false
  await el.updateComplete
  expect(el.querySelector('details')?.open).toBe(false)
})

it('<details open> で書かれた初期状態を取り込む', async () => {
  const el = await fixtureOf(
    RdDisclosure,
    '<rd-disclosure><details open><summary>見出し</summary><p>本文</p></details></rd-disclosure>',
  )
  expect(el.open).toBe(true)
  expect(el.matches(':state(open)')).toBe(true)
})
