/**
 * 公開する tarball を実際に作り、中の package.json に `workspace:` / `link:` / `file:` /
 * `catalog:` が残っていないかを確かめる（ADR-0009 のゲート。release:check と CI で実行）。
 *
 * publish と同じ手順で作る: package.json を scripts/prepare-publish.ts と同じ規則で書き換え
 * → `npm pack` → **必ず元に戻す**。手元で実行しても作業ツリーは変わらない。
 *
 *   bun scripts/check-packed.ts                 検査だけ
 *   bun scripts/check-packed.ts --out .packed   tarball を残す（scripts/install-smoke.ts が使う）
 *   ... --version 0.0.0-smoke                   全公開パッケージをこの版として pack する（smoke 用。
 *                                               registry の既存版と取り違えないため。publish では使わない）
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

import { findLocalProtocolSpecs, packedFileName, rewriteManifest } from './publish-manifest.ts'
import { readWorkspacePackages, repoRoot, versionTable } from './publishable.ts'

const outIndex = process.argv.indexOf('--out')
const outArg = outIndex === -1 ? undefined : process.argv[outIndex + 1]
const outDir = outArg === undefined ? undefined : resolve(outArg)
if (outDir !== undefined) mkdirSync(outDir, { recursive: true })

const versionIndex = process.argv.indexOf('--version')
const versionOverride = versionIndex === -1 ? undefined : process.argv[versionIndex + 1]

const packages = readWorkspacePackages()
const versions = versionTable(packages)
if (versionOverride !== undefined) {
  for (const pkg of packages.filter((p) => !p.isPrivate)) versions.set(pkg.name, versionOverride)
}
const workDir = mkdtempSync(join(tmpdir(), 'riml-ds-pack-'))

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

let failed = false
const fail = (file: string, message: string): void => {
  console.error(`::error file=${relative(repoRoot, file)}::${message}`)
  failed = true
}

try {
  for (const pkg of packages.filter((p) => !p.isPrivate)) {
    const manifest =
      versionOverride === undefined ? pkg.manifest : { ...pkg.manifest, version: versionOverride }
    const rewritten = rewriteManifest(manifest, versions)
    if (!rewritten.ok) {
      fail(pkg.file, rewritten.error)
      continue
    }

    writeFileSync(pkg.file, `${JSON.stringify(rewritten.value.manifest, null, 2)}\n`)
    let pack: ReturnType<typeof spawnSync>
    try {
      pack = spawnSync('npm', ['pack', '--json', '--pack-destination', workDir], {
        cwd: pkg.dir,
        encoding: 'utf8',
      })
    } finally {
      // 何があっても元の package.json に戻す（手元の作業ツリーを変えない）
      writeFileSync(pkg.file, pkg.text)
    }

    const stdout = typeof pack.stdout === 'string' ? pack.stdout : ''
    const fileName = pack.status === 0 ? packedFileName(stdout) : undefined
    if (fileName === undefined) {
      fail(pkg.file, `npm pack failed: ${String(pack.stderr)}`)
      continue
    }
    const tarball = join(workDir, fileName)

    const extracted = spawnSync('tar', ['-xzOf', tarball, 'package/package.json'], {
      encoding: 'utf8',
    })
    const packed: unknown = extracted.status === 0 ? JSON.parse(extracted.stdout) : undefined
    if (!isRecord(packed)) {
      fail(pkg.file, `could not read package.json from ${fileName}`)
      continue
    }
    const leftovers = findLocalProtocolSpecs(packed)
    if (leftovers.length > 0) {
      fail(pkg.file, `${fileName} still has local protocols: ${leftovers.join(', ')}`)
      continue
    }
    console.log(`ok ${fileName}`)
    if (outDir !== undefined) copyFileSync(tarball, join(outDir, fileName))
  }
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

process.exit(failed ? 1 : 0)
