/**
 * スキップリンクは部品にしない（ADR-0012 §6）。JS が要らないので
 * `@rimltempest/riml-ds-css` の `.rd-skip-link`（`rd.utilities` 層）で配る。
 * この story は「Tab で現れ、Enter で本文へ飛ぶ」導線を e2e（`e2e/a11y/keyboard.spec.ts`）に渡すための面。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { expect, userEvent, within } from 'storybook/test'

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
    const link = within(canvasElement).getByRole('link', { name: '本文へ' })
    await userEvent.tab()
    await expect(link).toHaveFocus()
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
