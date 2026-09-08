// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * `markup()` から描く（ADR-0012 §5）。`<label for>` と `<input>` は light DOM に居るので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './text-field.define.js'
import './text-field.css'
import { textFieldMarkup, type TextFieldMarkupProps } from './index.js'

type Args = TextFieldMarkupProps

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(textFieldMarkup(args))}
  </form>`

const formOf = (canvasElement: HTMLElement): HTMLFormElement | undefined => {
  const form = canvasElement.querySelector('form')
  return form === null ? undefined : form
}

const meta: Meta<Args> = {
  title: 'Components/TextField',
  component: 'rd-text-field',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-text-field'] },
  args: { id: 'sb-email', label: 'メール', name: 'email', type: 'email' },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('メール')
    await userEvent.type(input, 'name@example.com')
    const form = formOf(canvasElement)
    await expect(form).toBeInstanceOf(HTMLFormElement)
    await expect(new FormData(form).get('email')).toBe('name@example.com')
  },
}

/** variant を持たない部品なので、`Variants` の位置には表示の分岐（hint）を置く */
export const WithHint: Story = {
  args: { hint: 'ドメイン名まで入力してください' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('メール')
    const hint = canvasElement.querySelector('[part="hint"]')
    await expect(hint).toHaveTextContent('ドメイン名まで入力してください')
    await expect(input).toHaveAttribute('aria-describedby', hint?.id ?? '')
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
      <rd-text-field>
        <label for="sb-disabled">メール</label>
        <input id="sb-disabled" name="email" type="email" disabled />
      </rd-text-field>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('メール')).toBeDisabled()
  },
}

export const Invalid: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('メール')
    await userEvent.click(input)
    await userEvent.tab()
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('未入力です。入力してください。')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  },
}

/**
 * 入力の型は `<input type>`（と `<textarea>`）がそのまま持つ。部品は型ごとの見た目を持たず、
 * ネイティブのピッカー・キーボード・検証をそのまま出す（ADR-0012）。
 * `number` / `date` は契約の `TextFieldType` に無い型なので、light DOM を手で書く。
 */
export const Types: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      <div class="rd-stack">
        ${unsafeHTML(textFieldMarkup({ id: 'sb-q', label: '検索', name: 'q', type: 'search' }))}
        <rd-text-field>
          <label for="sb-qty">数量</label>
          <input id="sb-qty" name="qty" type="number" min="1" max="99" />
        </rd-text-field>
        <rd-text-field>
          <label for="sb-due">期日</label>
          <input id="sb-due" name="due" type="date" />
        </rd-text-field>
        ${unsafeHTML(
          textFieldMarkup({
            id: 'sb-password',
            label: 'パスワード',
            name: 'password',
            type: 'password',
          }),
        )}
        ${unsafeHTML(textFieldMarkup({ id: 'sb-site', label: 'サイト', name: 'site', type: 'url' }))}
        <rd-text-field>
          <label for="sb-note">備考</label>
          <textarea id="sb-note" name="note" rows="3"></textarea>
        </rd-text-field>
      </div>
    </form>`,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('検索')).toHaveAttribute('type', 'search')
    await expect(canvas.getByLabelText('数量')).toHaveAttribute('type', 'number')
    await expect(canvas.getByLabelText('期日')).toHaveAttribute('type', 'date')
    await expect(canvas.getByLabelText('備考').tagName).toBe('TEXTAREA')
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { error: 'このアドレスは登録済みです。別のアドレスを入力してください。' },
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
