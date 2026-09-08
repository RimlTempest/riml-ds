// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。押下の真実は `aria-pressed` 属性なので、
 * `getByRole('button', { pressed: true })` がそのまま引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './toggle.define.js'
import './toggle.css'
import { toggleMarkup, type ToggleMarkupProps } from './index.js'

type Args = ToggleMarkupProps

const meta: Meta<Args> = {
  title: 'Components/Toggle',
  component: 'rd-toggle',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-toggle'] },
  args: { label: '一覧' },
  render: (args) => html`${unsafeHTML(toggleMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: '一覧', pressed: false })
    await userEvent.click(button)
    await expect(canvas.getByRole('button', { name: '一覧', pressed: true })).toBeInTheDocument()
    await expect(canvasElement.querySelector('rd-toggle')?.matches(':state(pressed)')).toBe(true)
  },
}

/** variant は outline（既定）と ghost の 2 通り */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-button-group">
      ${unsafeHTML(toggleMarkup(args))}
      ${unsafeHTML(toggleMarkup({ label: '格子', variant: 'ghost' }))}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('button')).toHaveLength(2)
  },
}

/** 押下は面と太字の 2 つで示す（色だけに頼らない） */
export const Pressed: Story = {
  args: { pressed: 'true' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('rd-toggle')?.matches(':state(pressed)')).toBe(true)
  },
}

/** 無効化は `<button disabled>` をそのまま使う（部品は属性を持たない。契約外なので手書き） */
export const Disabled: Story = {
  render: () =>
    html`<rd-toggle><button type="button" aria-pressed="false" disabled>一覧</button></rd-toggle>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '一覧' })).toBeDisabled()
  },
}

export const Dark: Story = { args: { pressed: 'true' }, globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { args: { pressed: 'true' }, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { pressed: 'true' },
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + '強制配色では押下を面ではなく Highlight の輪で示す（面にすると文字が読めなくなる）。',
      },
    },
  },
}

export const ReducedMotion: Story = {
  args: { pressed: 'true' },
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
