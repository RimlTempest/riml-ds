/**
 * MCP サーバ（stdio）。resource / tool の名前と URI は `docs/agent-integration.md` の表が仕様で、
 * **公開 API**（変えるなら ADR-0010 の改訂）。生成物を読むだけで、ネットワークには出ない。
 * ファイルの読み込みは `cli.ts`（composition root）。ここは引数で受け取る。
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { ContrastMode } from './core/contrast.js'
import { checkContrast } from './core/contrast.js'
import type { ElementExampleMap } from './core/elements.js'
import { getElement, listElements } from './core/elements.js'
import type { LintError, LintWarning } from './core/lint.js'
import type { Result } from './core/result.js'
import { suggestComponent } from './core/suggest.js'
import type { TokenIndex } from './core/tokens.js'
import { getToken, loadTokens, searchTokens } from './core/tokens.js'

export type ServerDeps = {
  readonly tokens: unknown
  readonly manifest: unknown
  readonly examples: ElementExampleMap
  readonly guidelines: Readonly<Record<string, string>>
  readonly designMd: string
  readonly lintCss: (source: string) => Promise<Result<readonly LintWarning[], LintError>>
}

const EMPTY_INDEX: TokenIndex = { leaves: [], byPath: new Map() }

const json = (value: unknown): string => JSON.stringify(value, null, 2)

const text = (uri: string, body: string, mimeType: string) => ({
  contents: [{ uri, text: body, mimeType }],
})

const tool = (body: string, isError = false) => ({
  content: [{ type: 'text' as const, text: body }],
  isError,
})

/** `ResourceTemplate` の変数は `string | string[]`。1 本目だけを使う */
const first = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

export const createServer = (deps: ServerDeps): McpServer => {
  const loaded = loadTokens(deps.tokens)
  const index = loaded.ok ? loaded.value : EMPTY_INDEX
  const elements = listElements(deps.manifest)
  const tags = elements.ok ? elements.value.map((element) => element.tag) : []
  const topics = Object.keys(deps.guidelines)

  const server = new McpServer({ name: 'riml-ds', version: '0.1.0' })

  server.registerResource(
    'tokens',
    'riml-ds://tokens',
    {
      title: 'デザイントークン（解決済み DTCG）',
      description: 'system/tokens/dist/tokens.json をそのまま返す / The resolved DTCG token file',
      mimeType: 'application/json',
    },
    (uri) => text(uri.href, json(deps.tokens), 'application/json'),
  )

  server.registerResource(
    'token',
    new ResourceTemplate('riml-ds://tokens/{path}', {
      list: () => ({
        resources: index.leaves.map((leaf) => ({
          uri: `riml-ds://tokens/${leaf.path}`,
          name: leaf.path,
          description: leaf.description,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      title: '1 トークン',
      description:
        '値・説明・モードごとの値・CSS 変数名 / One token: value, description, per-mode values, CSS variable',
      mimeType: 'application/json',
    },
    (uri, variables) => {
      const path = first(variables['path'])
      const leaf = getToken(index, path)
      if (leaf === undefined) {
        throw new Error(`unknown token: ${path}`)
      }
      return text(uri.href, json(leaf), 'application/json')
    },
  )

  server.registerResource(
    'elements',
    'riml-ds://elements',
    {
      title: '部品一覧',
      description: '名前・status・PE ティア・要約 / Every element with status, PE tier and summary',
      mimeType: 'application/json',
    },
    (uri) =>
      text(uri.href, json(elements.ok ? elements.value : elements.error), 'application/json'),
  )

  server.registerResource(
    'element',
    new ResourceTemplate('riml-ds://elements/{tag}', {
      list: () => ({
        resources: tags.map((tag) => ({
          uri: `riml-ds://elements/${tag}`,
          name: tag,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      title: '1 部品（CEM）',
      description:
        '属性・イベント・slot・parts・CSS 変数・状態・使用例 / Attributes, events, slots, parts, CSS variables, states and examples',
      mimeType: 'application/json',
    },
    (uri, variables) => {
      const tag = first(variables['tag'])
      const element = getElement(deps.manifest, deps.examples, tag)
      if (!element.ok) {
        throw new Error(`unknown element: ${tag}`)
      }
      return text(uri.href, json(element.value), 'application/json')
    },
  )

  server.registerResource(
    'guidelines',
    new ResourceTemplate('riml-ds://guidelines/{topic}', {
      list: () => ({
        resources: topics.map((topic) => ({
          uri: `riml-ds://guidelines/${topic}`,
          name: topic,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    {
      title: 'ガイドライン',
      description: 'system/guidelines/<topic>.md / The hand-written guidelines',
      mimeType: 'text/markdown',
    },
    (uri, variables) => {
      const topic = first(variables['topic'])
      const markdown = deps.guidelines[topic]
      if (markdown === undefined) {
        throw new Error(`unknown guideline: ${topic}`)
      }
      return text(uri.href, markdown, 'text/markdown')
    },
  )

  server.registerResource(
    'design-md',
    'riml-ds://design-md',
    {
      title: 'DESIGN.md',
      description: '見た目の正（Google design.md 形式） / The design source of truth',
      mimeType: 'text/markdown',
    },
    (uri) => text(uri.href, deps.designMd, 'text/markdown'),
  )

  server.registerTool(
    'search_tokens',
    {
      title: 'トークンを探す',
      description:
        '名前・説明・日本語の用途語からトークンを引く（「本文の色」→ color.text.default） / Find tokens by name, description or Japanese wording',
      inputSchema: { query: z.string().describe('探したい用途か名前。例: 本文の色 / surface') },
    },
    ({ query }) => tool(json(searchTokens(index, query))),
  )

  server.registerTool(
    'get_element',
    {
      title: '部品の API と使用例',
      description:
        'CEM の 1 部品 + フレームワーク別の使用例（React は RSC 版とクライアント版の 2 つ） / One element with framework examples',
      inputSchema: { tag: z.string().describe('部品のタグ名。例: rd-button') },
    },
    ({ tag }) => {
      const element = getElement(deps.manifest, deps.examples, tag)
      return element.ok ? tool(json(element.value)) : tool(json(element.error), true)
    },
  )

  server.registerTool(
    'check_contrast',
    {
      title: 'コントラスト比を測る',
      description:
        'トークン名か生の色で WCAG 2.1 のコントラスト比と AA / AAA を判定する / Contrast ratio and AA / AAA for tokens or raw colors',
      inputSchema: {
        fg: z.string().describe('前景。トークン名（color.text.default）か色（#000）'),
        bg: z.string().describe('背景。トークン名か色'),
        mode: z.enum(['light', 'dark']).optional().describe('配色モード。既定は light'),
      },
    },
    ({ fg, bg, mode }) => {
      const options: { mode?: ContrastMode } = mode === undefined ? {} : { mode }
      const report = checkContrast(index, fg, bg, options)
      return report.ok ? tool(json(report.value)) : tool(json(report.error), true)
    },
  )

  server.registerTool(
    'suggest_component',
    {
      title: '用途から部品を選ぶ',
      description:
        '用途文に合う部品と理由を返す。LLM は使わず CEM の要約と guidelines の見出しで照合する / Suggest elements for an intent (no LLM)',
      inputSchema: { intent: z.string().describe('やりたいこと。例: 保存ボタン') },
    },
    ({ intent }) => {
      const outcome = suggestComponent(deps.manifest, deps.guidelines, intent)
      return outcome.ok ? tool(json(outcome.value)) : tool(json(outcome.error), true)
    },
  )

  server.registerTool(
    'lint_css',
    {
      title: 'CSS を検査する',
      description:
        '@rimltempest/riml-ds-lint の stylelint 設定で CSS 文字列を検査する（生値・物理プロパティ・重い指定） / Lint a CSS string with the riml-ds stylelint config',
      inputSchema: { source: z.string().describe('検査したい CSS') },
    },
    async ({ source }) => {
      const result = await deps.lintCss(source)
      return result.ok ? tool(json(result.value)) : tool(json(result.error), true)
    },
  )

  return server
}
