import { userEvent } from 'vitest/browser'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdDialog } from './dialog.element.js'
// rd-dialog を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './dialog.define.js'

const DIALOG = '<rd-dialog><h2 slot="label">削除の確認</h2><p>元に戻せません。</p></rd-dialog>'

const nativeDialog = (el: RdDialog): HTMLDialogElement | null =>
  el.shadowRoot?.querySelector('dialog') ?? null

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/dialog/dialog.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('show() で <dialog> がモーダルとして開く', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  expect(nativeDialog(el)?.open).toBe(true)
  expect(el.open).toBe(true)
})

it('open 属性と <dialog> の状態が同期する', async () => {
  const el = await fixtureOf(RdDialog, '<rd-dialog open><h2 slot="label">確認</h2></rd-dialog>')
  expect(nativeDialog(el)?.open).toBe(true)
  el.open = false
  await el.updateComplete
  expect(nativeDialog(el)?.open).toBe(false)
})

it(':state(open) が open と同期する', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  expect(el.matches(':state(open)')).toBe(false)
  el.show()
  await el.updateComplete
  expect(el.matches(':state(open)')).toBe(true)
})

it('Esc で閉じ、rd-dismiss { reason: "esc" } が上がる', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-dismiss', listener)
  el.show()
  await el.updateComplete
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => el.open).toBe(false)
  const event = listener.mock.calls[0]?.[0]
  expect(event).toBeInstanceOf(CustomEvent)
  expect(event instanceof CustomEvent ? event.detail : undefined).toEqual({ reason: 'esc' })
})

it('persistent 属性だけで Esc を無視する（プロパティで倒さなくてよい）', async () => {
  const el = await fixtureOf(
    RdDialog,
    '<rd-dialog persistent><h2 slot="label">確認</h2></rd-dialog>',
  )
  expect(el.persistent).toBe(true)
  el.show()
  await el.updateComplete
  const cancel = new Event('cancel', { cancelable: true })
  nativeDialog(el)?.dispatchEvent(cancel)
  await el.updateComplete
  expect(cancel.defaultPrevented).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(el.open).toBe(true)
  expect(nativeDialog(el)?.open).toBe(true)
})

it('背面（backdrop）のクリックで閉じる', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  const dialog = nativeDialog(el)
  dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await expect.poll(() => el.open).toBe(false)
})

it('閉じたら開いた要素にフォーカスが戻る', async () => {
  const host = await fixtureOf(
    HTMLDivElement,
    `<div><button type="button" id="opener">開く</button>${DIALOG}</div>`,
  )
  const opener = host.querySelector('button')
  const el = host.querySelector('rd-dialog')
  expect(el).toBeInstanceOf(RdDialog)
  if (!(el instanceof RdDialog)) {
    return
  }
  await el.updateComplete
  opener?.focus()
  el.show()
  await el.updateComplete
  el.close()
  await expect.poll(() => document.activeElement).toBe(opener)
})

it('slot のラベルが aria-labelledby で <dialog> に結ばれる', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  const dialog = nativeDialog(el)
  const labelId = dialog?.getAttribute('aria-labelledby')
  expect(labelId).not.toBeNull()
  const label = el.shadowRoot?.getElementById(labelId ?? '')
  expect(label?.querySelector('slot')?.getAttribute('name')).toBe('label')
  expect(el.querySelector('[slot=label]')?.textContent).toBe('削除の確認')
})

/** `var(--rd-color-*)` の解決値を rgb 文字列で得る（実測と同じ土俵で比べるため） */
const resolvedColor = (token: string): string => {
  const probe = document.createElement('span')
  probe.style.backgroundColor = `var(${token})`
  document.body.append(probe)
  const value = getComputedStyle(probe).backgroundColor
  probe.remove()
  return value
}

it('見出しが窓の帯になり、本文は body part に入る（brand.md §7.1 / §7.7）', async () => {
  const el = await fixtureOf(RdDialog, DIALOG)
  el.show()
  await el.updateComplete
  const label = el.shadowRoot?.querySelector('[part=label]')
  const body = el.shadowRoot?.querySelector('[part=body]')
  expect(label).not.toBeNull()
  expect(body).not.toBeNull()
  // 本文と actions はどちらも body に入る（帯と本体を分ける）
  expect(body?.querySelectorAll('slot')).toHaveLength(2)

  const bar = label === null || label === undefined ? undefined : getComputedStyle(label)
  expect(bar?.backgroundColor).toBe(resolvedColor('--rd-color-chrome-default'))
  expect(bar?.display).toBe('grid')

  // 枠は <dialog> ではなく帯と本体が持つ。パディングは body 側
  const control = nativeDialog(el)
  const frame = control === null ? undefined : getComputedStyle(control)
  expect(frame?.paddingTop).toBe('0px')
  expect(frame?.borderTopWidth).toBe('0px')
  expect(frame?.borderTopLeftRadius).toBe('16px')
})
