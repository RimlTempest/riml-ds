/**
 * `bunx @rimltempest/riml-ds-mcp` の入口（composition root）。
 * ファイル読み込みと引数の解釈はここだけ。resource / tool の中身は `server.ts` と `core/`。
 * 同梱データは publish 時点のスナップショットで、実行時にネットワークへは出ない（ADR-0010）。
 */
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { makeLintCss } from './core/lint.js'
import { elementExamples } from './examples.js'
import type { ServerDeps } from './server.js'
import { createServer } from './server.js'
import { loadStylelintConfig } from './stylelint-config.js'

const USAGE = `riml-ds-mcp — riml-ds のエージェント向けの面

  riml-ds-mcp                              MCP サーバ（stdio）を起動する
  riml-ds-mcp design-md [--theme <brand>]  DESIGN.md を作って stdout に出す
                        [--out <file>]     ファイルに書く
  riml-ds-mcp --help                       この使い方

resource / tool の一覧は docs/agent-integration.md（riml-ds://tokens、riml-ds://elements、
riml-ds://guidelines/{topic} ほか。tool は search_tokens / get_element / check_contrast /
suggest_component / lint_css）。`

/** publish された dist/data/ と、リポジトリの中から直接動かす場合の両方を見る */
const bundledData = new URL('./data/', import.meta.url)
const repoRoot = new URL('../../../', import.meta.url)
const isBundled = existsSync(fileURLToPath(new URL('DESIGN.md', bundledData)))

export const designMdUrl = isBundled
  ? new URL('DESIGN.md', bundledData)
  : new URL('DESIGN.md', repoRoot)
const guidelinesUrl = isBundled
  ? new URL('guidelines/', bundledData)
  : new URL('system/guidelines/', repoRoot)

const packageFile = (specifier: string): string => fileURLToPath(import.meta.resolve(specifier))

const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, 'utf8'))

const readGuidelines = async (): Promise<Record<string, string>> => {
  const entries = await readdir(guidelinesUrl)
  const topics = entries.filter((name) => name.endsWith('.md'))
  const pairs = await Promise.all(
    topics.map(async (name) => {
      const markdown = await readFile(new URL(name, guidelinesUrl), 'utf8')
      return [name.slice(0, -'.md'.length), markdown] as const
    }),
  )
  return Object.fromEntries(pairs)
}

const loadDeps = async (): Promise<ServerDeps> => ({
  tokens: await readJson(packageFile('@rimltempest/riml-ds-tokens/tokens.json')),
  manifest: await readJson(packageFile('@rimltempest/riml-ds-elements/custom-elements.json')),
  examples: elementExamples,
  guidelines: await readGuidelines(),
  designMd: await readFile(designMdUrl, 'utf8'),
  lintCss: makeLintCss(loadStylelintConfig()),
})

const command = process.argv[2]

if (command === '--help' || command === '-h' || command === 'help') {
  console.log(USAGE)
  process.exit(0)
} else if (command !== undefined && !command.startsWith('-')) {
  console.error(`riml-ds-mcp: 知らないサブコマンド: ${command}\n`)
  console.error(USAGE)
  process.exit(1)
} else {
  const server = createServer(await loadDeps())
  await server.connect(new StdioServerTransport())
}
