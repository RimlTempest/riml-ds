import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// release.yml の publish は `changeset publish`（= `npm publish`）で、`workspace:*` を
// 書き換えない。書き換え（prepare-publish）と検査（check-packed）が publish より前に
// 無いと、0.2.0 / 0.3.0 と同じくインストールできない版が公開される。順番をここで固定する。
const workflow = readFileSync(
  fileURLToPath(new URL('../.github/workflows/release.yml', import.meta.url)),
  'utf8',
)

const indexOf = (needle: string): number => workflow.indexOf(needle)

describe('release.yml', () => {
  it('rewrites workspace: specifiers before publishing', () => {
    const prepare = indexOf('bun scripts/prepare-publish.ts')
    const publish = indexOf('changesets/action/publish@')
    expect(prepare).toBeGreaterThan(-1)
    expect(publish).toBeGreaterThan(prepare)
  })

  it('checks the packed tarballs after rewriting and before publishing', () => {
    const prepare = indexOf('bun scripts/prepare-publish.ts')
    const check = indexOf('bun scripts/check-packed.ts')
    const publish = indexOf('changesets/action/publish@')
    expect(check).toBeGreaterThan(prepare)
    expect(publish).toBeGreaterThan(check)
  })

  it('publishes through npm trusted publishing without a token', () => {
    expect(workflow).toContain('id-token: write')
    expect(workflow).not.toMatch(/NODE_AUTH_TOKEN|NPM_TOKEN/)
  })

  it('pins every action to a commit SHA', () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1] ?? '')
    expect(uses.length).toBeGreaterThan(0)
    for (const ref of uses) expect(ref).toMatch(/@[0-9a-f]{40}$/)
  })
})
