import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/web-components-vite'
import type { AliasOptions } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * 唯一のショーケース（ADR-0007 決定 1）。story は `library/elements/src` に置き、
 * Foundations だけ `apps/storybook/stories` に置く。
 *
 * alias は 2 つだけ：
 * - `@rd-argtypes` → CEM から生成した `argTypes`（`bun run gen`）。
 *   elements 側から apps への相対 import を書かないため。
 * - `@rd-shadow` → shadow 内を見る小さなヘルパ（ティア B/C の play で使う）。
 */
/** vite の alias は配列でも書けるが、riml-ds は object 形しか使わない。配列なら畳まずに捨てる */
const objectAlias = (alias: AliasOptions | undefined): Record<string, string> =>
  alias === undefined || Array.isArray(alias) ? {} : alias

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: [
    '../../../library/elements/src/**/*.stories.ts',
    '../stories/**/*.mdx',
    '../stories/**/*.stories.ts',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  core: { disableTelemetry: true },
  docs: { defaultName: 'Docs' },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...objectAlias(viteConfig.resolve?.alias),
        '@rd-argtypes': join(here, 'generated/argtypes.ts'),
        '@rd-shadow': join(here, 'shadow.ts'),
      },
    },
    server: { ...viteConfig.server, fs: { allow: [resolve(here, '../../..')] } },
  }),
}

// oxlint-disable-next-line import/no-default-export -- Storybook の設定は default export でしか読まれない
export default config
