import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// oxlint をリポジトリルートを cwd にして子プロセスで走らせ、設定込みで
// `riml-ds/*` ルールが効いているかを見る（ルール関数の単体テストより、
// .oxlintrc.json の overrides / ignorePatterns の壊れに気づける）。
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const fixtureDir = 'tools/lint/test/fixtures'

type Diagnostic = {
  readonly code: string
  readonly message: string
}

const isDiagnostic = (value: unknown): value is Diagnostic =>
  typeof value === 'object'
  && value !== null
  && 'code' in value
  && typeof value.code === 'string'
  && 'message' in value
  && typeof value.message === 'string'

const parseDiagnostics = (stdout: string): readonly Diagnostic[] => {
  const parsed: unknown = JSON.parse(stdout)
  if (typeof parsed !== 'object' || parsed === null || !('diagnostics' in parsed)) {
    return []
  }
  const { diagnostics } = parsed
  return Array.isArray(diagnostics) ? diagnostics.filter(isDiagnostic) : []
}

const lint = (relativeFixture: string): readonly Diagnostic[] => {
  const result = spawnSync(
    'node_modules/.bin/oxlint',
    ['--config', '.oxlintrc.json', '--format', 'json', `${fixtureDir}/${relativeFixture}`],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  return parseDiagnostics(result.stdout)
}

const countOf = (diagnostics: readonly Diagnostic[], rule: string): number =>
  diagnostics.filter((diagnostic) => diagnostic.code.includes(rule)).length

describe('riml-ds/no-class', () => {
  it('ふつうの .ts の class は落とす', () => {
    expect(countOf(lint('class-in-plain.ts'), 'no-class')).toBe(1)
  })

  it('*.element.ts では class を許す', () => {
    expect(countOf(lint('foo.element.ts'), 'no-class')).toBe(0)
  })
})

describe('riml-ds/no-type-assertion', () => {
  it('as は落とす', () => {
    expect(countOf(lint('as-cast.ts'), 'no-type-assertion')).toBe(1)
  })

  it('as const は許す', () => {
    expect(countOf(lint('as-const.ts'), 'no-type-assertion')).toBe(0)
  })

  it('non-null assertion (!) は落とす', () => {
    const diagnostics = lint('non-null.ts')
    expect(countOf(diagnostics, 'no-type-assertion')).toBe(1)
    const nonNull = diagnostics.find((diagnostic) => diagnostic.code.includes('no-type-assertion'))
    expect(nonNull?.message).toContain('!')
  })
})

describe('riml-ds/no-enum', () => {
  it('enum は落とす', () => {
    expect(countOf(lint('enum.ts'), 'no-enum')).toBe(1)
  })
})

describe('riml-ds/no-throw-in-domain', () => {
  it('overrides が指すドメイン層の throw は落とす', () => {
    expect(countOf(lint('library/elements/src/x/x.logic.ts'), 'no-throw-in-domain')).toBe(1)
  })
})

describe('import/no-default-export', () => {
  it('ふつうの .ts の default export は落とす', () => {
    expect(countOf(lint('default-export.ts'), 'no-default-export')).toBe(1)
  })

  it('*.stories.ts の default export は許す', () => {
    expect(countOf(lint('x.stories.ts'), 'no-default-export')).toBe(0)
  })
})
