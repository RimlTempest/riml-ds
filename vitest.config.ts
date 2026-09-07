import { defineConfig } from 'vitest/config'

// docs/testing.md: ルート 1 つで projects を分ける。browser / storybook は plan 004 / 005 が足す。
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
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
    ],
    passWithNoTests: false,
  },
})
