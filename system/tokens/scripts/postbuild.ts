/**
 * Terrazzo の生成物（`dist/tokens.raw.*`）を配布物に畳む。
 * I/O はこのファイルだけ。変換は `scripts/core/*` の純関数（Result を返す）。
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { emitJson, emitMd, emitTs } from './core/emit.js'
import { collectFluid, fluidTypography } from './core/fluid-typography.js'
import { foldLightDark } from './core/fold-light-dark.js'
import { splitThemes } from './core/split-themes.js'
import type { TokenSet } from './core/token-set.js'
import { parseTokenSet } from './core/token-set.js'

const dist = (name: string): string => fileURLToPath(new URL(`../dist/${name}`, import.meta.url))
const src = (name: string): string => fileURLToPath(new URL(`../src/${name}`, import.meta.url))

const fail = (message: string, detail: unknown): never => {
  console.error(`postbuild: ${message}`, JSON.stringify(detail))
  process.exit(1)
}

const permutationKey = (input: Record<string, string>): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(input).toSorted(([a], [b]) => a.localeCompare(b, 'en-us', { numeric: true })),
    ),
  )

const DEFAULTS = { theme: 'riml-ds', scheme: 'light', contrast: 'normal', density: 'default' }

const main = async (): Promise<void> => {
  const rawCss = await readFile(dist('tokens.raw.css'), 'utf8')
  const rawModule: unknown = await import(dist('tokens.raw.js'))
  const permutations =
    typeof rawModule === 'object' && rawModule !== null && 'PERMUTATIONS' in rawModule
      ? rawModule['PERMUTATIONS']
      : undefined
  if (typeof permutations !== 'object' || permutations === null) {
    return fail('tokens.raw.js に PERMUTATIONS がない', typeof permutations)
  }

  const setFor = (input: Record<string, string>): TokenSet => {
    const raw = Object.entries(permutations).find(
      ([id]) => id === permutationKey({ ...DEFAULTS, ...input }),
    )?.[1]
    const parsed = parseTokenSet(raw)
    if (!parsed.ok) {
      return fail('permutation を読めない', { input, error: parsed.error })
    }
    return parsed.value
  }

  const light = setFor({})
  const modes = new Map<string, TokenSet>([
    ['dark', setFor({ scheme: 'dark' })],
    ['more', setFor({ contrast: 'more' })],
    ['more-dark', setFor({ scheme: 'dark', contrast: 'more' })],
    ['compact', setFor({ density: 'compact' })],
  ])

  const semanticTypography: unknown = JSON.parse(
    await readFile(src('semantic/typography.tokens.json'), 'utf8'),
  )
  const clamps = collectFluid(semanticTypography)
  if (!clamps.ok) {
    return fail('fluid 拡張を読めない', clamps.error)
  }

  const folded = foldLightDark(rawCss)
  if (!folded.ok) {
    return fail('light-dark() に畳めない', folded.error)
  }
  await writeFile(dist('tokens.css'), fluidTypography(folded.value, clamps.value), 'utf8')

  const themes = splitThemes(rawCss)
  if (!themes.ok) {
    return fail('テーマを切り出せない', themes.error)
  }
  await mkdir(dist('themes'), { recursive: true })
  await Promise.all(
    themes.value.map((theme) =>
      writeFile(dist(`themes/${theme.name}.css`), fluidTypography(theme.css, clamps.value), 'utf8'),
    ),
  )

  const ts = emitTs(light)
  if (!ts.ok) {
    return fail('tokens.js を作れない', ts.error)
  }
  await writeFile(dist('tokens.js'), ts.value.js, 'utf8')
  await writeFile(dist('tokens.d.ts'), ts.value.dts, 'utf8')

  const json = emitJson(light, modes)
  if (!json.ok) {
    return fail('tokens.json を作れない', json.error)
  }
  await writeFile(dist('tokens.json'), json.value, 'utf8')

  const darkSet = modes.get('dark')
  const md = emitMd(light, darkSet ?? light)
  if (!md.ok) {
    return fail('tokens.md を作れない', md.error)
  }
  await writeFile(dist('tokens.md'), md.value, 'utf8')

  await Promise.all(
    ['tokens.raw.css', 'tokens.raw.js', 'tokens.raw.d.ts'].map((name) =>
      rm(dist(name), { force: true }),
    ),
  )
  process.stdout.write(
    'postbuild: tokens.css / tokens.js / tokens.d.ts / tokens.json / tokens.md / themes/*.css\n',
  )
}

await main()
