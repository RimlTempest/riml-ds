// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` と `<input>` は light DOM に居るので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './number-field.define.js'
import './number-field.css'
import { numberFieldMarkup, type NumberFieldMarkupProps } from './index.js'

type Args = NumberFieldMarkupProps

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(numberFieldMarkup(args))}
  </form>`

const stepButton = (canvasElement: HTMLElement, name: string): HTMLElement =>
  within(canvasElement).getByRole('button', { name })

const meta: Meta<Args> = {
  title: 'Components/NumberField',
  component: 'rd-number-field',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-number-field'] },
  args: { id: 'sb-copies', label: '枚数', name: 'copies', defaultValue: '1', min: '1', max: '99' },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('枚数')
    await expect(input).toHaveValue(1)
    await expect(stepButton(canvasElement, '増やす')).toHaveAttribute('tabindex', '-1')
  },
}

/** variant を持たない部品なので、`Variants` の位置には表示の分岐（hint）を置く */
export const WithHint: Story = {
  args: { hint: '1 から 99 まで' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('枚数')
    const hint = canvasElement.querySelector('[part="hint"]')
    await expect(hint).toHaveTextContent('1 から 99 まで')
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
      <rd-number-field>
        <label for="sb-disabled">枚数</label>
        <input type="number" id="sb-disabled" name="copies" min="1" max="99" value="1" disabled />
      </rd-number-field>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('枚数')).toBeDisabled()
    await expect(stepButton(canvasElement, '増やす')).toBeDisabled()
    await expect(stepButton(canvasElement, '減らす')).toBeDisabled()
  },
}

/** 業務上の「選べない値」は `error` 属性で伝える（ネイティブの検証と同じ場所に出る） */
export const Invalid: Story = {
  args: { error: '在庫が足りません。10 枚以下にしてください。', defaultValue: '20' },
  play: async ({ canvasElement }) => {
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('在庫が足りません。10 枚以下にしてください。')
    await expect(within(canvasElement).getByLabelText('枚数')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  },
}

/** 端まで来たボタンはネイティブの `disabled` で押せなくなる（色だけに頼らない） */
export const Bounded: Story = {
  args: { min: '0', max: '3', defaultValue: '3' },
  play: async ({ canvasElement }) => {
    await expect(stepButton(canvasElement, '増やす')).toBeDisabled()
    await expect(stepButton(canvasElement, '減らす')).toBeEnabled()
  },
}

/** `step="0.1"` を 3 回刻んでも `0.30000000000000004` にならない（純関数が桁で丸める） */
export const Decimal: Story = {
  args: { id: 'sb-weight', label: '重さ', name: 'weight', step: '0.1', defaultValue: '', min: '0' },
  play: async ({ canvasElement }) => {
    const plus = stepButton(canvasElement, '増やす')
    await userEvent.click(plus)
    await userEvent.click(plus)
    await userEvent.click(plus)
    await expect(within(canvasElement).getByLabelText('重さ')).toHaveValue(0.3)
  },
}

/** − / + はポインタで押す道。キーボードは入力欄の ↑↓（ネイティブ）が受け持つ */
export const Stepper: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(stepButton(canvasElement, '増やす'))
    await userEvent.click(stepButton(canvasElement, '増やす'))
    await userEvent.click(stepButton(canvasElement, '減らす'))
    await expect(within(canvasElement).getByLabelText('枚数')).toHaveValue(2)
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { hint: '1 から 99 まで' },
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + '枕とボタンはシステム色の枠に置き換わり、無効なボタンは GrayText になる。',
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
          + 'ボタンの色の遷移は `prefers-reduced-motion: no-preference` の中だけに書いてある。',
      },
    },
  },
}
