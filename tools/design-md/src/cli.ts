/**
 * DESIGN.md のフロントマターを `system/tokens/dist/tokens.json` から作り直す。
 * I/O と引数の解釈はここだけ（composition root）。写像は `src/core/*` の純関数。
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import { buildFrontmatter } from './core/frontmatter.js'
import { bodyOf, replaceFrontmatter } from './core/replace.js'

const repoFile = (name: string): string =>
  fileURLToPath(new URL(`../../../${name}`, import.meta.url))

const DESIGN_MD = repoFile('DESIGN.md')
const TOKENS_JSON = repoFile('system/tokens/dist/tokens.json')

const NAME = 'riml-ds'
const DESCRIPTION =
  'riml-ds の見た目の正。フロントマターは system/tokens から生成される（plan 002 以降）。本文は手書きで、system/guidelines/ の要約。矛盾したら guidelines が正。'

type Options = {
  readonly check: boolean
  readonly theme: string | undefined
}

const parseArgs = (argv: readonly string[]): Options => {
  const themeIndex = argv.indexOf('--theme')
  const theme = themeIndex === -1 ? undefined : argv[themeIndex + 1]
  return { check: argv.includes('--check'), theme }
}

const main = async (): Promise<number> => {
  const options = parseArgs(process.argv.slice(2))
  const tokens: unknown = JSON.parse(await readFile(TOKENS_JSON, 'utf8'))
  const markdown = await readFile(DESIGN_MD, 'utf8')

  const frontmatter = buildFrontmatter(tokens, {
    name: options.theme === undefined ? NAME : `${NAME}/${options.theme}`,
    description: DESCRIPTION,
    theme: options.theme,
  })
  if (!frontmatter.ok) {
    console.error('design-md: トークンを写せない', JSON.stringify(frontmatter.error))
    return 1
  }

  const yaml = stringify(frontmatter.value, {
    lineWidth: 0,
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  })
  const next = replaceFrontmatter(markdown, yaml)
  if (!next.ok) {
    console.error('design-md: DESIGN.md のフロントマターを読めない', JSON.stringify(next.error))
    return 1
  }

  const before = bodyOf(markdown)
  const after = bodyOf(next.value)
  if (!before.ok || !after.ok || before.value !== after.value) {
    console.error('design-md: 本文が変わってしまう。中止する')
    return 1
  }

  if (options.check) {
    if (next.value !== markdown) {
      console.error('design-md: DESIGN.md のフロントマターが古い。`bun run design-md` を実行する')
      return 1
    }
    return 0
  }

  if (next.value !== markdown) {
    await writeFile(DESIGN_MD, next.value, 'utf8')
  }
  return 0
}

process.exit(await main())
