import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { describe, expect, it } from 'vitest'
import { getElement, listElements } from '../../src/core/elements.js'
import { elementExamples } from '../../src/examples.js'

const manifest: unknown = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../../library/elements/custom-elements.json', import.meta.url)),
    'utf8',
  ),
)

describe('listElements', () => {
  it('CEM の custom element だけを tag 順に並べ、PE ティアと status を載せる', () => {
    const result = listElements(manifest)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.map((element) => element.tag)).toEqual([
      'rd-button',
      'rd-checkbox',
      'rd-dialog',
      'rd-disclosure',
      'rd-live-region',
      'rd-select',
      'rd-text-field',
      'rd-toast',
    ])
    expect(result.value[0]).toMatchObject({ pe: 'A', status: 'stable' })
    expect(result.value[0]?.summary).not.toBe('')
  })

  it('CEM でないものは not-a-manifest で返す（throw しない）', () => {
    expect(listElements(42)).toEqual({
      ok: false,
      error: { kind: 'not-a-manifest', received: 'number' },
    })
  })
})

describe('getElement', () => {
  it('ティア A は契約の markup(既定 props) をそのまま HTML の使用例にする', () => {
    const result = getElement(manifest, elementExamples, 'rd-button')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.pe).toBe('A')
    expect(result.value.attributes.map((attribute) => attribute.name)).toEqual([
      'variant',
      'loading',
    ])
    expect(result.value.events.map((event) => event.name)).toEqual(['rd-press'])
    expect(result.value.cssStates.map((state) => state.name)).toContain('malformed')
    expect(result.value.examples.html).toBe(buttonMarkup({ label: '保存', type: 'submit' }))
    expect(result.value.examples.react).toContain("from '@rimltempest/riml-ds-react'")
    expect(result.value.examples.react).not.toContain("'use client'")
    expect(result.value.examples.reactClient).toContain("'use client'")
    expect(result.value.examples.astro).toContain('@rimltempest/riml-ds-astro/button.astro')
  })

  it('ティア C は契約が無いので空タグを使用例にし、ラッパーは client だけ', () => {
    const result = getElement(manifest, elementExamples, 'rd-live-region')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.pe).toBe('C')
    expect(result.value.examples.html).toBe('<rd-live-region></rd-live-region>')
    expect(result.value.examples.react).toBeUndefined()
    expect(result.value.examples.vue).toBeUndefined()
    expect(result.value.examples.reactClient).toContain("'use client'")
  })

  it('知らないタグは unknown-tag で返す', () => {
    expect(getElement(manifest, elementExamples, 'rd-nope')).toEqual({
      ok: false,
      error: { kind: 'unknown-tag', tag: 'rd-nope' },
    })
  })
})
