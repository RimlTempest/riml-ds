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
      'rd-meter',
      'rd-select',
      'rd-tabs',
      'rd-text-field',
      'rd-toast',
      'rd-tooltip',
      'rd-window',
    ])
    expect(result.value[0]).toMatchObject({ pe: 'A', status: 'stable' })
    expect(result.value[0]?.summary).not.toBe('')
  })

  it('契約を持つ部品すべてに使用例がある（ティア C の rd-toast も空タグで載せる）', () => {
    // rd-live-region だけは core が空タグに落とす（skills 側の説明が別にある）
    expect(Object.keys(elementExamples).toSorted()).toEqual([
      'rd-button',
      'rd-checkbox',
      'rd-dialog',
      'rd-disclosure',
      'rd-meter',
      'rd-select',
      'rd-tabs',
      'rd-text-field',
      'rd-toast',
      'rd-tooltip',
      'rd-window',
    ])
  })

  it('experimental の使用例も契約から描く（select は <option> 込み）', () => {
    const result = getElement(manifest, elementExamples, 'rd-select')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.status).toBe('experimental')
    expect(result.value.examples.html).toContain('<option value="jp">')
    expect(result.value.examples.html).toContain('<label for="country">')
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

  it('stable な部品の例は root のサブパスから import する', () => {
    const result = getElement(manifest, elementExamples, 'rd-button')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const examples = result.value.examples
    expect(examples.react).toContain(`from '@rimltempest/riml-ds-react'`)
    expect(examples.reactClient).toContain(`from '@rimltempest/riml-ds-react/client'`)
    expect(examples.vue).toContain(`from '@rimltempest/riml-ds-vue'`)
    expect(examples.svelte).toContain(`from '@rimltempest/riml-ds-svelte'`)
    expect(examples.astro).toContain(`from '@rimltempest/riml-ds-astro/button.astro'`)
    for (const source of [examples.react, examples.reactClient, examples.vue, examples.svelte]) {
      expect(source).not.toContain('/experimental')
    }
  })

  it('experimental な部品の例は ./experimental サブパスから import する（ADR-0009）', () => {
    const result = getElement(manifest, elementExamples, 'rd-select')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.status).toBe('experimental')
    const examples = result.value.examples
    expect(examples.react).toContain(`from '@rimltempest/riml-ds-react/experimental'`)
    expect(examples.reactClient).toContain(`from '@rimltempest/riml-ds-react/client/experimental'`)
    expect(examples.vue).toContain(`from '@rimltempest/riml-ds-vue/experimental'`)
    expect(examples.svelte).toContain(`from '@rimltempest/riml-ds-svelte/experimental'`)
    expect(examples.astro).toContain(`from '@rimltempest/riml-ds-astro/experimental/select.astro'`)
  })

  it('知らないタグは unknown-tag で返す', () => {
    expect(getElement(manifest, elementExamples, 'rd-nope')).toEqual({
      ok: false,
      error: { kind: 'unknown-tag', tag: 'rd-nope' },
    })
  })
})
