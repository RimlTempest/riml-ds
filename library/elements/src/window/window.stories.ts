// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。枠と帯だけが shadow にあり、見出しと本文は slot。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方（`:not(:defined)`）は `e2e/pe` が見る。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { queryShadow } from '@rd-shadow'
import { expect, userEvent, within } from 'storybook/test'
import './window.define.js'
import './window.css'
import { RdWindow, windowMarkup, type WindowMarkupProps } from './index.js'

type Args = WindowMarkupProps

const windowIn = (canvasElement: HTMLElement): RdWindow | undefined => {
  const element = canvasElement.querySelector('rd-window')
  return element instanceof RdWindow ? element : undefined
}

const meta: Meta<Args> = {
  title: 'Components/Window',
  component: 'rd-window',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-window'] },
  args: {
    title: 'バックアップの設定',
    children: '<p>毎晩 3 時に実行します。終わったら通知します。</p>',
    closable: true,
  },
  render: (args) => html`${unsafeHTML(windowMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'バックアップの設定' })).toBeInTheDocument()
    await expect(queryShadow(windowIn(canvasElement), 'button[data-action=close]')).toBeVisible()
  },
}

/** 操作の組み合わせが variant。使わない操作の丸は描かない（ADR-0014 決定 1） */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${unsafeHTML(windowMarkup({ ...args, title: '操作なし', closable: false }))}
      ${unsafeHTML(windowMarkup({ ...args, title: '閉じるだけ' }))}
      ${unsafeHTML(
        windowMarkup({
          ...args,
          title: '閉じる・広げる・たたむ',
          expandable: true,
          collapsible: true,
        }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-window')).toHaveLength(3)
  },
}

/** 操作が 1 つも無い窓。帯の左は空欄で、タイトルは中央のまま（`Disabled` の枠） */
export const NoControls: Story = {
  args: { closable: false },
  play: async ({ canvasElement }) => {
    await expect(queryShadow(windowIn(canvasElement), '[part=controls]')).toBeNull()
  },
}

/** 3 つ全部。並びは左から 閉じる（×）・広げる（□）・たたむ（−） */
export const AllControls: Story = {
  args: { expandable: true, collapsible: true },
  play: async ({ canvasElement }) => {
    const el = windowIn(canvasElement)
    const actions = [...(el?.shadowRoot?.querySelectorAll('button[data-action]') ?? [])].map(
      (button) => (button instanceof HTMLElement ? button.dataset['action'] : undefined),
    )
    await expect(actions).toEqual(['close', 'expand', 'collapse'])
  },
}

/** 帯の色は 4 通り。文字色は必ず対応する `on-*`、丸は tone でも `chrome.text`（brand.md §7.1） */
export const Tones: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${unsafeHTML(windowMarkup({ ...args, title: '既定（chrome）' }))}
      ${unsafeHTML(windowMarkup({ ...args, title: 'accent', tone: 'accent' }))}
      ${unsafeHTML(windowMarkup({ ...args, title: 'warning', tone: 'warning' }))}
      ${unsafeHTML(windowMarkup({ ...args, title: 'danger', tone: 'danger' }))}
    </div>`,
}

/** たたんだ状態。本文は `hidden`、たたむボタンは `aria-expanded="false"` */
export const Collapsed: Story = {
  args: { collapsible: true, collapsed: true },
  play: async ({ canvasElement }) => {
    const el = windowIn(canvasElement)
    await expect(queryShadow(el, '[part=body]')).not.toBeVisible()
    const collapse = queryShadow(el, 'button[data-action=collapse]')
    await expect(collapse).toHaveAttribute('aria-expanded', 'false')
    if (collapse instanceof HTMLElement) {
      await userEvent.click(collapse)
    }
    await expect(queryShadow(el, '[part=body]')).toBeVisible()
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
