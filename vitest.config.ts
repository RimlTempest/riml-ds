import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// docs/testing.md: ルート 1 つで projects を分ける。storybook は plan 005 が足す。
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
    ],
    passWithNoTests: false,
  },
})
