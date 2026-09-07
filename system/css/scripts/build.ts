/**
 * `src/*.css` をそのまま `dist/` に配り、結合した `dist/index.css` を作る。
 * PostCSS は挟まない（ADR-0004: 配るのは書いたままの CSS）。
 * `tokens.css` は含めない（利用側が `@rimltempest/riml-ds-tokens/tokens.css` を別に読む）。
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** 結合の順序。@layer の宣言が必ず先頭に来る */
const ORDER = [
  'layers',
  'reset',
  'base',
  'patterns',
  'utilities',
  'print',
  'forced-colors',
] as const

const srcPath = (name: string): string =>
  fileURLToPath(new URL(`../src/${name}.css`, import.meta.url))
const distPath = (name: string): string =>
  fileURLToPath(new URL(`../dist/${name}.css`, import.meta.url))
const distDir = fileURLToPath(new URL('../dist', import.meta.url))
const packageJson = fileURLToPath(new URL('../package.json', import.meta.url))

const readVersion = async (): Promise<string> => {
  const parsed: unknown = JSON.parse(await readFile(packageJson, 'utf8'))
  if (
    typeof parsed === 'object'
    && parsed !== null
    && 'version' in parsed
    && typeof parsed.version === 'string'
  ) {
    return parsed.version
  }
  return '0.0.0'
}

const banner = (version: string): string =>
  `/* @rimltempest/riml-ds-css ${version} — generated, do not edit */\n`

const main = async (): Promise<void> => {
  const version = await readVersion()
  const sources = await Promise.all(
    ORDER.map(async (name) => ({ name, css: await readFile(srcPath(name), 'utf8') })),
  )

  await rm(distDir, { recursive: true, force: true })
  await mkdir(distDir, { recursive: true })
  await Promise.all(
    sources.map(({ name, css }) => writeFile(distPath(name), `${banner(version)}${css}`)),
  )
  await writeFile(
    distPath('index'),
    `${banner(version)}${sources.map(({ css }) => css).join('\n')}`,
  )

  process.stdout.write(`build: dist/index.css + ${ORDER.length} files\n`)
}

await main()
