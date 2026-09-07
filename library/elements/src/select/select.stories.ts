// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` と `<select>` は light DOM に居るので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 * 見た目はネイティブのまま（customizable `<select>` は Baseline 外）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './select.define.js'
import './select.css'
import { selectMarkup, type SelectMarkupProps } from './index.js'

type Args = SelectMarkupProps

const OPTIONS =
  '<option value="">選択してください</option>'
  + '<option value="jp">日本</option><option value="us">アメリカ</option>'

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(selectMarkup(args))}
  </form>`

const formOf = (canvasElement: HTMLElement): HTMLFormElement | undefined => {
  const form = canvasElement.querySelector('form')
  return form === null ? undefined : form
}

const meta: Meta<Args> = {
  title: 'Components/Select',
  component: 'rd-select',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-select'] },
  args: { id: 'sb-country', label: '国', name: 'country', children: OPTIONS },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByLabelText('国')
    await userEvent.selectOptions(select, 'jp')
    const form = formOf(canvasElement)
    await expect(form).toBeInstanceOf(HTMLFormElement)
    await expect(new FormData(form).get('country')).toBe('jp')
  },
}

/** variant を持たない部品なので、`Variants` の位置には表示の分岐（hint と初期選択）を置く */
export const WithHint: Story = {
  args: { hint: '請求先の国を選んでください', defaultValue: 'us' },
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByLabelText('国')
    const hint = canvasElement.querySelector('[part="hint"]')
    await expect(hint).toHaveTextContent('請求先の国を選んでください')
    await expect(select).toHaveAttribute('aria-describedby', hint?.id ?? '')
    await expect(select).toHaveValue('us')
  },
}

/** `disabled` は部品の属性にしない。ネイティブ `<select disabled>` をそのまま使う（契約外なので手書き） */
export const Disabled: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      <rd-select>
        <label for="sb-disabled">国</label>
        <select id="sb-disabled" name="country" disabled>
          ${unsafeHTML(OPTIONS)}
        </select>
      </rd-select>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('国')).toBeDisabled()
  },
}

export const Invalid: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByLabelText('国')
    await userEvent.click(select)
    await userEvent.tab()
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('未入力です。入力してください。')
    await expect(select).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { error: 'その国には配送できません。別の国を選んでください。' },
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
