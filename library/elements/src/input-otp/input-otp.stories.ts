// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。桁の名前は `aria-label`（「N 桁目」）なので、
 * `within(canvasElement).getByLabelText('1 桁目')` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import './input-otp.define.js'
import './input-otp.css'
import { inputOtpMarkup, type InputOtpMarkupProps, otpCellsMarkup } from './index.js'

type Args = InputOtpMarkupProps

/** story は必ず `<form>` で包む。送信はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(inputOtpMarkup(args))}
  </form>`

const meta: Meta<Args> = {
  title: 'Components/InputOtp',
  component: 'rd-input-otp',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-input-otp'] },
  args: { label: '確認コード', children: otpCellsMarkup({ name: 'code' }) },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: '確認コード' })).toBeInTheDocument()
    await userEvent.type(canvas.getByLabelText('1 桁目'), '1')
    // 1 文字入ると次の桁へ進む（JS があるときだけの強化）
    await expect(canvas.getByLabelText('2 桁目')).toHaveFocus()
  },
}

/** 桁数は `length`。部品は `length` を持たず、実際の `<input>` の数を数える */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${inForm(args)}
      ${inForm({
        ...args,
        label: 'PIN',
        children: otpCellsMarkup({ name: 'pin', length: 4, autocomplete: false }),
      })}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('textbox')).toHaveLength(10)
  },
}

/** 全桁が埋まると `:state(filled)` が付く */
export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-input-otp')
    if (el instanceof HTMLElement && 'value' in el) {
      el.value = '123456'
    }
    await waitFor(async () => {
      await expect(el?.matches(':state(filled)')).toBe(true)
    })
  },
}

/** 無効化は `<fieldset disabled>` をそのまま使う（部品は属性を持たない。契約外なので手書き） */
export const Disabled: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      <rd-input-otp>
        <fieldset disabled>
          <legend>確認コード</legend>
          <div part="cells">
            ${unsafeHTML(otpCellsMarkup({ name: 'disabled-code', length: 4 }))}
          </div>
        </fieldset>
      </rd-input-otp>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('1 桁目')).toBeDisabled()
  },
}

/** 文言は**各桁**の `aria-describedby` で結ぶ（`<fieldset>` には付けない） */
export const Invalid: Story = {
  args: { error: 'コードが違います。もう一度入力してください。' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-input-otp')
    const error = await within(canvasElement).findByText(
      'コードが違います。もう一度入力してください。',
    )
    await expect(el?.matches(':state(invalid)')).toBe(true)
    await expect(within(canvasElement).getByLabelText('1 桁目')).toHaveAttribute(
      'aria-describedby',
      error.id,
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
          + '強制配色では桁の罫線を CanvasText で描く。',
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
          + 'この部品は動きを持たないので見た目は変わらない。',
      },
    },
  },
}
