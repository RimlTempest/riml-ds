import { userEvent } from 'vitest/browser'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdWindow } from './window.element.js'
// rd-window を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './window.define.js'

const WINDOW = (attrs = 'closable expandable collapsible'): string =>
  `<rd-window ${attrs}><h2 slot="title">設定</h2><p>本文</p></rd-window>`

const controls = (el: RdWindow): readonly HTMLButtonElement[] =>
  [...(el.shadowRoot?.querySelectorAll('button[data-action]') ?? [])].flatMap((node) =>
    node instanceof HTMLButtonElement ? [node] : [],
  )

const actionsOf = (el: RdWindow): readonly string[] =>
  controls(el).map((button) => button.dataset['action'] ?? '')

const controlFor = (el: RdWindow, action: string): HTMLButtonElement | undefined =>
  controls(el).find((button) => button.dataset['action'] === action)

const body = (el: RdWindow): HTMLElement | null =>
  el.shadowRoot?.querySelector('[part=body]') ?? null

/** `var(--rd-color-*)` の解決値を rgb 文字列で得る（実測と同じ土俵で比べるため） */
const resolvedColor = (token: string): string => {
  const probe = document.createElement('span')
  probe.style.backgroundColor = `var(${token})`
  document.body.append(probe)
  const value = getComputedStyle(probe).backgroundColor
  probe.remove()
  return value
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/window/window.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('付いた操作の丸だけを 閉じる → 広げる → たたむ の順に描く', async () => {
  const all = await fixtureOf(RdWindow, WINDOW())
  expect(actionsOf(all)).toEqual(['close', 'expand', 'collapse'])

  const one = await fixtureOf(RdWindow, WINDOW('closable'))
  expect(actionsOf(one)).toEqual(['close'])

  const none = await fixtureOf(RdWindow, WINDOW(''))
  expect(actionsOf(none)).toEqual([])
  // 操作が 1 つも無いなら入れ物ごと省く
  expect(none.shadowRoot?.querySelector('[part=controls]')).toBeNull()
})

it('たたむと body が hidden になり、aria-expanded と :state(collapsed) が追随する', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  const collapse = controlFor(el, 'collapse')
  expect(collapse?.getAttribute('aria-expanded')).toBe('true')
  expect(collapse?.getAttribute('aria-controls')).toBe(body(el)?.id)

  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  collapse?.click()
  await el.updateComplete

  expect(body(el)?.hidden).toBe(true)
  expect(controlFor(el, 'collapse')?.getAttribute('aria-expanded')).toBe('false')
  expect(el.matches(':state(collapsed)')).toBe(true)
  const event = listener.mock.calls[0]?.[0]
  expect(event instanceof CustomEvent ? event.detail : undefined).toEqual({ collapsed: true })
})

it('広げると expanded が反射し、Esc で戻る（rd-expand は 2 回）', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-expand', listener)

  controlFor(el, 'expand')?.click()
  await el.updateComplete
  expect(el.hasAttribute('expanded')).toBe(true)
  expect(controlFor(el, 'expand')?.getAttribute('aria-pressed')).toBe('true')
  expect(el.matches(':state(expanded)')).toBe(true)

  controlFor(el, 'expand')?.focus()
  await userEvent.keyboard('{Escape}')
  await el.updateComplete
  expect(el.expanded).toBe(false)
  expect(listener).toHaveBeenCalledTimes(2)
})

it('閉じると rd-dismiss { reason: "button" } が上がり、既定では hidden が付く', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-dismiss', listener)
  controlFor(el, 'close')?.click()
  await el.updateComplete
  const event = listener.mock.calls[0]?.[0]
  expect(event instanceof CustomEvent ? event.detail : undefined).toEqual({ reason: 'button' })
  expect(el.hidden).toBe(true)
})

it('rd-dismiss を preventDefault すれば hidden は付かない（SPA が自分で消す）', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  el.addEventListener('rd-dismiss', (event: Event) => {
    event.preventDefault()
  })
  controlFor(el, 'close')?.click()
  await el.updateComplete
  expect(el.hidden).toBe(false)
})

const labelsUnder = async (lang: string): Promise<readonly (string | null)[]> => {
  const host = await fixtureOf(HTMLDivElement, `<div lang="${lang}">${WINDOW()}</div>`)
  const el = host.querySelector('rd-window')
  expect(el).toBeInstanceOf(RdWindow)
  if (!(el instanceof RdWindow)) {
    return []
  }
  await el.updateComplete
  return controls(el).map((button) => button.getAttribute('aria-label'))
}

it('aria-label は最も近い [lang] で日英を選ぶ（_shared/lang.ts）', async () => {
  expect(await labelsUnder('ja')).toEqual(['閉じる', '広げる', 'たたむ'])
  expect(await labelsUnder('en')).toEqual(['Close', 'Expand', 'Collapse'])
})

it('slot="title" の子が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdWindow, '<rd-window closable><p>本文</p></rd-window>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('丸は chrome.text の塗り、記号は mask の data URI（brand.md §7.1）', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  const close = controlFor(el, 'close')
  const dot = close === undefined ? undefined : getComputedStyle(close, '::before')
  const glyph = close === undefined ? undefined : getComputedStyle(close, '::after')
  expect(dot?.backgroundColor).toBe(resolvedColor('--rd-color-chrome-text'))
  expect(dot?.content).not.toBe('none')
  expect(glyph?.maskImage).toContain('data:image/svg+xml')
  // 当たり判定は sizing.target-min（2.75rem = 44px）四方
  const hit = close === undefined ? undefined : getComputedStyle(close)
  expect(hit?.inlineSize).toBe('44px')
  expect(hit?.blockSize).toBe('44px')
})

it('Tab で当たる輪は丸のすぐ外に 1 本だけ（UA 既定の二重輪を出さない）', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  await userEvent.tab()
  const close = controlFor(el, 'close')
  expect(el.shadowRoot?.activeElement).toBe(close)
  const ring = close === undefined ? undefined : getComputedStyle(close)
  // solid = 作者スタイルが当たっている（auto なら UA の輪が別に描かれる）
  expect(ring?.outlineStyle).toBe('solid')
  expect(ring?.outlineWidth).toBe('2px')
  // (2.75rem - 1.25rem) / 2 = 12px の内側から 2px 外
  expect(ring?.outlineOffset).toBe('-10px')
  // 丸（::before）には輪を描かない
  expect(getComputedStyle(close ?? document.body, '::before').outlineStyle).toBe('none')
})

it('見出しは slot のまま。帯の色は chrome.default（brand.md §7.1）', async () => {
  const el = await fixtureOf(RdWindow, WINDOW())
  const bar = el.shadowRoot?.querySelector('[part=bar]')
  const style = bar === null || bar === undefined ? undefined : getComputedStyle(bar)
  expect(style?.backgroundColor).toBe(resolvedColor('--rd-color-chrome-default'))
  expect(style?.display).toBe('grid')
  expect(el.querySelector('[slot=title]')?.textContent).toBe('設定')
})
