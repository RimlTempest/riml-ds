// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` と `<input list>` は light DOM に
 * 居るので、`within(canvasElement).getByRole('combobox')` が shadow をまたがずに引ける
 * （候補の listbox も同じラベルを持つので `getByLabelText` は使わない）。
 * JS が無いときはネイティブの `<datalist>` がそのまま候補を出す。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, within } from 'storybook/test'
import './combobox.define.js'
import './combobox.css'
import { comboboxMarkup, comboboxOptionMarkup, type ComboboxMarkupProps } from './index.js'

type Args = ComboboxMarkupProps

const OPTIONS = [
  { value: 'kana', label: 'かな' },
  { value: 'kanji', label: 'かんじ' },
  { value: 'katakana', label: 'カナ' },
  { value: 'romaji', label: 'ローマ字' },
  { value: 'eisuji', label: '英数字' },
]
  .map((option) => comboboxOptionMarkup(option))
  .join('')

/** story は必ず `<form>` で包む。送信・検証はブラウザが素で行う（ティア A） */
const inForm = (args: Args) =>
  html`<form
    @submit=${(event: Event) => {
      event.preventDefault()
    }}
  >
    ${unsafeHTML(comboboxMarkup(args))}
  </form>`

const openWith = async (canvasElement: HTMLElement, typed: string): Promise<HTMLElement> => {
  const control = within(canvasElement).getByRole('combobox', { name: '読み' })
  await userEvent.click(control)
  await (typed === '' ? userEvent.keyboard('{ArrowDown}') : userEvent.type(control, typed))
  return control
}

const meta: Meta<Args> = {
  title: 'Components/Combobox',
  component: 'rd-combobox',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-combobox'] },
  args: {
    id: 'sb-reading',
    listId: 'sb-reading-list',
    label: '読み',
    name: 'reading',
    children: OPTIONS,
  },
  render: (args) => inForm(args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('combobox', { name: '読み' })
    await expect(control).toHaveAttribute('role', 'combobox')
    await expect(control).toHaveAttribute('aria-expanded', 'false')
    // 定義後は list を外し、候補は部品の listbox が出す（ネイティブの吹き出しと二重にしない）
    await expect(control).not.toHaveAttribute('list')
  },
}

/** variant を持たない部品なので、`Variants` の位置には絞り込みの分岐（`filter`）を置く */
export const Variants: Story = {
  args: { filter: 'prefix', hint: '前方一致で絞り込みます（filter="prefix"）' },
  play: async ({ canvasElement }) => {
    const control = await openWith(canvasElement, 'か')
    await expect(control).toHaveAttribute('aria-expanded', 'true')
    await expect(canvasElement.querySelectorAll('[role="option"]')).toHaveLength(2)
  },
}

/**
 * `disabled` は部品の属性にしない。ネイティブ `<input disabled>` をそのまま使う（契約外なので手書き）。
 * 生 HTML を 1 つの文字列として渡す（lit のテンプレートに `<option>` を混ぜると、
 * ハイドレーション用のコメントが `<datalist>` の中に入って markuplint が落ちる）
 */
const DISABLED =
  '<rd-combobox><label for="sb-disabled">読み</label>'
  + '<input id="sb-disabled" name="reading" list="sb-disabled-list" type="text"'
  + ' autocomplete="off" disabled>'
  + `<datalist id="sb-disabled-list">${OPTIONS}</datalist></rd-combobox>`

export const Disabled: Story = {
  render: () =>
    html`<form
      @submit=${(event: Event) => {
        event.preventDefault()
      }}
    >
      ${unsafeHTML(DISABLED)}
    </form>`,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: '読み' })).toBeDisabled()
  },
}

/** 候補限定にしたいときは `pattern` で縛る（ネイティブ検証。部品は文言を出すだけ） */
export const Invalid: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('combobox', { name: '読み' })
    await userEvent.click(control)
    await userEvent.tab()
    const error = canvasElement.querySelector('[part="error"]')
    await expect(error).toHaveTextContent('未入力です。入力してください。')
    await expect(control).toHaveAttribute('aria-invalid', 'true')
  },
}

/** ↓ で全候補を出したところ（`aria-activedescendant` が 1 つ目を指す） */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const control = await openWith(canvasElement, '')
    const first = canvasElement.querySelector('[role="option"]')
    await expect(control).toHaveAttribute('aria-expanded', 'true')
    await expect(control).toHaveAttribute('aria-activedescendant', first?.id ?? '')
    await expect(first).toHaveAttribute('aria-selected', 'true')
  },
}

/** 打つと候補が絞られる（大文字小文字・全角半角は `NFKC` でそろえて比べる） */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    await openWith(canvasElement, 'か')
    await expect(canvasElement.querySelectorAll('[role="option"]')).toHaveLength(2)
  },
}

/** 0 件のときは閉じたままにする（空のリストを見せない） */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const control = await openWith(canvasElement, 'ロシア語')
    const host = canvasElement.querySelector('rd-combobox')
    await expect(control).toHaveAttribute('aria-expanded', 'false')
    await expect(host?.matches(':state(empty)')).toBe(true)
  },
}

export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { error: 'その読みは登録できません。別の読みを入力してください。' },
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
