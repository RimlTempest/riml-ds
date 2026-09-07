/**
 * フレームワーク別 e2e（plan 006）。plan 005 の `e2e/playwright.config.ts` とは別ファイルにする。
 * dev サーバではなく**ビルド成果**を配る（利用側が本番で読むものと同じ）。
 */
import { defineConfig, devices } from '@playwright/test'

const apps = [
  { name: 'react', port: 6011 },
  { name: 'vue', port: 6012 },
  { name: 'svelte', port: 6013 },
  { name: 'astro', port: 6014 },
] as const

export default defineConfig({
  testDir: 'frameworks',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] === undefined ? 0 : 1,
  reporter: process.env['CI'] === undefined ? 'list' : 'github',
  projects: apps.map((app) => ({
    name: app.name,
    testMatch: `${app.name}.spec.ts`,
    use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${app.port}` },
  })),
  webServer: apps.map((app) => ({
    command: `bun run --filter e2e-${app.name} build && bunx http-server e2e/${app.name}/dist -p ${app.port} --silent -c-1`,
    url: `http://127.0.0.1:${app.port}/index.html`,
    cwd: '..',
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 180_000,
  })),
})
