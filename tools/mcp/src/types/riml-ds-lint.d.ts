/**
 * `@rimltempest/riml-ds-lint` は JS の設定ファイルを配る（型は JSDoc）。
 * TypeScript から読むための宣言。実体は tools/lint/stylelint.config.js。
 */
declare module '@rimltempest/riml-ds-lint/stylelint' {
  import type { Config } from 'stylelint'

  const config: Config
  export default config
}
