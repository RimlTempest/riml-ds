import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { makeLintCss } from '../src/core/lint.js'
import { elementExamples } from '../src/examples.js'
import { createServer } from '../src/server.js'
import { loadStylelintConfig } from '../src/stylelint-config.js'

const repoFile = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${name}`, import.meta.url)), 'utf8')

const repoJson = (name: string): unknown => JSON.parse(repoFile(name))

const deps = {
  tokens: repoJson('system/tokens/dist/tokens.json'),
  manifest: repoJson('library/elements/custom-elements.json'),
  examples: elementExamples,
  guidelines: {
    accessibility: repoFile('system/guidelines/accessibility.md'),
    'color-and-theming': repoFile('system/guidelines/color-and-theming.md'),
    'motion-and-responsive': repoFile('system/guidelines/motion-and-responsive.md'),
    writing: repoFile('system/guidelines/writing.md'),
  },
  designMd: repoFile('DESIGN.md'),
  lintCss: makeLintCss(loadStylelintConfig()),
}

let client: Client

beforeAll(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createServer(deps)
  client = new Client({ name: 'riml-ds-mcp-test', version: '0.1.0' })
  await server.connect(serverTransport)
  await client.connect(clientTransport)
})

const readText = (contents: readonly unknown[]): string => {
  const entry = contents[0]
  return typeof entry === 'object' && entry !== null && 'text' in entry ? String(entry.text) : ''
}

const textOf = (payload: unknown): string => {
  if (typeof payload !== 'object' || payload === null || !('content' in payload)) {
    return ''
  }
  const content = payload.content
  if (!Array.isArray(content)) {
    return ''
  }
  return content
    .map((part: unknown) =>
      typeof part === 'object' && part !== null && 'text' in part ? String(part.text) : '',
    )
    .join('\n')
}

describe('resources', () => {
  // docs/agent-integration.md の表がそのまま仕様。URI は公開 API（ADR-0010）
  it('docs の 6 種（固定 3 + テンプレート 3）をすべて公開する', async () => {
    const listed = await client.listResources()
    expect(listed.resources.map((resource) => resource.uri)).toEqual(
      expect.arrayContaining([
        'riml-ds://tokens',
        'riml-ds://elements',
        'riml-ds://design-md',
        'riml-ds://tokens/color.text.default',
        'riml-ds://elements/rd-button',
        'riml-ds://guidelines/accessibility',
      ]),
    )
    const templates = await client.listResourceTemplates()
    expect(templates.resourceTemplates.map((template) => template.uriTemplate).toSorted()).toEqual([
      'riml-ds://elements/{tag}',
      'riml-ds://guidelines/{topic}',
      'riml-ds://tokens/{path}',
    ])
  })

  it('riml-ds://elements/rd-button は PE ティアと契約の HTML 例を返す', async () => {
    const read = await client.readResource({ uri: 'riml-ds://elements/rd-button' })
    const text = readText(read.contents)
    expect(text).toContain('"pe": "A"')
    expect(text).toContain('<rd-button><button type=\\"submit\\">保存</button></rd-button>')
  })

  it('riml-ds://tokens/color.text.default は CSS 変数名とモード別の値を返す', async () => {
    const read = await client.readResource({ uri: 'riml-ds://tokens/color.text.default' })
    const text = readText(read.contents)
    expect(text).toContain('--rd-color-text-default')
    expect(text).toContain('"dark"')
  })

  it('riml-ds://guidelines/{topic} は Markdown をそのまま返す', async () => {
    const read = await client.readResource({ uri: 'riml-ds://guidelines/accessibility' })
    expect(readText(read.contents)).toBe(deps.guidelines.accessibility)
  })
})

describe('tools', () => {
  it('docs の 5 つの tool を公開する', async () => {
    const listed = await client.listTools()
    expect(listed.tools.map((tool) => tool.name).toSorted()).toEqual([
      'check_contrast',
      'get_element',
      'lint_css',
      'search_tokens',
      'suggest_component',
    ])
  })

  it('search_tokens は日本語の用途語から本文の色に辿り着く', async () => {
    const result = await client.callTool({ name: 'search_tokens', arguments: { query: '本文' } })
    expect(textOf(result)).toContain('color.text.default')
  })

  it('get_element は React の例を 2 種（RSC 版とクライアント版）返す', async () => {
    const result = await client.callTool({ name: 'get_element', arguments: { tag: 'rd-button' } })
    const text = textOf(result)
    expect(text).toContain('@rimltempest/riml-ds-react/client')
    expect(text).toContain('use client')
    expect(text).toContain('@rimltempest/riml-ds-vue')
  })

  it('check_contrast は本文 × 背景を AAA と判定する', async () => {
    const result = await client.callTool({
      name: 'check_contrast',
      arguments: { fg: 'color.text.default', bg: 'color.surface.default' },
    })
    expect(textOf(result)).toContain('"aaa": true')
  })

  it('suggest_component は「保存ボタン」に rd-button を返す', async () => {
    const result = await client.callTool({
      name: 'suggest_component',
      arguments: { intent: '保存ボタン' },
    })
    expect(textOf(result)).toContain('rd-button')
  })

  it('lint_css は生値を警告する', async () => {
    const result = await client.callTool({
      name: 'lint_css',
      arguments: { source: 'a { color: #fff; }' },
    })
    expect(textOf(result)).toContain('color-no-hex')
  })
})
