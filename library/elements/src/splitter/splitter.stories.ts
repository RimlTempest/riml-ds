// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。つまみだけが shadow にあり、2 つの面は light DOM。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方は `e2e/pe` が見る。
 *
 * 割合は host の高さの中で決まるので、どの story も**高さを持つ入れ物**に入れる
 * （生値を書かないため寸法もトークンから作る）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent } from 'storybook/test'
import './splitter.define.js'
import './splitter.css'
import { type SplitterMarkupProps, splitterMarkup } from './index.js'

type Args = SplitterMarkupProps

const START = '<h2>一覧</h2><p>左の面。狭くしても中身は面ごと転がる。</p>'
const END = '<h2>本文</h2><p>右の面。つまみを動かすと両方の割合が変わる。</p>'

/** つまみは shadow にしか無いので、story の検査も shadow から掴む（`splitter.test.ts` と同じ形） */
const handleOf = (canvas: HTMLElement, index = 0): HTMLElement => {
  const el = canvas.querySelectorAll('rd-splitter')[index]
  const handle = el?.shadowRoot?.querySelector('[part=handle]')
  if (!(handle instanceof HTMLElement)) {
    throw new Error('[part=handle] が無い')
  }
  return handle
}

/** 高さのある入れ物。`--rd-space-16` は 3rem なので、その 4 倍を面の高さにする */
const framed = (markup: string): TemplateResult =>
  html`<div style="block-size: calc(var(--rd-space-16) * 4)">${unsafeHTML(markup)}</div>`

const meta: Meta<Args> = {
  title: 'Components/Splitter',
  component: 'rd-splitter',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-splitter'] },
  args: { label: 'サイドバーの幅', start: START, end: END },
  render: (args) => framed(splitterMarkup(args)),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const handle = handleOf(canvasElement)
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-label', 'サイドバーの幅')
    // 横に並ぶ 2 面のあいだの仕切りは**縦線**（APG の separator。docs/proposals/splitter.md）
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')
  },
}

/** `horizontal`（既定・面が横）と `vertical`（面が縦）。`aria-orientation` は逆になる */
export const Variants: Story = {
  render: (args) =>
    html`${framed(splitterMarkup({ ...args, label: '横に並ぶ 2 面' }))}
    ${framed(splitterMarkup({ ...args, label: '縦に積む 2 面', direction: 'vertical' }))}`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-splitter')).toHaveLength(2)
  },
}

/** 動ける幅を狭める（`min` / `max`）。端まで行っても面が消えない */
export const Narrow: Story = {
  args: { label: '狭い可動域', min: 30, max: 50, position: 40 },
  play: async ({ canvasElement }) => {
    const handle = handleOf(canvasElement)
    await expect(handle).toHaveAttribute('aria-valuemin', '30')
    await expect(handle).toHaveAttribute('aria-valuemax', '50')
  },
}

/** 横の面の中に縦の splitter を入れる。つまみは面ごとに 1 つずつ独立して動く */
export const Nested: Story = {
  args: {
    label: '外側（横）',
    end: splitterMarkup({
      label: '内側（縦）',
      direction: 'vertical',
      start: '<h2>本文</h2><p>上の面。</p>',
      end: '<h2>下書き</h2><p>下の面。</p>',
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-splitter')).toHaveLength(2)
  },
}

/** キーボードだけで割合が動く（APG「Window Splitter」）。→ を 10 回で 50 → 60 */
export const Dragged: Story = {
  play: async ({ canvasElement, step }) => {
    const handle = handleOf(canvasElement)
    await step('つまみにフォーカスが入り、→ を 10 回で 10% 動く', async () => {
      handle.focus()
      // shadow の中の焦点は再標的化されるので、document ではなく shadowRoot に聞く
      await expect(handle.getRootNode()).toHaveProperty('activeElement', handle)
      await userEvent.keyboard('{ArrowRight>10/}')
      await expect(handle).toHaveAttribute('aria-valuenow', '60')
    })
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

/** RTL では面の始端が右になり、→ は position を**減らす**（`splitter.logic.ts`） */
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
