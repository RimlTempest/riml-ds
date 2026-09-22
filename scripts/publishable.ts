/**
 * 公開パッケージの一覧（`private: true` が無い package.json）と、全パッケージの版の表。
 * scripts/release-check.sh と同じ探し方（system / library / tools / apps の深さ 2 まで）。
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Manifest } from './publish-manifest.ts'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export type WorkspacePackage = {
  readonly dir: string
  readonly file: string
  readonly name: string
  readonly version: string
  readonly isPrivate: boolean
  readonly text: string
  readonly manifest: Manifest
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const readWorkspacePackages = (): WorkspacePackage[] => {
  const glob = new Bun.Glob('{system,library,tools,apps}/*/package.json')
  return [...glob.scanSync({ cwd: repoRoot })]
    .filter((relative) => !relative.includes('node_modules'))
    .toSorted((a, b) => a.localeCompare(b))
    .flatMap((relative): WorkspacePackage[] => {
      const file = join(repoRoot, relative)
      const text = readFileSync(file, 'utf8')
      const parsed: unknown = JSON.parse(text)
      if (!isRecord(parsed)) return []
      const { name, version } = parsed
      if (typeof name !== 'string' || typeof version !== 'string') return []
      return [
        {
          dir: dirname(file),
          file,
          name,
          version,
          isPrivate: parsed['private'] === true,
          text,
          manifest: parsed,
        },
      ]
    })
}

export const versionTable = (packages: readonly WorkspacePackage[]): Map<string, string> =>
  new Map(packages.map((p) => [p.name, p.version]))
