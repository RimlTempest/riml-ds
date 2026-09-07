import type { Package } from 'custom-elements-manifest/schema'
import { describe, expect, it } from 'vitest'
import { buildRegistry } from '../src/core/registry.js'

const componentDir = (tagName: string): string => tagName.replace('rd-', '')

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
      path: `src/${componentDir(tagName)}/${componentDir(tagName)}.element.js`,
      declarations: [declaration(tagName, extra)],
    },
  ],
})

describe('buildRegistry', () => {
  it('ティア A は index / define / css の 3 ファイルを持つ', () => {
    const registry = buildRegistry(
      manifest('rd-button', { pe: 'A', status: 'stable', summary: '操作の起点' }),
    )
    expect(registry).toEqual([
      {
        name: 'button',
        tag: 'rd-button',
        pe: 'A',
        status: 'stable',
        summary: '操作の起点',
        files: ['button/index.js', 'button/button.define.js', 'button/button.css'],
        dependsOn: [],
      },
    ])
  })

  it('ティア C は css を持たず、dependsOn を引き継ぐ', () => {
    const registry = buildRegistry(
      manifest('rd-live-region', {
        pe: 'C',
        status: 'experimental',
        summary: '唯一のライブリージョン',
        dependsOn: ['rd-button'],
      }),
    )
    expect(registry[0]?.files).toEqual([
      'live-region/index.js',
      'live-region/live-region.define.js',
    ])
    expect(registry[0]?.dependsOn).toEqual(['rd-button'])
  })
})
