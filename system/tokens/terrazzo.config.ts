import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@terrazzo/cli'
import type { TokenNormalized } from '@terrazzo/parser'
import css from '@terrazzo/plugin-css'
import js from '@terrazzo/plugin-js'
import { contrastPairs } from './scripts/core/contrast-pairs.js'

const semanticColor: unknown = JSON.parse(
  readFileSync(fileURLToPath(new URL('./src/semantic/color.tokens.json', import.meta.url)), 'utf8'),
)

const pairs = contrastPairs(semanticColor)
if (!pairs.ok) {
  // 設定の組み立て（composition root）。ここは回復できないので落とす。
  throw new Error(`contrastPairs failed: ${JSON.stringify(pairs.error)}`)
}

const variableName = (token: TokenNormalized): string => `--rd-${token.id.replaceAll('.', '-')}`

const block = (selector: string, contents: string): string => `${selector} {\n${contents}\n}`
const media = (query: string, contents: string): string =>
  `@media ${query} {\n:root {\n${contents}\n}\n}`

// semantic のダーク値は postbuild が light-dark() に畳む。高コントラストも
// ライト/ダークの 2 通りを出して畳む（そうしないと dark × more で light の値が勝つ）。
export default defineConfig({
  tokens: ['./src/riml-ds.resolver.json'],
  outDir: './dist',
  plugins: [
    css({
      filename: 'tokens.raw.css',
      variableName,
      permutations: [
        { input: { scheme: 'light' }, prepare: (c) => block(':root', c) },
        { input: { scheme: 'dark' }, prepare: (c) => media('(prefers-color-scheme: dark)', c) },
        {
          input: { scheme: 'light', contrast: 'more' },
          prepare: (c) => media('(prefers-contrast: more)', c),
        },
        {
          input: { scheme: 'dark', contrast: 'more' },
          prepare: (c) => media('(prefers-contrast: more) and (prefers-color-scheme: dark)', c),
        },
        { input: { density: 'compact' }, prepare: (c) => block('[data-density="compact"]', c) },
        { input: { theme: 'qrcc' }, prepare: (c) => block('/* rd:theme qrcc */\n:root', c) },
        { input: { theme: 'noter' }, prepare: (c) => block('/* rd:theme noter */\n:root', c) },
      ],
    }),
    js({ filename: 'tokens.raw.js' }),
  ],
  lint: {
    rules: {
      'core/consistent-naming': ['error', { format: 'kebab-case' }],
      'core/descriptions': 'error',
      // 重複検査は base 層だけ。semantic は役割ごとの別名なので値が重なるのが正しい
      // （docs/tokens.md「error（base 層のみ。semantic の別名は許容）」）。
      'core/duplicate-values': [
        'error',
        {
          ignore: [
            'color.surface.*',
            'color.text.*',
            'color.border.*',
            'color.accent.*',
            'color.focus.*',
            'color.status.**',
            'space.*',
            'type.**',
            'radius.*',
            'focus.**',
            'shadow.*',
          ],
        },
      ],
      'a11y/min-contrast': ['error', { level: 'AAA', pairs: [...pairs.value] }],
      // type.small は 14px、type.mono は 15px を許す（system/guidelines/accessibility.md）。
      'a11y/min-font-size': ['error', { minSizeRem: 1, ignore: ['type.small', 'type.mono'] }],
    },
  },
})
