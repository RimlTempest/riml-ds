/**
 * CLI: `library/elements/custom-elements.json` + `library/elements/dist/<name>/index.js` の契約
 * -> `library/{react,vue,svelte,astro}/src/generated/**`。
 *
 * 判断は `core/*`（純関数）。ここは I/O と exit code だけ。契約は**ビルド済みの dist** から読む
 * （ADR-0002：CEM と生成物が API の正。`src/` は読まない）。
 * 内容が変わったファイルだけ書き、消えた生成物は消す（`bun run gen` を冪等にする）。
 */
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Package } from 'custom-elements-manifest/schema'
import type { Contract, WrapperSpec } from './core/common.js'
import { toWrapperSpecs } from './core/common.js'
import { astroFiles } from './core/astro.js'
import type { GeneratedFile } from './core/react.js'
import { reactFiles } from './core/react.js'
import { svelteFiles } from './core/svelte.js'
import { vueFiles } from './core/vue.js'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const manifestPath = join(root, 'library/elements/custom-elements.json')
const elementsDist = join(root, 'library/elements/dist')

const isPackage = (value: unknown): value is Package =>
  typeof value === 'object'
  && value !== null
  && 'modules' in value
  && Array.isArray(Reflect.get(value, 'modules'))

const isContract = (value: unknown): value is Contract =>
  typeof value === 'object'
  && value !== null
  && 'pe' in value
  && 'roles' in value
  && 'required' in value
  && 'tree' in value

/** `rd-text-field` の部品名 `text-field` -> 契約の export 名 `textFieldContract` */
const contractExport = (name: string): string => {
  const [head = '', ...rest] = name.split('-')
  return `${head}${rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')}Contract`
}

const tagsInManifest = (manifest: Package): readonly string[] =>
  manifest.modules.flatMap((module) =>
    (module.declarations ?? []).flatMap((declaration) => {
      const tag = Reflect.get(declaration, 'tagName')
      return typeof tag === 'string' && tag !== '' ? [tag] : []
    }),
  )

const loadContracts = async (manifest: Package): Promise<Readonly<Record<string, Contract>>> => {
  const entries = await Promise.all(
    tagsInManifest(manifest).map(async (tag) => {
      const name = tag.startsWith('rd-') ? tag.slice(3) : tag
      const entry = join(elementsDist, name, 'index.js')
      const found = await stat(entry).catch(() => undefined)
      if (found === undefined) {
        return []
      }
      const module: unknown = await import(pathToFileURL(entry).href)
      const value =
        typeof module === 'object' && module !== null
          ? Reflect.get(module, contractExport(name))
          : undefined
      return isContract(value) ? [[name, value] as const] : []
    }),
  )
  return Object.fromEntries(entries.flat())
}

const listFiles = async (dir: string): Promise<readonly string[]> => {
  const found = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => [])
  return found
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
}

/** 内容が変わったものだけ書き、余った生成物を消す。戻り値は書いた数 */
const sync = async (dir: string, files: readonly GeneratedFile[]): Promise<number> => {
  const existing = await listFiles(dir)
  const wanted = new Set(files.map((file) => file.path))
  await Promise.all(
    existing
      .filter((path) => !wanted.has(path))
      .map(async (path) => rm(join(dir, path), { force: true })),
  )
  const written = await Promise.all(
    files.map(async (file) => {
      const target = join(dir, file.path)
      const current = await readFile(target, 'utf8').catch(() => undefined)
      if (current === file.content) {
        return 0
      }
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, file.content)
      return 1
    }),
  )
  return written.reduce<number>((total, count) => total + count, 0)
}

const generators: readonly (readonly [
  string,
  (specs: readonly WrapperSpec[]) => readonly GeneratedFile[],
])[] = [
  ['react', reactFiles],
  ['vue', vueFiles],
  ['svelte', svelteFiles],
  ['astro', astroFiles],
]

const main = async (): Promise<void> => {
  const raw: unknown = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!isPackage(raw)) {
    process.stderr.write(
      `wrappers: ${manifestPath} が CEM の形をしていない。先に \`bun run gen\` を通す\n`,
    )
    process.exitCode = 1
    return
  }
  const contracts = await loadContracts(raw)
  const specs = toWrapperSpecs(raw, contracts)
  if (specs.length === 0) {
    process.stderr.write('wrappers: 部品が 1 つも見つからない\n')
    process.exitCode = 1
    return
  }
  for (const [framework, generate] of generators) {
    const dir = join(root, 'library', framework, 'src/generated')
    const files = generate(specs)
    // eslint-disable-next-line no-await-in-loop -- 4 つだけ。順に書いてログを読みやすくする
    const written = await sync(dir, files)
    process.stdout.write(
      `wrappers: ${framework} ${files.length} ファイル（更新 ${written}）-> library/${framework}/src/generated\n`,
    )
  }
}

await main()
