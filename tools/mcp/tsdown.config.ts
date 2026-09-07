import { defineConfig } from 'tsdown'

// ADR-0009: tsdown を使うのは tools/mcp（CLI）だけ。依存はバンドルしない（bunx が解決する）。
// private な @rimltempest/riml-ds-design-md だけは配布物に含める必要があるので取り込む。
// guidelines と DESIGN.md はどのパッケージにも属さないので dist/data/ に同梱する（ADR-0010）。
export default defineConfig({
  entry: ['src/cli.ts'],
  format: 'esm',
  platform: 'node',
  outDir: 'dist',
  shims: true,
  dts: false,
  // package.json は type: module。`bin` の指す名前を dist/cli.js に固定する
  outExtensions: () => ({ js: '.js' }),
  banner: { js: '#!/usr/bin/env node' },
  deps: {
    neverBundle: true,
    alwaysBundle: ['@rimltempest/riml-ds-design-md'],
  },
  copy: [
    { from: '../../system/guidelines/*.md', to: 'dist/data/guidelines' },
    { from: '../../DESIGN.md', to: 'dist/data' },
  ],
})
