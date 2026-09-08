// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。枠だけが shadow にあり、トリガーも中身も light DOM。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方は `e2e/pe` が見る。
 * VRT のために **開いた状態**で撮る（閉じた重ね物を撮っても面が写らない）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../button/button.define.js'
import '../button/button.css'
import '../text-field/text-field.define.js'
import '../text-field/text-field.css'
import { textFieldMarkup } from '../text-field/index.js'
import './popover.define.js'
import './popover.css'
import { type PopoverMarkupProps, popoverMarkup } from './index.js'

type Args = PopoverMarkupProps

const meta: Meta<Args> = {
  title: 'Components/Popover',
  component: 'rd-popover',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-popover'] },
  args: {
    id: 'sb-popover',
    label: '絞り込み',
    children: '<p>条件を選ぶと一覧がその場で変わる。</p>',
  },
  // 下に開くので、開いた面が切れない高さを確保する
  render: (args) =>
    html`<div class="rd-stack" style="min-block-size: 18rem">
      ${unsafeHTML(popoverMarkup(args))}
    </div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

/** トリガーを押すと開く。開いた瞬間に中の最初の行き先へフォーカスが移る */
const openPopover = async ({ canvasElement }: { canvasElement: HTMLElement }): Promise<void> => {
  const trigger = within(canvasElement).getByRole('button', { name: '絞り込み' })
  await userEvent.click(trigger)
  await waitFor(async () => {
    await expect(canvasElement.querySelector('rd-popover')?.matches(':state(open)')).toBe(true)
  })
}

export const Default: Story = { play: openPopover }

/** 閉じている姿。押すまで中身は top layer に出ない */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: '絞り込み' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  },
}

/** `placement` は `start`（既定）と `end` の 2 通り。インライン方向の揃えだけが変わる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack" style="min-block-size: 18rem">
      ${unsafeHTML(popoverMarkup({ ...args, id: 'sb-popover-start' }))}
      ${unsafeHTML(popoverMarkup({ ...args, id: 'sb-popover-end', placement: 'end' }))}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-popover')).toHaveLength(2)
  },
}

/** トリガーの終端に揃える。画面の端で溢れそうなときに使う */
export const Placement: Story = { args: { placement: 'end' }, play: openPopover }

/** 中にフォーカスを持つ部品を置ける（**モーダルではない**ので背後も操作できる） */
export const WithForm: Story = {
  args: {
    children: textFieldMarkup({ id: 'sb-popover-q', label: 'キーワード', name: 'q' }),
  },
  play: async (context) => {
    await openPopover(context)
    await expect(within(context.canvasElement).getByLabelText('キーワード')).toHaveFocus()
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
