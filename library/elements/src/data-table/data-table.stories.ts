// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。表そのものは light DOM に居るので、
 * `within(canvasElement).getByRole('table', { name })` が shadow をまたがずに引ける。
 * JS が無いときは書かれた順の表がそのまま読め、見出しはただの文字（ボタンにならない）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './data-table.define.js'
import './data-table.css'
import {
  dataTableBodyMarkup,
  dataTableHeadMarkup,
  dataTableMarkup,
  type DataTableMarkupProps,
  dataTableRowMarkup,
} from './index.js'

/** 文字・数・日付の 3 列。比べ方は `data-sort`、比較キーは `data-value`（表示と分ける） */
const HEAD = dataTableHeadMarkup([
  { label: '名前', sort: 'text', key: 'name' },
  { label: 'サイズ', sort: 'number', key: 'size', numeric: true },
  { label: '更新', sort: 'date', key: 'updated' },
])

const row = (name: string, size: string, bytes: string, updated: string): string =>
  dataTableRowMarkup([
    { text: name },
    { text: size, value: bytes, numeric: true },
    { text: updated.replaceAll('-', '/'), value: updated },
  ])

const BODY = dataTableBodyMarkup([
  row('レジ横の QR', '1,234', '1234', '2026-01-02'),
  row('会員証バーコード', '820', '820', '2025-12-31'),
  row('展示のカタログ', '12,000', '12000', '2026-02-14'),
  row('社内 Wi-Fi', '96', '96', '2025-08-09'),
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

/** 見出しの中身は定義後にボタンになる。並べ替える前はどの列にも `aria-sort` が付かない */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: '保存したコード' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('button')).toHaveLength(3)
    await expect(canvasElement.querySelectorAll('[aria-sort]')).toHaveLength(0)
  },
}

/** 列の比べ方は 3 種（`text` / `number` / `date`）。数の列は矢印を行頭側に置く */
export const Variants: Story = {
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll('th[data-sort]')
    await expect([...cells].map((cell) => cell.getAttribute('data-sort'))).toEqual([
      'text',
      'number',
      'date',
    ])
  },
}

/** 見出しを押したところ（2 列目 = サイズの昇順）。行は DOM の移動だけで並ぶ */
export const Clicked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'サイズ' }))
    const cell = canvasElement.querySelector('th[data-sort="number"]')
    await expect(cell).toHaveAttribute('aria-sort', 'ascending')
    await expect(canvasElement.querySelector('tbody > tr > td')).toHaveTextContent('社内 Wi-Fi')
  },
}

/**
 * `Disabled` の位置には `manual` を置く（無効状態を持たない部品）。行はサーバー側で
 * 並べ替える利用側向けに、`aria-sort` と `rd-sort` だけを出して DOM は動かさない。
 */
export const Manual: Story = {
  args: { manual: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '名前' }))
    await expect(canvasElement.querySelector('th[data-sort="text"]')).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    // 行は動かない（並べ替えるのはサーバー側）
    await expect(canvasElement.querySelector('tbody > tr > td')).toHaveTextContent('レジ横の QR')
  },
}

/** `Invalid` の位置には初期値つき（`column="1"` の降順）を置く。定義のときに並べ替える */
export const Sorted: Story = {
  args: { column: '1', direction: 'descending' },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('rd-data-table')
    await expect(host?.matches(':state(sorted)')).toBe(true)
    await expect(canvasElement.querySelector('tbody > tr > td')).toHaveTextContent('展示のカタログ')
  },
}

export const Dark: Story = { args: { column: '1' }, globals: { scheme: 'dark' } }

export const Dense: Story = { args: { column: '1' }, globals: { density: 'compact' } }

export const RTL: Story = { args: { column: '1' }, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { column: '1' },
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
