/**
 * スキップリンクは部品にしない（ADR-0012 §6）。JS が要らないので
 * `@rimltempest/riml-ds-css` の `.rd-skip-link`（`rd.utilities` 層）で配る。
 * この story は「Tab で現れ、Enter で本文へ飛ぶ」導線を e2e（`e2e/a11y/keyboard.spec.ts`）に渡すための面。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { expect, within } from 'storybook/test'

const meta: Meta = {
  title: 'Foundations/SkipLink',
  // 自分で <main> を持つので decorator のランドマークを外す
  parameters: { landmark: false },
  render: () =>
    html`<a class="rd-skip-link" href="#sb-main">本文へ</a>
      <main id="sb-main" tabindex="-1">
        <h1>本文</h1>
        <p>スキップリンクはここへ飛ぶ。</p>
      </main>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Tab / Enter の導線は `e2e/a11y/keyboard.spec.ts` が実キー入力で見る。
    // ここでフォーカスを動かすと、その e2e が「押す前の状態」から始められない。
    const link = within(canvasElement).getByRole('link', { name: '本文へ' })
    await expect(link).toHaveAttribute('href', '#sb-main')
    await expect(within(canvasElement).getByRole('heading', { name: '本文' })).toBeVisible()
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const ForcedColors: Story = {
  parameters: {
    landmark: false,
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。',
      },
    },
  },
}
