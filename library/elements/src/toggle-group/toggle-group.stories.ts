// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。押下の真実は各 `<button>` の `aria-pressed`
 * なので、`getByRole('button', { pressed: true })` がそのまま引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './toggle-group.define.js'
import './toggle-group.css'
import { toggleGroupMarkup, type ToggleGroupMarkupProps, toggleItemMarkup } from './index.js'

type Args = ToggleGroupMarkupProps

const FORMAT =
  toggleItemMarkup({ label: '太字', value: 'bold', pressed: 'true' })
  + toggleItemMarkup({ label: '斜体', value: 'italic' })
  + toggleItemMarkup({ label: '下線', value: 'underline' })

const meta: Meta<Args> = {
  title: 'Components/ToggleGroup',
  component: 'rd-toggle-group',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-toggle-group'] },
  args: { label: '書式', children: FORMAT },
  render: (args) => html`${unsafeHTML(toggleGroupMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: '書式' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '斜体', pressed: false }))
    // 既定は multiple。押した分だけ増える
    await expect(canvasElement.querySelector('rd-toggle-group')?.values).toEqual(['bold', 'italic'])
  },
}

/** `mode="single"` は 1 個だけ押せる。2 個目を押すと 1 個目が戻る */
export const Single: Story = {
  args: { mode: 'single' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('2 個目を押すと 1 個目が戻る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '下線' }))
      await expect(canvas.getByRole('button', { name: '太字', pressed: false })).toBeInTheDocument()
      await expect(canvasElement.querySelector('rd-toggle-group')?.values).toEqual(['underline'])
    })
  },
}

/** variant（outline / ghost）× mode（single / multiple）の 4 通り */
export const Variants: Story = {
  render: (args) =>
    html`<div style="display: grid; gap: 1rem">
      ${unsafeHTML(toggleGroupMarkup({ ...args, label: 'outline・multiple' }))}
      ${unsafeHTML(toggleGroupMarkup({ ...args, label: 'outline・single', mode: 'single' }))}
      ${unsafeHTML(toggleGroupMarkup({ ...args, label: 'ghost・multiple', variant: 'ghost' }))}
      ${unsafeHTML(
        toggleGroupMarkup({ ...args, label: 'ghost・single', mode: 'single', variant: 'ghost' }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('group')).toHaveLength(4)
  },
}

/** 無効化は `<button disabled>` をそのまま使う（部品は disabled 属性を持たない） */
export const Disabled: Story = {
  args: {
    children:
      toggleItemMarkup({ label: '太字', value: 'bold', pressed: 'true' })
      + toggleItemMarkup({ label: '斜体', value: 'italic', disabled: true })
      + toggleItemMarkup({ label: '下線', value: 'underline' }),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '斜体' })).toBeDisabled()
  },
}

/** 縦並び。矢印は ↑ ↓ になる（← → は扱わない） */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('rd-toggle-group')?.matches(':state(vertical)')).toBe(
      true,
    )
  },
}

/** `.rd-toolbar` の中に置く（`role="toolbar"` は利用側が付ける） */
export const Toolbar: Story = {
  render: (args) =>
    html`<div class="rd-toolbar" role="toolbar" aria-label="書式ツールバー">
      ${unsafeHTML(toggleGroupMarkup(args))}
      ${unsafeHTML(
        toggleGroupMarkup({
          label: '配置',
          mode: 'single',
          variant: 'ghost',
          children:
            toggleItemMarkup({ label: '左', value: 'start', pressed: 'true' })
            + toggleItemMarkup({ label: '中央', value: 'center' })
            + toggleItemMarkup({ label: '右', value: 'end' }),
        }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('group')).toHaveLength(2)
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + '強制配色では押下を SelectedItem の面で示し、フォーカスは外側の太いリングで示す'
          + '（押下とフォーカスが同じ形にならないこと）。',
      },
    },
  },
}

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `reducedMotion: "reduce"` でだけ検証する（`e2e/vrt/reduced.spec.ts`）。'
          + 'Storybook 上では見た目が変わらない。',
      },
    },
  },
}
