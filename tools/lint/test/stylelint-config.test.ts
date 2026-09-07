import { fileURLToPath } from 'node:url'
import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'

// stylelint を Node API で呼び、tools/lint/stylelint.config.js が
// ADR-0004（生値禁止・論理プロパティ・--rd- 接頭辞）を守らせているかを見る。
const configFile = fileURLToPath(new URL('../stylelint.config.js', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const cssFile = `${repoRoot}system/css/src/probe.css`
const stylesFile = `${repoRoot}library/elements/src/x/x.styles.ts`

const warningsOf = async (code: string, codeFilename: string): Promise<readonly string[]> => {
  const result = await stylelint.lint({ code, codeFilename, configFile })
  const first = result.results[0]
  return first === undefined ? [] : first.warnings.map((warning) => warning.rule)
}

const cssWarnings = (code: string): Promise<readonly string[]> => warningsOf(code, cssFile)
const litWarnings = (code: string): Promise<readonly string[]> => warningsOf(code, stylesFile)

describe('生値の禁止', () => {
  it('hex の色を落とす', async () => {
    expect(await cssWarnings('a { color: #fff; }')).not.toHaveLength(0)
  })

  it('var(--rd-*) の色は通す', async () => {
    expect(await cssWarnings('a { color: var(--rd-color-text-default); }')).toEqual([])
  })

  it('生の px は落とす', async () => {
    expect(await cssWarnings('a { padding-inline: 4px; }')).not.toHaveLength(0)
  })
})

describe('論理プロパティ', () => {
  it('padding-left を落とす', async () => {
    expect(await cssWarnings('a { padding-left: 4px; }')).toContain('property-disallowed-list')
  })

  it('padding-inline: var(--rd-space-4) は通す', async () => {
    expect(await cssWarnings('a { padding-inline: var(--rd-space-4); }')).toEqual([])
  })

  it('width を落とす', async () => {
    expect(await cssWarnings('a { width: 10px; }')).toContain('property-disallowed-list')
  })

  it('inline-size: 100% は通す', async () => {
    expect(await cssWarnings('a { inline-size: 100%; }')).toEqual([])
  })
})

describe('カスタムプロパティの命名', () => {
  it('--rd- で始まらない変数を落とす', async () => {
    expect(await cssWarnings('a { --foo: 1px; }')).toContain('custom-property-pattern')
  })
})

describe('強制配色モード', () => {
  it('システム色は通す', async () => {
    expect(
      await cssWarnings('@media (forced-colors: active) { a { border-color: ButtonText; } }'),
    ).toEqual([])
  })
})

describe('postcss-lit', () => {
  it('*.styles.ts の css`` 内でトークンを使っていれば通す', async () => {
    expect(
      await litWarnings('const styles = css`:host { color: var(--rd-color-text-default); }`\n'),
    ).toEqual([])
  })

  it('*.styles.ts の css`` 内の生値を落とす', async () => {
    expect(await litWarnings('const styles = css`:host { color: red; }`\n')).not.toHaveLength(0)
  })
})
