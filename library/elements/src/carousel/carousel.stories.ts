// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`<ul><li>` は利用側が書き、部品は前へ／次へと「n / N」を足す。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方は `e2e/pe` が見る。
 * 自動再生の story は**作らない**（WCAG 2.2.2 / AAA 2.3.3。`docs/proposals/carousel.md`）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './carousel.define.js'
import './carousel.css'
import { carouselItemMarkup, carouselMarkup, type CarouselMarkupProps } from './index.js'

type Args = CarouselMarkupProps

const TITLES = ['秋の便り', '冬の支度', '春の準備', '夏の支度', '通年のもの']

const cards = (count: number): string =>
  TITLES.slice(0, count)
    .map((title) =>
      carouselItemMarkup({
        children:
          `<article class="rd-card"><div class="rd-card-body">`
          + `<h3 class="rd-card-title">${title}</h3><p>季節ごとのおすすめ。</p>`
          + `</div></article>`,
      }),
    )
    .join('')

const meta: Meta<Args> = {
  title: 'Components/Carousel',
  component: 'rd-carousel',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-carousel'] },
  args: { label: 'おすすめ', children: cards(5) },
  render: (args) => html`${unsafeHTML(carouselMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

/** 5 枚。定義後に前へ／次へと「n / N」が末尾に足される */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(5)
    await expect(canvasElement.querySelector("[part='counter']")).toHaveTextContent('1 / 5')
    // 先頭なので「前へ」は押しても動かない（`disabled` にはしない）
    await expect(canvasElement.querySelector("[part='prev']")).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/** `Variants` の位置。`loop` があると端が無くなり、`aria-disabled` も付かない */
export const Loop: Story = {
  args: { loop: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('rd-carousel')
    await expect(host?.matches(':state(at-start)')).toBe(false)
    await expect(canvasElement.querySelector("[part='prev']")).not.toHaveAttribute('aria-disabled')
  },
}

/** `Disabled` の位置。1 枚しか無ければ操作は要らない（`:state(single)` が隠す） */
export const Single: Story = {
  args: { children: cards(1) },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('rd-carousel')
    await expect(host?.matches(':state(single)')).toBe(true)
    const controls = canvasElement.querySelector("[part='controls']")
    await expect(controls).not.toBeVisible()
  },
}

/** `Invalid` の位置。`--rd-carousel-item: 100%` で 1 枚ずつ見せる使い方 */
export const Wide: Story = {
  decorators: [
    (story) => html`<div style="--rd-carousel-item: 100%; max-inline-size: 24rem">${story()}</div>`,
  ],
}

/** 「次へ」を押したところ。counter は `<output>`（暗黙のライブリージョン）なので読み上げに乗る */
export const Next: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '次へ' }))
    await expect(canvasElement.querySelector("[part='counter']")).toHaveTextContent('2 / 5')
    const host = canvasElement.querySelector('rd-carousel')
    await expect(host?.matches(':state(at-start)')).toBe(false)
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
