/**
 * 公開パッケージの package.json の `workspace:` 指定を、実際の版範囲に書き換える。
 * **CI の publish の直前でだけ**実行する（.github/workflows/release.yml）。書き換えた
 * package.json はコミットしない（changesets の publish はタグしか作らない）。
 *
 *   bun scripts/prepare-publish.ts            書き換える
 *   bun scripts/prepare-publish.ts --dry-run  何が変わるかだけを表示する
 *
 * 手元で確かめたいときは `bun scripts/check-packed.ts`（書き換え → pack → 元に戻す）。
 */

import { writeFileSync } from 'node:fs'
import { relative } from 'node:path'

import { rewriteManifest } from './publish-manifest.ts'
import { readWorkspacePackages, repoRoot, versionTable } from './publishable.ts'

const dryRun = process.argv.includes('--dry-run')
const packages = readWorkspacePackages()
const versions = versionTable(packages)

let failed = false
for (const pkg of packages.filter((p) => !p.isPrivate)) {
  const result = rewriteManifest(pkg.manifest, versions)
  if (!result.ok) {
    console.error(`::error file=${relative(repoRoot, pkg.file)}::${result.error}`)
    failed = true
    continue
  }
  if (result.value.changes.length === 0) continue
  console.log(`${pkg.name}@${pkg.version}`)
  for (const change of result.value.changes) console.log(`  ${change}`)
  if (!dryRun) writeFileSync(pkg.file, `${JSON.stringify(result.value.manifest, null, 2)}\n`)
}

process.exit(failed ? 1 : 0)
