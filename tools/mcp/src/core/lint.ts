/**
 * `lint_css`：文字列の CSS を `@rimltempest/riml-ds-lint` の stylelint 設定で検査する。
 * stylelint は I/O を持つので、実行関数と設定は**引数で受け取る**（riml-ds-typescript §4）。
 */
import type { Result } from './result.js'
import { err, isRecord, ok, stringOr } from './result.js'

export type LintWarning = {
  readonly rule: string
  readonly text: string
  readonly line: number
  readonly severity: string
}

export type LintError = { readonly kind: 'stylelint-failed'; readonly message: string }

/** stylelint 本体と設定の解決は composition root（`src/stylelint-config.ts`）が閉じ込める */
export type LintDeps = {
  readonly lint: (source: string) => Promise<unknown>
}

const warningsOf = (result: unknown): readonly LintWarning[] => {
  if (!isRecord(result) || !Array.isArray(result['results'])) {
    return []
  }
  return result['results'].flatMap((entry: unknown) => {
    if (!isRecord(entry) || !Array.isArray(entry['warnings'])) {
      return []
    }
    return entry['warnings'].filter(isRecord).map((warning) => ({
      rule: stringOr(warning['rule'], ''),
      text: stringOr(warning['text'], ''),
      line: typeof warning['line'] === 'number' ? warning['line'] : 0,
      severity: stringOr(warning['severity'], 'error'),
    }))
  })
}

export const makeLintCss =
  (deps: LintDeps) =>
  async (source: string): Promise<Result<readonly LintWarning[], LintError>> => {
    try {
      const result = await deps.lint(source)
      return ok(warningsOf(result))
    } catch (error: unknown) {
      return err({
        kind: 'stylelint-failed',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
