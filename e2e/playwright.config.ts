import { defineConfig } from '@playwright/test'

const STORYBOOK_PORT = 6007
const PE_PORT = 6008

/**
 * VRT・a11y・JS 無し（PE）の 3 系統。**スクリーンショットは Docker の中でだけ撮る**（ADR-0007 §影響）。
 * `snapshotPathTemplate` に OS 名を入れないので、ホストで撮るとベースラインを黙って上書きしてしまう。
 * だから `--update-snapshots` を通す口は `scripts/vrt.sh`（`docker run`）だけにし、
 * ホストから直接叩ける npm script は用意しない。
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: process.env['CI'] === 'true',
  reporter: [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' } },
  use: { baseURL: `http://localhost:${STORYBOOK_PORT}` },
  projects: [
    {
      name: 'vrt-light-360',
      testMatch: 'vrt/stories.spec.ts',
      use: { colorScheme: 'light', viewport: { width: 360, height: 640 } },
    },
    {
      name: 'vrt-light-1024',
      testMatch: 'vrt/stories.spec.ts',
      use: { colorScheme: 'light', viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'vrt-dark-360',
      testMatch: 'vrt/stories.spec.ts',
      use: { colorScheme: 'dark', viewport: { width: 360, height: 640 } },
    },
    {
      name: 'vrt-dark-1024',
      testMatch: 'vrt/stories.spec.ts',
      use: { colorScheme: 'dark', viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'forced-colors',
      testMatch: 'vrt/forced.spec.ts',
      use: { forcedColors: 'active', viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'reduced-motion',
      testMatch: 'vrt/reduced.spec.ts',
      use: { reducedMotion: 'reduce', viewport: { width: 1024, height: 768 } },
    },
    { name: 'a11y', testDir: 'a11y', use: { viewport: { width: 1024, height: 768 } } },
    {
      // ADR-0012 §7。ティア A は JS 無しで動き、ティア B は JS 無しで内容が見える
      name: 'pe',
      testDir: 'pe',
      testMatch: /tier-[abc]\.spec\.ts$/u,
      use: {
        javaScriptEnabled: false,
        baseURL: `http://localhost:${PE_PORT}`,
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      // axe はページに JS を注入して走るので `javaScriptEnabled: false` では動かない。
      // pe のページには `<script>` が 1 つも無い（build-pages.ts が保証）ため、
      // JS を有効にしても DOM は同じ ＝ 「JS 無しのときの DOM」を検査できる。
      name: 'pe-axe',
      testDir: 'pe',
      testMatch: /axe\.spec\.ts$/u,
      use: { baseURL: `http://localhost:${PE_PORT}`, viewport: { width: 1024, height: 768 } },
    },
  ],
  webServer: [
    {
      command: `bunx http-server ../apps/storybook/storybook-static -p ${STORYBOOK_PORT} -s`,
      port: STORYBOOK_PORT,
      reuseExistingServer: true,
    },
    {
      // ページは生成物（gitignore）。配る前に必ず作り直す
      command: `bun run pe/build-pages.ts && bunx http-server pe/pages -p ${PE_PORT} -s`,
      port: PE_PORT,
      reuseExistingServer: true,
    },
  ],
})
