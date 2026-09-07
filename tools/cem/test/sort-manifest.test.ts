import type { Package } from 'custom-elements-manifest/schema'
import { describe, expect, it } from 'vitest'
import { sortManifest } from '../src/core/sort-manifest.js'

const manifest = (): Package => ({
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/live-region/live-region.define.ts',
      declarations: [],
      exports: [
        {
          kind: 'custom-element-definition',
          name: 'rd-live-region',
          declaration: { name: 'RdLiveRegion', module: '/src/live-region/live-region.element.js' },
        },
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/dialog/dialog.define.ts',
      declarations: [],
      exports: [
        {
          kind: 'custom-element-definition',
          name: 'rd-dialog',
          declaration: { name: 'RdDialog', module: '/src/dialog/dialog.element.js' },
        },
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/button/button.element.ts',
      declarations: [
        { kind: 'class', name: 'RdButton' },
        { kind: 'class', name: 'RdButtonBase' },
      ],
      exports: [
        { kind: 'js', name: 'RdButton', declaration: { name: 'RdButton' } },
        { kind: 'js', name: 'RdButtonBase', declaration: { name: 'RdButtonBase' } },
      ],
    },
  ],
})

describe('sortManifest', () => {
  it('modules を path の文字列比較で並び替える', () => {
    const sorted = sortManifest(manifest())
    expect(sorted.modules.map((module) => module.path)).toEqual([
      'src/button/button.element.ts',
      'src/dialog/dialog.define.ts',
      'src/live-region/live-region.define.ts',
    ])
  })

  it('各 module 内の declarations と exports を name で並び替える', () => {
    const input = manifest()
    // button モジュールの declarations/exports を意図的に逆順にする
    const buttonModule = input.modules[2]
    if (buttonModule === undefined || buttonModule.kind !== 'javascript-module') {
      throw new Error('test fixture is broken')
    }
    buttonModule.declarations = (buttonModule.declarations ?? []).toReversed()
    buttonModule.exports = (buttonModule.exports ?? []).toReversed()

    const sorted = sortManifest(input)
    const button = sorted.modules.find((module) => module.path === 'src/button/button.element.ts')
    expect(button?.declarations?.map((declaration) => declaration.name)).toEqual([
      'RdButton',
      'RdButtonBase',
    ])
    expect(button?.exports?.map((exported) => exported.name)).toEqual(['RdButton', 'RdButtonBase'])
  })

  it('冪等: 2 回かけても結果が変わらない', () => {
    const once = sortManifest(manifest())
    const twice = sortManifest(once)
    expect(twice).toEqual(once)
  })
})
