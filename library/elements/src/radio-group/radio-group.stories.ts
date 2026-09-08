// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label>` が `<input>` を包むので、
 * `within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './radio-group.define.js'
import './radio-group.css'
import { radioGroupMarkup, type RadioGroupMarkupProps, radioOptionMarkup } from './index.js'

type Args = RadioGroupMarkupProps

const PLANS: readonly (readonly [string, string])[] = [
  ['free', '無料'],
  ['pro', '有料'],
  ['team', 'チーム'],
]

/** `required` は最初の 1 個にだけ付ける（HTML の仕様で group 全体が必須になる） */
const options = (required = false, prefix = 'sb'): string =>
  PLANS.map(([value, label], index) =>
    radioOptionMarkup({
      id: `${prefix}-plan-${value}`,
      name: `${prefix}-plan`,
      value,
      label,
      ...(required && index === 0 ? { required: true } : {}),
    }),
  ).join('')

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(radioGroupMarkup(args))}
  </form>`

const meta: Meta<Args> = {
  title: 'Components/RadioGroup',
  component: 'rd-radio-group',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-radio-group'] },
  args: { label: 'プラン', children: options() },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'プラン' })).toBeInTheDocument()
    await userEvent.click(canvas.getByLabelText('有料'))
    const form = canvasElement.querySelector('form')
    await expect(new FormData(form ?? undefined).get('sb-plan')).toBe('pro')
  },
}

/** variant は `segmented` の 2 通り。役割・送信・キーボードはどちらも radio のまま */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${inForm(args)}
      ${inForm({ ...args, label: '表示', children: options(false, 'sb-v'), segmented: true })}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('radio')).toHaveLength(6)
  },
}

/** 見た目だけを区画にする。JS も `:has()` も無ければ普通の radio に見える（退行しない） */
export const Segmented: Story = {
  args: { label: '表示', segmented: true, hint: 'あとで変更できます' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-radio-group')
    await expect(el?.matches(':state(segmented)')).toBe(true)
    await userEvent.click(within(canvasElement).getByLabelText('チーム'))
    await expect(within(canvasElement).getByLabelText('チーム')).toBeChecked()
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
      <rd-radio-group>
        <fieldset disabled>
          <legend>プラン</legend>
          <div part="options">${unsafeHTML(options(false, 'sb-d'))}</div>
        </fieldset>
      </rd-radio-group>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('無料')).toBeDisabled()
  },
}

/** segmented でも無効化は `<fieldset disabled>`（見た目だけが区画） */
export const SegmentedDisabled: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      <rd-radio-group segmented>
        <fieldset disabled>
          <legend>表示</legend>
          <div part="options">${unsafeHTML(options(false, 'sb-sd'))}</div>
        </fieldset>
      </rd-radio-group>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('有料')).toBeDisabled()
  },
}

/**
 * `aria-invalid` は使わない（ARIA 1.2 で `role="radio"` では非推奨）。
 * 文言は**各 radio** の `aria-describedby` で結び、状態は `:state(invalid)` と `:user-invalid` で示す。
 */
export const Invalid: Story = {
  args: { children: options(true) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByLabelText('無料'))
    await userEvent.click(within(canvasElement).getByLabelText('無料'))
    await userEvent.tab()
    const el = canvasElement.querySelector('rd-radio-group')
    if (el instanceof HTMLElement && 'error' in el) {
      el.setAttribute('error', 'このプランは選べません。別のプランを選んでください。')
    }
    const error = await within(canvasElement).findByText(
      'このプランは選べません。別のプランを選んでください。',
    )
    await expect(error).toBeInTheDocument()
    await expect(el?.matches(':state(invalid)')).toBe(true)
    const free = within(canvasElement).getByLabelText('無料')
    await expect(free).toHaveAttribute('aria-describedby', error.id)
    await expect(free).not.toHaveAttribute('aria-invalid')
  },
}

export const Dark: Story = { args: { segmented: true }, globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { args: { segmented: true }, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { segmented: true },
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の `forcedColors: "active"` でだけ検証する（`e2e/vrt/forced.spec.ts`）。'
          + '強制配色では区画の自前描画をやめ、ネイティブの radio 表示に戻る。',
      },
    },
  },
}

export const ReducedMotion: Story = {
  args: { segmented: true },
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
