/**
 * `lint_css` の依存を組み立てる（composition root）。
 * stylelint の設定は `@rimltempest/riml-ds-lint/stylelint` が正。プラグインの相対パスを
 * 解決させるため `configBasedir` に設定ファイルの場所を渡す。
 */
import { fileURLToPath } from 'node:url'
import config from '@rimltempest/riml-ds-lint/stylelint'
import stylelint from 'stylelint'
import type { LintDeps } from './core/lint.js'

export const loadStylelintConfig = (): LintDeps => {
  const configBasedir = fileURLToPath(
    new URL('.', import.meta.resolve('@rimltempest/riml-ds-lint/stylelint')),
  )
  return {
    lint: (source: string) => stylelint.lint({ code: source, config, configBasedir }),
  }
}
