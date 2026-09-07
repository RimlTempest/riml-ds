/**
 * CLI: `library/elements/custom-elements.json` → `apps/storybook/.storybook/generated/argtypes.ts`。
 * 生成物（gitignore）。story は vite alias `@rd-argtypes` 経由で読む（elements から apps への相対 import を避ける）。
 * 判断は `core/argtypes.ts`（純関数）。ここは I/O と exit code だけ。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Package } from 'custom-elements-manifest/schema'
import { argTypesFor } from './core/argtypes.js'

const manifestPath = fileURLToPath(
  new URL('../../../library/elements/custom-elements.json', import.meta.url),
)
const outPath = fileURLToPath(
  new URL('../../../apps/storybook/.storybook/generated/argtypes.ts', import.meta.url),
)

const isPackage = (value: unknown): value is Package =>
  typeof value === 'object'
  && value !== null
  && 'modules' in value
  && Array.isArray(Reflect.get(value, 'modules'))

const tagNames = (manifest: Package): readonly string[] =>
  manifest.modules
    .flatMap((module) => module.declarations ?? [])
    .flatMap((declaration) => {
      const tag = Reflect.get(declaration, 'tagName')
      return Reflect.get(declaration, 'customElement') === true && typeof tag === 'string'
        ? [tag]
        : []
    })
    .toSorted()

const HEADER = `// 生成物: \`bun run gen\`。編集しない（正は library/elements の JSDoc → custom-elements.json）
// 型は apps/storybook/types/rd-argtypes.d.ts（'@rd-argtypes' の ambient 宣言）が持つ。
`

const main = async (): Promise<void> => {
  const raw: unknown = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!isPackage(raw)) {
    process.stderr.write(
      `argtypes: ${manifestPath} が CEM の形をしていない。先に \`bun run gen\` を通す\n`,
    )
    process.exitCode = 1
    return
  }
  const tags = tagNames(raw)
  const body = Object.fromEntries(tags.map((tag) => [tag, argTypesFor(raw, tag)]))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, `${HEADER}export const argTypes = ${JSON.stringify(body, null, 2)}\n`)
  process.stdout.write(
    `argtypes: ${tags.length} タグ → apps/storybook/.storybook/generated/argtypes.ts\n`,
  )
}

await main()
