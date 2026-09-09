// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` も `<input type="date">` も
 * light DOM に居るので、`within(canvasElement).getByLabelText()` が shadow をまたがずに引ける。
 *
 * **`today` と `defaultValue` はすべての story で固定する**（時計に依存すると VRT と axe が
 * 日付で揺れる。riml-ds-element skill §5）。月名・曜日名は `Intl` がページの言語で決めるので、
 * 言語を変える story は wrapper の `lang` で切り替える。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './calendar.define.js'
import './calendar.css'
import { calendarMarkup, type CalendarMarkupProps } from './index.js'

type Args = CalendarMarkupProps

/** 「今日」。この日を動かすと VRT の画像が全部変わる */
const TODAY = '2026-09-09'

const inLang = (lang: string, args: Args): TemplateResult =>
  html`<div lang=${lang}>${unsafeHTML(calendarMarkup(args))}</div>`

const controlOf = (canvasElement: HTMLElement): HTMLInputElement | null =>
  canvasElement.querySelector('rd-calendar > input')

const meta: Meta<Args> = {
  title: 'Components/Calendar',
  component: 'rd-calendar',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-calendar'] },
  args: {
    id: 'sb-calendar',
    label: '期限',
    name: 'due',
    today: TODAY,
    defaultValue: '2026-09-15',
  },
  render: (args) => inLang('ja', args),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // <label for> がネイティブに <input> を指し、月表は同じ <label> を aria-labelledby で借りる
    await expect(controlOf(canvasElement)).toHaveAccessibleName('期限')
    await expect(within(canvasElement).getByRole('grid', { name: '期限' })).toBeInTheDocument()
    await expect(canvasElement.querySelector('[part="title"]')).toHaveTextContent('2026年9月')
  },
}

/** 月名・曜日名は `Intl` がページの言語で決める。文言（前の月 / 次の月）も英語になる */
export const English: Story = {
  args: { label: 'Due date' },
  render: (args) => inLang('en-US', args),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[part="title"]')).toHaveTextContent('September 2026')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Previous month' }),
    ).toBeInTheDocument()
  },
}

/** 週の始まりは属性で受ける（週情報を返す `Intl` の拡張は Baseline 外なので使わない） */
export const MondayStart: Story = {
  args: { weekStart: '1' },
  play: async ({ canvasElement }) => {
    const heads = [...canvasElement.querySelectorAll('rd-calendar th')]
    await expect(heads.map((th) => th.textContent)).toEqual([
      '月',
      '火',
      '水',
      '木',
      '金',
      '土',
      '日',
    ])
  },
}

/** `min` / `max` は `<input>` の属性。JS 無しでもネイティブの検証が効く */
export const Range: Story = {
  args: { min: '2026-09-05', max: '2026-09-25' },
  play: async ({ canvasElement }) => {
    const outside = canvasElement.querySelector('[data-iso="2026-09-30"]')
    await expect(outside).toHaveAttribute('aria-disabled', 'true')
    await expect(canvasElement.querySelector('[data-iso="2026-09-10"]')).not.toHaveAttribute(
      'aria-disabled',
    )
  },
}

/** 値が無いときは「今日」に焦点が置かれる（選択はされていない） */
export const Empty: Story = {
  args: { defaultValue: '' },
  play: async ({ canvasElement }) => {
    const calendar = canvasElement.querySelector('rd-calendar')
    await expect(calendar?.matches(':state(empty)')).toBe(true)
    await expect(canvasElement.querySelector(`[data-iso="${TODAY}"]`)).toHaveAttribute(
      'tabindex',
      '0',
    )
  },
}

/**
 * `required` も `<input>` の属性。検証はネイティブに委譲する（`reportValidity()` は
 * `<input>` の吹き出しを出す）。赤い枠は利用者が欄を離れてから（`:user-invalid`）。
 */
export const Required: Story = {
  args: { defaultValue: '', required: true },
  play: async ({ canvasElement }) => {
    await expect(controlOf(canvasElement)).toBeRequired()
    await expect(canvasElement.querySelector('rd-calendar')?.checkValidity()).toBe(false)
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
