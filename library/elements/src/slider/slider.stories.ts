// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` と `<input>` は light DOM に居るので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './slider.define.js'
import './slider.css'
import { type SliderMarkupProps, sliderMarkup } from './index.js'

type Args = SliderMarkupProps

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(sliderMarkup(args))}
  </form>`

const meta: Meta<Args> = {
  title: 'Components/Slider',
  component: 'rd-slider',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-slider'] },
  args: { id: 'sb-volume', label: '音量', name: 'volume', defaultValue: '3', min: '0', max: '10' },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('音量')
    await expect(input).toHaveValue('3')
    const el = canvasElement.querySelector('rd-slider')
    await expect(el instanceof HTMLElement && el.style.getPropertyValue('--rd-slider-fill')).toBe(
      '0.3',
    )
  },
}

/** variant は向きの 2 通り。単位は `<output>` に付く */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-cluster">
      ${inForm(args)}
      ${inForm({ ...args, id: 'sb-vol-v', name: 'volume-v', orientation: 'vertical' })}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('slider')).toHaveLength(2)
  },
}

/** 縦向きは上が最大。Vertical form controls は Baseline 2024（docs/baseline.md） */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-slider')
    await expect(el?.matches(':state(vertical)')).toBe(true)
  },
}

/** 目盛は利用側の `<datalist>`。部品は `list` 属性を通すだけ */
export const WithTicks: Story = {
  args: { list: 'sb-volume-ticks', defaultValue: '5' },
  render: (args) =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      ${unsafeHTML(sliderMarkup(args))}
      <datalist id="sb-volume-ticks" aria-label="音量の目盛">
        <option value="0">0</option>
        <option value="5">5</option>
        <option value="10">10</option>
      </datalist>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('音量')).toHaveAttribute(
      'list',
      'sb-volume-ticks',
    )
  },
}

/** `disabled` は部品の属性にしない。ネイティブ `<input disabled>` をそのまま使う（契約外なので手書き） */
export const Disabled: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      <rd-slider>
        <label for="sb-disabled">音量</label>
        <input type="range" id="sb-disabled" name="volume" min="0" max="10" value="3" disabled />
        <output for="sb-disabled">3</output>
      </rd-slider>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('音量')).toBeDisabled()
  },
}

/** range は UA が値を範囲に丸めるので、業務上の「選べない値」は `error` 属性で伝える */
export const Invalid: Story = {
  args: { error: 'この音量は選べません。8 以下にしてください。', defaultValue: '10' },
  play: async ({ canvasElement }) => {
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('この音量は選べません。8 以下にしてください。')
    await expect(within(canvasElement).getByLabelText('音量')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
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
          + '強制配色では自前のトラックを消し、ネイティブの range 表示に戻る。',
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
          + '塗りの伸び縮みは `prefers-reduced-motion: no-preference` の中だけに書いてある。',
      },
    },
  },
}
