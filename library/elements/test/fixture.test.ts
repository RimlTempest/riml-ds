import { afterEach, describe, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from './fixture.js'

afterEach(() => {
  cleanupFixtures()
})

describe('fixtureOf', () => {
  it('HTML を body に挿し、先頭の要素を型付きで返す', async () => {
    const el = await fixtureOf(HTMLDivElement, '<div><span>keep</span></div>')
    expect(el.isConnected).toBe(true)
    expect(el.querySelector('span')?.textContent).toBe('keep')
  })

  it('期待した class でなければ落ちる', async () => {
    await expect(fixtureOf(HTMLDivElement, '<p></p>')).rejects.toThrow('HTMLDivElement')
  })
})

describe('loadStyle', () => {
  it('同じ href を 2 回呼んでも <link> は 1 つだけ', async () => {
    const href = '/library/elements/test/fixture-probe.css'
    await loadStyle(href)
    await loadStyle(href)
    expect(document.head.querySelectorAll(`link[data-fixture-href='${href}']`)).toHaveLength(1)
  })
})
