// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。枠だけが shadow にあり、タブの列もパネルも light DOM。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方は `e2e/pe` が見る。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './tabs.define.js'
import './tabs.css'
import { type TabsMarkupProps, tabsMarkup, tabsPanelMarkup, tabMarkup } from './index.js'

type Args = TabsMarkupProps

const TABS =
  tabMarkup({ href: '#overview', label: '概要' })
  + tabMarkup({ href: '#usage', label: '使い方' })
  + tabMarkup({ href: '#faq', label: 'よくある質問' })

const PANELS =
  tabsPanelMarkup({ id: 'overview', children: '<p>この部品は JS が無くてもリンクとして動く。</p>' })
  + tabsPanelMarkup({ id: 'usage', children: '<p>矢印キーで移ると、その場でパネルが変わる。</p>' })
  + tabsPanelMarkup({ id: 'faq', children: '<p>hash は読むだけで書かない。</p>' })

const meta: Meta<Args> = {
  title: 'Components/Tabs',
  component: 'rd-tabs',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-tabs'] },
  args: { label: '設定', tabs: TABS, panels: PANELS },
  render: (args) => html`${unsafeHTML(tabsMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tablist', { name: '設定' })).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: '概要', selected: true })).toBeInTheDocument()
    await expect(canvas.getByRole('tabpanel')).toBeInTheDocument()
  },
}

/** `line`（既定）と `browser`。選択は面と位置で示すので、色を落としても分かる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${unsafeHTML(tabsMarkup({ ...args, label: 'line' }))}
      ${unsafeHTML(tabsMarkup({ ...args, label: 'browser', variant: 'browser' }))}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-tabs')).toHaveLength(2)
  },
}

/** 参考画面の構図。選択タブが帯の面から生えて本体と同じ面色になる */
export const Browser: Story = {
  args: { variant: 'browser' },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole('tab', { name: '使い方' })
    await userEvent.click(tab)
    await expect(tab).toHaveAttribute('aria-selected', 'true')
  },
}

/** 縦並び。↑ ↓ で動き、選択はインライン始端の太い縦罫で示す */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const first = within(canvasElement).getByRole('tab', { name: '概要' })
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(within(canvasElement).getByRole('tab', { name: '使い方' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/** `selected` で最初に開くタブを指定する（`location.hash` のほうが強い） */
export const Selected: Story = {
  args: { selected: '#faq' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('tab', { name: 'よくある質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
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
