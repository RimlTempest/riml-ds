// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * TODO: story を 8 種そろえる（riml-ds-element skill §5）。`markup()` から描く（ADR-0012 §5）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './data-table.define.js'
import './data-table.css'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableMarkup,
  type DataTableMarkupProps,
  dataTableRowMarkup,
} from './index.js'

const HEAD = dataTableHeadMarkup([
  { label: '名前', sort: 'text', key: 'name' },
  { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
])

const BODY = dataTableBodyMarkup([
  dataTableRowMarkup([{ text: 'a.png' }, { text: '1,234', value: '1234', numeric: true }]),
  dataTableRowMarkup([{ text: 'b.png' }, { text: '820', value: '820', numeric: true }]),
])

type Args = DataTableMarkupProps

const meta: Meta<Args> = {
  title: 'Components/DataTable',
  component: 'rd-data-table',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-data-table'] },
  args: { caption: '保存したコード', head: HEAD, body: BODY },
  render: (args) => html`${unsafeHTML(dataTableMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('table', { name: '保存したコード' }),
    ).toBeInTheDocument()
  },
}

/** TODO: 全 variant を並べる */
export const Variants: Story = {}

/** TODO: 無効状態。該当しない部品なら消してよい（skill §5） */
export const Disabled: Story = {}

/** TODO: 検証に通らない状態。該当しない部品なら消してよい（skill §5） */
export const Invalid: Story = {}

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
