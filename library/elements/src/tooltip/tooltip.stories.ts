// oxlint-disable import/no-unassigned-import -- define は副作用 import が正しい形
/**
 * ティア C。shadow 完結で、JS が無ければ何も出ない（代わりは対象の `title`）。
 * `Default` は**開いた状態**で撮る（VRT に閉じた吹き出しを撮っても意味が無い）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import './tooltip.define.js'

type Args = { readonly for: string; readonly text: string }

const meta: Meta<Args> = {
  title: 'Components/Tooltip',
  component: 'rd-tooltip',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-tooltip'] },
  args: { for: 'sb-tooltip-target', text: '⌘S で保存します' },
  // 吹き出しは既定で対象の上に出る。画面の上端に貼り付けず、上に余白のある位置で見せる
  render: (args) => html`
    <div class="rd-stack" style="padding-block-start: 4rem">
      <button id=${args.for} type="button" title=${args.text}>保存</button>
      <rd-tooltip for=${args.for}>${args.text}</rd-tooltip>
    </div>
  `,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

/** フォーカスで開く（ホバーだけに頼らない。WCAG 1.4.13） */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const target = within(canvasElement).getByRole('button', { name: '保存' })
    target.focus()
    await waitFor(async () => {
      await expect(canvasElement.querySelector('rd-tooltip')?.matches(':state(open)')).toBe(true)
    })
  },
}

/** 閉じている姿。対象に `title` があるので JS が無くてもブラウザが説明を出す */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('rd-tooltip')?.matches(':state(open)')).toBe(false)
  },
}

/** アイコンだけのボタンに付ける。名前は `aria-label`、説明が吹き出し */
export const OnIconButton: Story = {
  args: { for: 'sb-tooltip-icon', text: '新しい窓を開きます' },
  render: (args) => html`
    <button
      id=${args.for}
      type="button"
      class="rd-icon-button"
      aria-label="新しい窓"
      title=${args.text}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M8 3 8 13" />
        <path d="M3 8 13 8" />
      </svg>
    </button>
    <rd-tooltip for=${args.for}>${args.text}</rd-tooltip>
  `,
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await waitFor(async () => {
      await expect(canvasElement.querySelector('rd-tooltip')?.matches(':state(open)')).toBe(true)
    })
  },
}

/** `for` の先が無いと何も出さず `:state(orphan)` になる（説明する相手が居ない） */
export const Orphan: Story = {
  render: () => html`
    <p>対象が見つからないので、この下には何も出ない。</p>
    <rd-tooltip for="missing">出ない説明</rd-tooltip>
  `,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('rd-tooltip')?.matches(':state(orphan)')).toBe(true)
  },
}

export const Dark: Story = { ...Default, globals: { scheme: 'dark' } }

export const Dense: Story = { ...Default, globals: { density: 'compact' } }

export const RTL: Story = { ...Default, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  ...Default,
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
  ...Default,
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
