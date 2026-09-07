/**
 * CLI: `library/elements/custom-elements.json` → `tools/cem/registry.json`。
 * 生成物だがコミットする（PR で差分をレビューする。ADR-0002 の「CEM が API の正」を索引にしたもの）。
 * 判断は `core/registry.ts`（純関数）。ここは I/O と exit code だけ。
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Package } from 'custom-elements-manifest/schema'
import { buildRegistry } from './core/registry.js'

const manifestPath = fileURLToPath(
  new URL('../../../library/elements/custom-elements.json', import.meta.url),
)
const registryPath = fileURLToPath(new URL('../registry.json', import.meta.url))

const isPackage = (value: unknown): value is Package =>
  typeof value === 'object'
  && value !== null
  && 'modules' in value
  && Array.isArray(Reflect.get(value, 'modules'))

const main = async (): Promise<void> => {
  const raw: unknown = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!isPackage(raw)) {
    process.stderr.write(
      `registry: ${manifestPath} が CEM の形をしていない。先に \`bun run gen\` を通す\n`,
    )
    process.exitCode = 1
    return
  }
  const registry = buildRegistry(raw)
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
  process.stdout.write(`registry: ${registry.length} 部品 → tools/cem/registry.json\n`)
}

await main()
