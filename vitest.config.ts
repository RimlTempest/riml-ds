import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// docs/testing.md: ルート 1 つで projects を分ける（node / browser / react / storybook）。
// storybook project の root は `apps/storybook` になるので、パスは絶対で渡す。
const storybookDir = fileURLToPath(new URL('apps/storybook/.storybook/', import.meta.url))
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'tools/**/*.test.ts',
            'scripts/**/*.test.ts',
            // Storybook のモード表など、apps の純関数テストが拾われていなかった（plan 023）
            'apps/**/*.test.ts',
            'system/**/*.test.ts',
            'library/**/*.logic.test.ts',
            'library/elements/src/**/*.contract.test.ts',
            'library/elements/src/_shared/**/*.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      {
        // 依存の事前バンドルが実行中に走るとテストが再読み込みされるので、先に固定する
        optimizeDeps: { include: ['lit', '@guidepup/virtual-screen-reader'] },
        test: {
          name: 'browser',
          include: ['library/elements/src/**/*.test.ts', 'library/elements/test/**/*.test.ts'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.logic.test.ts',
            '**/*.contract.test.ts',
            'library/elements/src/_shared/**',
          ],
          browser: {
            enabled: true,
            headless: true,
            // 失敗時のスクリーンショットを src に書き出さない（生成物をコミットしない）
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          // React ラッパーは jsdom で回す。Lit の define も jsdom で動く
          name: 'react',
          environment: 'jsdom',
          include: ['library/react/test/**/*.test.tsx'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      {
        // story = テストケース（ADR-0007 決定 3）。addon-a11y の `test: 'error'` が
        // axe（AAA タグ込み）の違反をそのまま失敗にする。
        extends: true,
        plugins: [storybookTest({ configDir: storybookDir })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    passWithNoTests: false,
  },
})
