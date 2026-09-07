// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label>` が `<input>` を包むので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import './checkbox.define.js'
import './checkbox.css'
import { checkboxMarkup, type CheckboxMarkupProps, RdCheckbox } from './index.js'

type Args = CheckboxMarkupProps

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(checkboxMarkup(args))}
  </form>`

const meta: Meta<Args> = {
  title: 'Components/Checkbox',
  component: 'rd-checkbox',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-checkbox'] },
  args: { id: 'sb-terms', label: '規約に同意する', name: 'terms', defaultValue: 'yes' },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByLabelText('規約に同意する')
    await userEvent.click(box)
    await expect(box).toBeChecked()
    const form = canvasElement.querySelector('form')
    await expect(new FormData(form ?? undefined).get('terms')).toBe('yes')
  },
}

/** variant は `switch` の 2 通り。役割（`role="switch"`）は JS が付ける */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${inForm(args)}
      ${inForm({
        ...args,
        id: 'sb-mail',
        name: 'mail',
        label: 'お知らせを受け取る',
        asSwitch: true,
        defaultChecked: true,
      })}
    </div>`,
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByLabelText('お知らせを受け取る')
    await expect(toggle).toHaveAttribute('role', 'switch')
    await expect(toggle).toBeChecked()
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
      <rd-checkbox>
        <label>
          <input type="checkbox" id="sb-disabled" name="terms" disabled />規約に同意する
        </label>
      </rd-checkbox>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('規約に同意する')).toBeDisabled()
  },
}

export const Invalid: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByLabelText('規約に同意する')
    await userEvent.click(box)
    await userEvent.click(box)
    await userEvent.tab()
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('未入力です。入力してください。')
    await expect(box).toHaveAttribute('aria-invalid', 'true')
  },
}

/** 中間状態はプロパティ委譲（属性では表せない。`<input>` と同じ） */
export const Indeterminate: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-checkbox')
    if (el instanceof RdCheckbox) {
      el.indeterminate = true
      await el.updateComplete
    }
    await waitFor(async () => {
      await expect(within(canvasElement).getByLabelText('規約に同意する')).toBePartiallyChecked()
    })
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { asSwitch: true, defaultChecked: true },
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + '強制配色では switch の自前描画をやめ、ネイティブのチェックボックス表示に戻る。',
      },
    },
  },
}

export const ReducedMotion: Story = {
  args: { asSwitch: true },
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
