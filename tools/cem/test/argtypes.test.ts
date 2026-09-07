import type { Package } from 'custom-elements-manifest/schema'
import { describe, expect, it } from 'vitest'
import { argTypesFor } from '../src/core/argtypes.js'

/**
 * schema.d.ts の `CustomElementDeclaration` は `customElement` / `tagName` を持たない（v1.0.0 の抜け）。
 * リテラルのまま書くと余剰プロパティ検査に当たるので、関数の戻り値として組み立てる。
 */
const declaration = (
  tagName: string,
  extra: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> & { readonly kind: 'class'; readonly name: string } => ({
  kind: 'class',
  name: 'Rd',
  customElement: true,
  tagName,
  ...extra,
})

const manifest = (tagName: string, extra: Readonly<Record<string, unknown>>): Package => ({
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/x/x.element.js',
      declarations: [declaration(tagName, extra)],
    },
  ],
})

describe('argTypesFor', () => {
  it('boolean 属性は boolean の control になり、既定値が表に載る', () => {
    const argTypes = argTypesFor(
      manifest('rd-dialog', {
        attributes: [
          {
            name: 'dismissible',
            type: { text: 'boolean' },
            default: 'true',
            description: 'Esc と背面で閉じられる',
          },
        ],
      }),
      'rd-dialog',
    )
    expect(argTypes['dismissible']).toEqual({
      control: 'boolean',
      description: 'Esc と背面で閉じられる',
      table: { category: 'attributes', defaultValue: { summary: 'true' } },
    })
  })

  it('文字列リテラルの union は select と options になる', () => {
    const argTypes = argTypesFor(
      manifest('rd-button', {
        attributes: [
          {
            name: 'variant',
            type: { text: "'primary' | 'secondary' | 'danger'" },
            default: "'primary'",
          },
        ],
      }),
      'rd-button',
    )
    expect(argTypes['variant']).toEqual({
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      table: { category: 'attributes', defaultValue: { summary: "'primary'" } },
    })
  })

  it('union でも boolean でもない属性は text の control になる', () => {
    const argTypes = argTypesFor(
      manifest('rd-text-field', { attributes: [{ name: 'hint', type: { text: 'string' } }] }),
      'rd-text-field',
    )
    expect(argTypes['hint']).toEqual({ control: 'text', table: { category: 'attributes' } })
  })

  it('イベントは action になる', () => {
    const argTypes = argTypesFor(
      manifest('rd-button', {
        events: [{ name: 'rd-press', description: '子の click で発火' }],
      }),
      'rd-button',
    )
    expect(argTypes['rd-press']).toEqual({
      action: 'rd-press',
      description: '子の click で発火',
      table: { category: 'events' },
    })
  })

  it('slot / part / css 変数 / 状態は control を持たない読み取り専用の行になる', () => {
    const argTypes = argTypesFor(
      manifest('rd-dialog', {
        slots: [
          { name: '', description: '本文' },
          { name: 'label', description: '見出し' },
        ],
        cssParts: [{ name: 'control', description: '内側の <dialog>' }],
        cssProperties: [{ name: '--rd-dialog-gap', description: '間隔' }],
        cssStates: [{ name: 'open', description: '開いている' }],
      }),
      'rd-dialog',
    )
    expect(argTypes['slot:default']).toEqual({
      control: false,
      description: '本文',
      table: { category: 'slots' },
    })
    expect(argTypes['slot:label']?.control).toBe(false)
    expect(argTypes['part:control']?.table?.category).toBe('css parts')
    expect(argTypes['--rd-dialog-gap']?.table?.category).toBe('css properties')
    expect(argTypes['state:open']?.table?.category).toBe('css states')
  })

  it('存在しないタグは空オブジェクトを返す', () => {
    expect(argTypesFor(manifest('rd-button', {}), 'rd-nope')).toEqual({})
  })
})
