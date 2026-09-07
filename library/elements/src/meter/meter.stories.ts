// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。値はネイティブ `<meter>` が持ち、
 * 部品は `--rd-meter-fill` を書くだけ（docs/brand.md §7.5）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './meter.define.js'
import './meter.css'
import { meterMarkup, type MeterMarkupProps } from './index.js'

type Args = MeterMarkupProps

const meta: Meta<Args> = {
  title: 'Components/Meter',
  component: 'rd-meter',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-meter'] },
  args: {
    id: 'sb-disk',
    label: 'ディスク使用量',
    value: '3.2',
    max: '10',
    text: '3.2 GB / 10 GB',
  },
  render: (args) => html`${unsafeHTML(meterMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter', { name: 'ディスク使用量' })
    await expect(meter).toBeInTheDocument()
    const host = canvasElement.querySelector('rd-meter')
    await expect(host?.style.getPropertyValue('--rd-meter-fill')).toBe('0.32')
  },
}

/** tone は 4 通り。意味は必ず文言でも出す（色だけで伝えない。accessibility.md 9） */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${unsafeHTML(meterMarkup(args))}
      ${unsafeHTML(
        meterMarkup({
          ...args,
          id: 'sb-quota',
          label: '達成率（良好）',
          value: '9',
          text: '9 / 10 件',
          tone: 'success',
        }),
      )}
      ${unsafeHTML(
        meterMarkup({
          ...args,
          id: 'sb-warn',
          label: '残り容量（注意）',
          value: '8',
          text: '8 GB / 10 GB',
          tone: 'warning',
        }),
      )}
      ${unsafeHTML(
        meterMarkup({
          ...args,
          id: 'sb-danger',
          label: '残り容量（危険）',
          value: '9.7',
          text: '9.7 GB / 10 GB',
          tone: 'danger',
        }),
      )}
    </div>`,
}

/** `<progress>` も同じ契約で包める（役割は progressbar になる） */
export const Progress: Story = {
  render: () =>
    html`<rd-meter>
      <label for="sb-upload">アップロード</label>
      <progress id="sb-upload" value="0.4">40%</progress>
    </rd-meter>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('rd-meter')
    await expect(host?.style.getPropertyValue('--rd-meter-fill')).toBe('0.4')
  },
}

/** 値が決まっていない `<progress>`。`Invalid` の代わり（メーターに検証は無い） */
export const Indeterminate: Story = {
  render: () =>
    html`<rd-meter>
      <label for="sb-loading">読み込み中</label>
      <progress id="sb-loading">読み込み中</progress>
    </rd-meter>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('rd-meter')
    await expect(host?.matches(':state(indeterminate)')).toBe(true)
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
          + '強制配色では自前の塗り（グラデーション）が消えるので、ネイティブの <meter> 表示に戻る。',
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
          + 'メーターは動かないので見た目は変わらない。',
      },
    },
  },
}
