import { defineConfig } from 'vitest/config'

/**
 * `.storybook/` の純関数（`modes.ts` の `themeStyle` など）だけを見る小さな Small テスト。
 *
 * ルートの `vitest.config.ts`（docs/testing.md）は `node` / `browser` / `react` / `storybook` の
 * 4 project を持つが、どれも `apps/**` を include していない（`storybook` project が読むのは story だけ）。
 * story にできない純関数をここで拾う。入口は `bun run --filter @rimltempest/riml-ds-storybook test`。
 */
export default defineConfig({
  test: {
    name: 'storybook-unit',
    environment: 'node',
    include: ['.storybook/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
