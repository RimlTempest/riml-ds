// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * `markup()` から描く（ADR-0012 §5、plan 005 Step 3）。story の HTML を手書きしないので
 * 「Storybook で見えるもの = SSR / RSC / Astro が出すもの = e2e/pe が JS 無しで検証するもの」が同じ文字列になる。
 * `unsafeHTML` に渡してよいのは `markup()` の出力が自分のコードでエスケープ済みだから。
 * 利用側にこの書き方を勧めるものではない。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, fn, userEvent, within } from 'storybook/test'
import './button.define.js'
import './button.css'
import { buttonMarkup, type ButtonMarkupProps, type ButtonVariant } from './index.js'

type Args = ButtonMarkupProps & { readonly 'rd-press': () => void }

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] satisfies readonly ButtonVariant[]

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'rd-button',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-button'] },
  args: { label: '保存', type: 'button', variant: 'primary', 'rd-press': fn() },
  render: (args) =>
    html`<div @rd-press=${args['rd-press']}>${unsafeHTML(buttonMarkup(args))}</div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // ティア A は light DOM なので shadow をまたがずに引ける
    const button = within(canvasElement).getByRole('button', { name: '保存' })
    await userEvent.click(button)
    await expect(args['rd-press']).toHaveBeenCalledTimes(1)
  },
}

export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-cluster">
      ${VARIANTS.map((variant) => unsafeHTML(buttonMarkup({ ...args, label: variant, variant })))}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('button')).toHaveLength(VARIANTS.length)
  },
}

/** `disabled` は部品の属性にしない。ネイティブ `<button disabled>` をそのまま使う（契約外なので手書き） */
export const Disabled: Story = {
  render: () => html`<rd-button><button type="button" disabled>保存</button></rd-button>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '保存' })).toBeDisabled()
  },
}

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: '保存' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    await expect(args['rd-press']).not.toHaveBeenCalled()
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
