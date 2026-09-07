/**
 * `src/<name>/<name>.css` を `dist/<name>/<name>.css` に配り、結合した `dist/styles.css` を作る。
 * `@import` は使わない（plan 003 の system/css と同じ方針。1 リクエストで全部品の見た目が揃う）。
 * ティア C（shadow 完結）の部品に `.css` は無い。
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const srcDir = fileURLToPath(new URL('../src', import.meta.url))
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
  `/* @rimltempest/riml-ds-elements ${version} — generated, do not edit */\n`

/** src 直下の部品ディレクトリのうち `<name>/<name>.css` を持つものを名前順に返す */
const componentsWithCss = async (): Promise<readonly string[]> => {
  const entries = await readdir(srcDir, { withFileTypes: true })
  const names = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .toSorted()
  const checked = await Promise.all(
    names.map(async (name) => ({
      name,
      hasCss: (await readdir(`${srcDir}/${name}`)).includes(`${name}.css`),
    })),
  )
  return checked.filter(({ hasCss }) => hasCss).map(({ name }) => name)
}

const main = async (): Promise<void> => {
  const version = await readVersion()
  const names = await componentsWithCss()
  const sources = await Promise.all(
    names.map(async (name) => ({
      name,
      css: await readFile(`${srcDir}/${name}/${name}.css`, 'utf8'),
    })),
  )
  await Promise.all(
    sources.map(({ name, css }) =>
      writeFile(`${distDir}/${name}/${name}.css`, `${banner(version)}${css}`),
    ),
  )
  await writeFile(
    `${distDir}/styles.css`,
    `${banner(version)}${sources.map(({ css }) => css).join('\n')}`,
  )
  process.stdout.write(`copy-css: dist/styles.css + ${sources.length} files\n`)
}

await main()
