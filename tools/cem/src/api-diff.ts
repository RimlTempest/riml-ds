/**
 * CLI: 2 つの CEM を比べ、破壊的変更に見合う `.changeset` があるかを検査する（ADR-0009）。
 *
 *   bun run tools/cem/src/api-diff.ts <base.json> <head.json> [--changesets .changeset]
 *
 * 判断は `core/api-diff.ts`（純関数）。ここは I/O と exit code、GitHub Actions の注釈だけ。
 * 破壊的変更があるのに major（`0.x` の間は minor でも可）の changeset が無ければ exit 1。
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Package } from 'custom-elements-manifest/schema'
import {
  type Bump,
  describeBreaking,
  diffManifests,
  missingChangeset,
  parseChangesetBumps,
} from './core/api-diff.js'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const elementsPackageJson = join(repoRoot, 'library/elements/package.json')

const isPackage = (value: unknown): value is Package =>
  typeof value === 'object'
  && value !== null
  && 'modules' in value
  && Array.isArray(Reflect.get(value, 'modules'))

const readManifest = async (path: string): Promise<Package | undefined> => {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'))
  return isPackage(raw) ? raw : undefined
}

const readBumps = async (dir: string): Promise<readonly Bump[]> => {
  const entries = await readdir(dir).catch(() => [])
  const files = entries.filter((name) => name.endsWith('.md') && name !== 'README.md')
  const sources = await Promise.all(files.map((name) => readFile(join(dir, name), 'utf8')))
  return sources.flatMap(parseChangesetBumps)
}

/** `0.x` の間は minor が major 扱い（ADR-0009）。版はすべて fixed なので elements を代表にする */
const readZeroMajor = async (): Promise<boolean> => {
  const raw: unknown = JSON.parse(await readFile(elementsPackageJson, 'utf8'))
  const version = typeof raw === 'object' && raw !== null ? Reflect.get(raw, 'version') : undefined
  return typeof version === 'string' && version.startsWith('0.')
}

type Args = { readonly positional: readonly string[]; readonly changesets: string | undefined }

const parseArgs = (argv: readonly string[]): Args => {
  const positional: string[] = []
  const changesets: string[] = []
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? ''
    if (arg === '--changesets') {
      changesets.push(argv[index + 1] ?? '')
      index += 1
      continue
    }
    positional.push(arg)
  }
  return { positional, changesets: changesets.at(-1) }
}

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2))
  const [basePath, headPath] = args.positional
  if (basePath === undefined || headPath === undefined) {
    process.stderr.write(
      'usage: bun run tools/cem/src/api-diff.ts <base.json> <head.json> [--changesets .changeset]\n',
    )
    process.exitCode = 2
    return
  }

  const base = await readManifest(basePath)
  const head = await readManifest(headPath)
  if (base === undefined || head === undefined) {
    process.stderr.write(
      `api-diff: CEM の形をしていない: ${base === undefined ? basePath : headPath}\n`,
    )
    process.exitCode = 2
    return
  }

  const { breaking, additions } = diffManifests(base, head)
  for (const line of additions) {
    process.stdout.write(`api-diff: 追加 — ${line}\n`)
  }
  if (breaking.length === 0) {
    process.stdout.write('api-diff: 破壊的変更なし\n')
    return
  }

  const changesetsDir = args.changesets ?? join(repoRoot, '.changeset')
  const bumps = await readBumps(changesetsDir)
  const zeroMajor = await readZeroMajor()
  const required = zeroMajor ? 'minor' : 'major'

  if (!missingChangeset({ breaking, bumps, zeroMajor })) {
    for (const change of breaking) {
      process.stdout.write(`api-diff: 破壊的変更 — ${describeBreaking(change)}\n`)
    }
    process.stdout.write(`api-diff: ${required} の changeset があるので通す\n`)
    return
  }

  for (const change of breaking) {
    process.stderr.write(`::error::api-diff: ${describeBreaking(change)}\n`)
  }
  process.stderr.write(
    `::error::api-diff: 破壊的変更が ${breaking.length} 件あるが ${required} の changeset が無い。`
      + '`bun run changeset` で追加するか、変更を後方互換にする（ADR-0009 / .claude/skills/riml-ds-release）\n',
  )
  process.exitCode = 1
}

await main()
