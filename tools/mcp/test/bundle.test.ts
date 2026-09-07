import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// tools/mcp/dist は `bun run build` の生成物。CI は test の前に build を回す（ci.yml）
const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8')

describe('@rimltempest/riml-ds-mcp の配布物', () => {
  it('dist/cli.js に Lit が入っていない（例は契約サブパスから作る。plan 011）', () => {
    const bundle = read('dist/cli.js')
    expect(bundle).not.toContain('LitElement')
    expect(bundle).not.toMatch(/from\s+["']lit["']/)
  })

  it('実行時依存に lit / elements が無い（elements は devDependencies でバンドルに取り込む）', () => {
    const pkg: unknown = JSON.parse(read('package.json'))
    const deps =
      typeof pkg === 'object' && pkg !== null && 'dependencies' in pkg ? pkg.dependencies : {}
    expect(deps).not.toHaveProperty('lit')
    expect(deps).not.toHaveProperty('@rimltempest/riml-ds-elements')
  })
})
