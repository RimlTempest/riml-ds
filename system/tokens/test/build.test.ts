import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const pkgDir = fileURLToPath(new URL('..', import.meta.url))
const distFile = (name: string): string =>
  fileURLToPath(new URL(`../dist/${name}`, import.meta.url))

describe('terrazzo build', () => {
  beforeAll(() => {
    const result = spawnSync('bun', ['run', 'build'], { cwd: pkgDir, encoding: 'utf8' })
    if (result.status !== 0) {
      throw new Error(`build failed (${result.status}):\n${result.stdout}\n${result.stderr}`)
    }
  }, 120_000)

  it('tokens.css に semantic の CSS 変数と light-dark() と color-scheme が出る', () => {
    const css = readFileSync(distFile('tokens.css'), 'utf8')
    expect(css).toContain('--rd-color-text-default')
    expect(css).toContain('light-dark(')
    expect(css).toContain('color-scheme: light dark')
  })

  it('tokens.json は JSON として読める', () => {
    const parsed: unknown = JSON.parse(readFileSync(distFile('tokens.json'), 'utf8'))
    expect(typeof parsed).toBe('object')
    expect(parsed).not.toBeNull()
  })

  it('tokens.js は値ではなく var(--rd-…) を配る', () => {
    const js = readFileSync(distFile('tokens.js'), 'utf8')
    expect(js).toContain('var(--rd-color-text-default)')
    expect(js).not.toContain('oklch')
  })
})
