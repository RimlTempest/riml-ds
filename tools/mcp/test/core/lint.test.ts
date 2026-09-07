import { describe, expect, it } from 'vitest'
import { makeLintCss } from '../../src/core/lint.js'
import { loadStylelintConfig } from '../../src/stylelint-config.js'

const lintCss = makeLintCss(loadStylelintConfig())

describe('lintCss', () => {
  it('生値（hex）を @rimltempest/riml-ds-lint の設定で落とす', async () => {
    const result = await lintCss('a { color: #fff; }')
    expect(result.ok).toBe(true)
    const warnings = result.ok ? result.value : []
    expect(warnings.map((warning) => warning.rule)).toContain('color-no-hex')
    expect(warnings[0]?.line).toBe(1)
  })

  it('var(--rd-*) だけの CSS は警告ゼロ', async () => {
    const result = await lintCss('a { color: var(--rd-color-text-default); }')
    expect(result.ok).toBe(true)
    expect(result.ok ? result.value : undefined).toEqual([])
  })
})
