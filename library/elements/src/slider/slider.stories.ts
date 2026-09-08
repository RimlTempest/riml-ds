// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * TODO: story を 8 種そろえる（riml-ds-element skill §5）。`markup()` から描く（ADR-0012 §5）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './slider.define.js'
import './slider.css'
import { sliderMarkup, type SliderMarkupProps } from './index.js'

type Args = SliderMarkupProps

const meta: Meta<Args> = {
  title: 'Components/Slider',
  component: 'rd-slider',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-slider'] },
  args: { id: 'sb-volume', label: '音量', name: 'volume', defaultValue: '3', min: '0', max: '10' },
  render: (args) => html`${unsafeHTML(sliderMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('音量')).toBeInTheDocument()
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
