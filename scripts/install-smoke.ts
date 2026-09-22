/**
 * 公開する tarball を、リポジトリの外の新しいプロジェクトに入れて使えるかを確かめる
 * （docs/publishing.md「公開物の smoke」）。0.2.0 / 0.3.0 は `workspace:*` が残っていて、
 * ここの `bun install` で `Workspace dependency ... not found` になった。
 *
 *   bun scripts/check-packed.ts --out .packed --version 0.0.0-smoke
 *   bun scripts/install-smoke.ts .packed
 *
 * `--version` で registry に無い版にするのは、既存の版（例: 壊れた 0.3.0）と同じ番号だと
 * bun が peer を registry の公開物で解決し、手元の tarball ではないものを検査してしまうため。
 *
 * 利用側の代表として rimltools（qrcc / noter）と同じ組み合わせを固定する:
 * bun（mise.toml）+ React 19.3 + Vite 8.3。確かめること:
 *   1. tarball だけを指定して依存が解決できる（registry の riml-ds には頼らない）
 *   2. サーバでの描画（renderToString）で `rd-*` の要素が出る
 *   3. Vite でブラウザ向けにビルドできる（'use client' の入口・define・CSS を含む）
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const REACT = '19.3.0'
const VITE = '8.3.0'
const PACKAGES = ['tokens', 'css', 'elements', 'react'] as const

const tarballDir = process.argv[2]
if (tarballDir === undefined) {
  console.error('usage: bun scripts/install-smoke.ts <dir with tarballs from check-packed.ts>')
  process.exit(2)
}
const dir = resolve(tarballDir)
const tarballs = readdirSync(dir).filter((f) => f.endsWith('.tgz'))

const tarballFor = (name: string): string | undefined => {
  const file = tarballs.find((f) => f.startsWith(`rimltempest-riml-ds-${name}-`))
  return file === undefined ? undefined : join(dir, file)
}

const riml: Record<string, string> = {}
for (const name of PACKAGES) {
  const tarball = tarballFor(name)
  if (tarball === undefined) {
    console.error(`::error::no tarball for @rimltempest/riml-ds-${name} in ${dir}`)
    process.exit(1)
  }
  riml[`@rimltempest/riml-ds-${name}`] = `file:${tarball}`
}

const project = mkdtempSync(join(tmpdir(), 'riml-ds-smoke-'))
const write = (file: string, content: string): void => writeFileSync(join(project, file), content)

const run = (step: string, cmd: string, args: string[]): boolean => {
  console.log(`==> ${step}`)
  const result = spawnSync(cmd, args, { cwd: project, stdio: 'inherit' })
  if (result.status === 0) return true
  console.error(`::error::install smoke failed at "${step}"`)
  return false
}

write(
  'package.json',
  `${JSON.stringify(
    {
      name: 'riml-ds-install-smoke',
      private: true,
      type: 'module',
      // overrides で riml-ds を tarball に固定してはいけない。依存指定を上書きするので、
      // tarball に `workspace:*` が残っていても通ってしまう（検査にならない）。代わりに
      // tarball は registry に無い版（check-packed.ts --version）で作り、取り違えを防ぐ
      dependencies: { react: REACT, 'react-dom': REACT, vite: VITE, ...riml },
    },
    null,
    2,
  )}\n`,
)

write(
  'ssr.mjs',
  `import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { RdButton } from '@rimltempest/riml-ds-react'

const html = renderToString(createElement(RdButton, { variant: 'primary' }, 'OK'))
if (!html.includes('<rd-button')) {
  console.error('renderToString did not emit <rd-button>:', html)
  process.exit(1)
}
console.log(html)
`,
)

write(
  'index.html',
  '<!doctype html><html lang="en"><body><div id="root"></div><script type="module" src="/main.js"></script></body></html>\n',
)
write(
  'main.js',
  `import '@rimltempest/riml-ds-tokens/tokens.css'
import '@rimltempest/riml-ds-css'
import '@rimltempest/riml-ds-elements/button/define'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { RdButton } from '@rimltempest/riml-ds-react/client'

createRoot(document.getElementById('root')).render(createElement(RdButton, null, 'OK'))
`,
)

let ok = false
try {
  ok =
    run('bun install (tarballs only)', 'bun', ['install'])
    && run('server render', 'bun', ['ssr.mjs'])
    && run('vite build', 'bunx', ['vite', 'build', '--logLevel', 'warn'])
} finally {
  rmSync(project, { recursive: true, force: true })
}

if (ok) console.log('install smoke: ok')
process.exit(ok ? 0 : 1)
