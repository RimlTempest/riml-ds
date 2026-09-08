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
import './checkbox-group.define.js'
import './checkbox-group.css'
import {
  checkboxGroupMarkup,
  type CheckboxGroupMarkupProps,
  checkboxOptionMarkup,
} from './index.js'

type Args = CheckboxGroupMarkupProps

const TAGS: readonly (readonly [string, string])[] = [
  ['work', '仕事'],
  ['private', '私用'],
  ['travel', '旅行'],
]

const options = (prefix = 'sb'): string =>
  TAGS.map(([value, label]) =>
    checkboxOptionMarkup({
      id: `${prefix}-tag-${value}`,
      name: `${prefix}-tags`,
      value,
      label,
    }),
  ).join('')

/** story は必ず `<form>` で包む。送信はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(checkboxGroupMarkup(args))}
  </form>`

const meta: Meta<Args> = {
  title: 'Components/CheckboxGroup',
  component: 'rd-checkbox-group',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-checkbox-group'] },
  args: { label: 'タグ', children: options() },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'タグ' })).toBeInTheDocument()
    await userEvent.click(canvas.getByLabelText('仕事'))
    await userEvent.click(canvas.getByLabelText('旅行'))
    const form = canvasElement.querySelector('form')
    await expect(new FormData(form ?? undefined).getAll('sb-tags')).toEqual(['work', 'travel'])
  },
}

/** variant は `segmented` の 2 通り。役割・送信・読み上げはどちらも checkbox のまま */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${inForm(args)}
      ${inForm({ ...args, label: '表示', children: options('sb-v'), segmented: true })}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('checkbox')).toHaveLength(6)
  },
}

/** 見た目だけを区画にする。JS も `:has()` も無ければ普通の checkbox に見える（退行しない） */
export const Segmented: Story = {
  args: { label: '表示', segmented: true, hint: 'いくつでも選べます' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-checkbox-group')
    await expect(el?.matches(':state(segmented)')).toBe(true)
    await userEvent.click(within(canvasElement).getByLabelText('旅行'))
    await expect(within(canvasElement).getByLabelText('旅行')).toBeChecked()
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
      <rd-checkbox-group segmented>
        <fieldset disabled>
          <legend>表示</legend>
          <div part="options">${unsafeHTML(options('sb-sd'))}</div>
        </fieldset>
      </rd-checkbox-group>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('私用')).toBeDisabled()
  },
}

/** 「1 つ以上」は `min`。ネイティブの検証には出ないので部品が見る（JS が無いと効かない） */
export const Min: Story = {
  args: { min: '1', hint: '1 つ以上選んでください' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-checkbox-group')
    await userEvent.click(within(canvasElement).getByLabelText('仕事'))
    await userEvent.click(within(canvasElement).getByLabelText('仕事'))
    await userEvent.tab()
    const error = await within(canvasElement).findByText('未入力です。入力してください。')
    await expect(error).toBeInTheDocument()
    await expect(el?.matches(':state(invalid)')).toBe(true)
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
      <rd-checkbox-group>
        <fieldset disabled>
          <legend>タグ</legend>
          <div part="options">${unsafeHTML(options('sb-d'))}</div>
        </fieldset>
      </rd-checkbox-group>
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('仕事')).toBeDisabled()
  },
}

/**
 * `aria-invalid` は使わない（radio-group と同じ判断）。文言は**各 checkbox** の
 * `aria-describedby` で結び、状態は `:state(invalid)` で示す。
 */
export const Invalid: Story = {
  args: { error: 'この組み合わせは選べません。1 つだけ選んでください。' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('rd-checkbox-group')
    const error = await within(canvasElement).findByText(
      'この組み合わせは選べません。1 つだけ選んでください。',
    )
    await expect(el?.matches(':state(invalid)')).toBe(true)
    const work = within(canvasElement).getByLabelText('仕事')
    await expect(work).toHaveAttribute('aria-describedby', error.id)
    await expect(work).not.toHaveAttribute('aria-invalid')
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
          + '強制配色では区画の自前描画をやめ、ネイティブの checkbox 表示に戻る。',
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
