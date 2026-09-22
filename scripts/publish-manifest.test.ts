import { describe, expect, it } from 'vitest'

import {
  findLocalProtocolSpecs,
  packedFileName,
  resolveWorkspaceSpec,
  rewriteManifest,
} from './publish-manifest.ts'

// 公開する package.json に `workspace:` が残ると、どのパッケージマネージャからも
// インストールできない（0.2.0 / 0.3.0 の react / elements ほか。ADR-0009）。
// changesets の publish は bun を知らず `npm publish` を使うので、書き換えは自前で行う。

describe('resolveWorkspaceSpec', () => {
  it('pins workspace:* to the exact version for dependencies', () => {
    expect(resolveWorkspaceSpec('workspace:*', '0.3.1', 'dependencies')).toEqual({
      ok: true,
      value: '0.3.1',
    })
  })

  it('uses a caret range for peerDependencies so consumers do not get duplicates', () => {
    expect(resolveWorkspaceSpec('workspace:*', '0.3.1', 'peerDependencies')).toEqual({
      ok: true,
      value: '^0.3.1',
    })
  })

  it.each([
    ['workspace:^', '^0.3.1'],
    ['workspace:~', '~0.3.1'],
    ['workspace:^0.3.0', '^0.3.0'],
    ['workspace:1.2.3', '1.2.3'],
  ])('resolves %s', (spec, expected) => {
    expect(resolveWorkspaceSpec(spec, '0.3.1', 'dependencies')).toEqual({
      ok: true,
      value: expected,
    })
  })

  it('leaves ordinary ranges untouched', () => {
    expect(resolveWorkspaceSpec('^19.0.0', '0.3.1', 'peerDependencies')).toEqual({
      ok: true,
      value: '^19.0.0',
    })
  })

  it('rejects an empty workspace range', () => {
    expect(resolveWorkspaceSpec('workspace:', '0.3.1', 'dependencies').ok).toBe(false)
  })
})

describe('rewriteManifest', () => {
  const versions = new Map([
    ['@rimltempest/riml-ds-elements', '0.3.1'],
    ['@rimltempest/riml-ds-tokens', '0.3.1'],
  ])

  it('rewrites every dependency field and reports what changed', () => {
    const result = rewriteManifest(
      {
        name: '@rimltempest/riml-ds-react',
        version: '0.3.1',
        dependencies: { lit: '3.3.3' },
        peerDependencies: { '@rimltempest/riml-ds-elements': 'workspace:*', react: '^19.0.0' },
        optionalDependencies: { '@rimltempest/riml-ds-tokens': 'workspace:^' },
        devDependencies: { '@rimltempest/riml-ds-tokens': 'workspace:*' },
      },
      versions,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.manifest['peerDependencies']).toEqual({
      '@rimltempest/riml-ds-elements': '^0.3.1',
      react: '^19.0.0',
    })
    expect(result.value.manifest['optionalDependencies']).toEqual({
      '@rimltempest/riml-ds-tokens': '^0.3.1',
    })
    expect(result.value.manifest['devDependencies']).toEqual({
      '@rimltempest/riml-ds-tokens': '0.3.1',
    })
    expect(result.value.manifest['dependencies']).toEqual({ lit: '3.3.3' })
    expect(result.value.changes).toEqual([
      'peerDependencies.@rimltempest/riml-ds-elements: workspace:* -> ^0.3.1',
      'optionalDependencies.@rimltempest/riml-ds-tokens: workspace:^ -> ^0.3.1',
      'devDependencies.@rimltempest/riml-ds-tokens: workspace:* -> 0.3.1',
    ])
  })

  it('fails when a workspace dependency is not a package of this repository', () => {
    const result = rewriteManifest(
      { name: 'x', version: '0.3.1', dependencies: { '@rimltempest/riml-ds-nope': 'workspace:*' } },
      versions,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('@rimltempest/riml-ds-nope')
  })

  it('does not mutate its input', () => {
    const input = {
      name: 'x',
      version: '1.0.0',
      peerDependencies: { '@rimltempest/riml-ds-elements': 'workspace:*' },
    }
    rewriteManifest(input, versions)
    expect(input.peerDependencies['@rimltempest/riml-ds-elements']).toBe('workspace:*')
  })
})

describe('findLocalProtocolSpecs', () => {
  it('finds workspace:, link:, file: and catalog: in fields consumers install', () => {
    expect(
      findLocalProtocolSpecs({
        dependencies: { a: 'workspace:*', b: '1.0.0' },
        peerDependencies: { c: 'link:../c' },
        optionalDependencies: { d: 'file:../d', e: 'catalog:' },
        devDependencies: { f: 'workspace:*' },
      }),
    ).toEqual([
      'dependencies.a: workspace:*',
      'peerDependencies.c: link:../c',
      'optionalDependencies.d: file:../d',
      'optionalDependencies.e: catalog:',
    ])
  })

  it('returns nothing for a publishable manifest', () => {
    expect(findLocalProtocolSpecs({ peerDependencies: { react: '^19.0.0' } })).toEqual([])
  })
})

describe('packedFileName', () => {
  it('reads the npm <= 11 array output', () => {
    expect(packedFileName('[{"filename":"a-1.0.0.tgz"}]')).toBe('a-1.0.0.tgz')
  })

  it('reads the npm 12 output keyed by package name', () => {
    expect(packedFileName('{"@scope/a":{"filename":"scope-a-1.0.0.tgz"}}')).toBe(
      'scope-a-1.0.0.tgz',
    )
  })

  it('returns undefined for anything else', () => {
    expect(packedFileName('not json')).toBeUndefined()
    expect(packedFileName('{}')).toBeUndefined()
  })
})
