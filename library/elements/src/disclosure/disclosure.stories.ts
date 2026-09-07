// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`<details>` / `<summary>` がそのまま開閉するので JS 無しでも**動く**。
 * story も `markup()` から描く（ADR-0012 §5）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import './disclosure.define.js'
import './disclosure.css'
import { disclosureMarkup, type DisclosureMarkupProps } from './index.js'

type Args = DisclosureMarkupProps

const meta: Meta<Args> = {
  title: 'Components/Disclosure',
  component: 'rd-disclosure',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-disclosure'] },
  args: { label: '送料について', children: '<p>全国一律 500 円です。</p>' },
  render: (args) => html`${unsafeHTML(disclosureMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const summary = within(canvasElement).getByText('送料について')
    await userEvent.click(summary)
    await waitFor(async () => {
      await expect(canvasElement.querySelector('details')?.open).toBe(true)
    })
  },
}

/** variant は `group`（`<details name>`）の 2 通り。同じ group は 1 つだけ開く（排他） */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${unsafeHTML(disclosureMarkup({ ...args, group: 'faq', open: true }))}
      ${unsafeHTML(
        disclosureMarkup({
          ...args,
          label: '返品について',
          children: '<p>到着から 14 日以内なら返品できます。</p>',
          group: 'faq',
        }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-disclosure')).toHaveLength(2)
    await expect(canvasElement.querySelector('details')?.name).toBe('faq')
  },
}

export const Open: Story = { args: { open: true } }

/** 本文に部品を置いても light DOM のまま（shadow が無いので利用側の CSS も届く） */
export const RichContent: Story = {
  args: {
    label: '支払い方法',
    children:
      '<p>クレジットカード・銀行振込・代金引換に対応しています。</p>'
      + '<p>領収書は発送後にメールで送ります。</p>',
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-disclosure p')).toHaveLength(2)
  },
}

export const Dark: Story = { args: { open: true }, globals: { scheme: 'dark' } }

export const Dense: Story = { args: { open: true }, globals: { density: 'compact' } }

export const RTL: Story = { args: { open: true }, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { open: true },
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + 'CSS のメディア特性はページの JS から切り替えられないので、Storybook 上では見た目が変わらない。',
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
