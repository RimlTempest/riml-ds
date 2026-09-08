// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア A。`markup()` から描く（ADR-0012 §5）。`<label for>` も項目のリンク／ボタンも
 * light DOM に居るので、`within(canvasElement).getByRole('searchbox')` が shadow をまたがずに引ける。
 * JS が無いときは入力欄が飾りになるだけで、一覧はそのまま辿れる（`e2e/pe` が見る）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { dialogsAreSteady } from '@rd-shadow'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../dialog/dialog.define.js'
import '../dialog/dialog.css'
import '../button/button.define.js'
import '../button/button.css'
import { dialogMarkup, RdDialog } from '../dialog/index.js'
import './command.define.js'
import './command.css'
import {
  commandGroupMarkup,
  commandItemMarkup,
  commandMarkup,
  type CommandMarkupProps,
} from './index.js'

type Args = CommandMarkupProps

const PAGES = commandGroupMarkup({
  label: 'ページ',
  items:
    commandItemMarkup({ label: 'ホーム', href: '/', keywords: 'home top', shortcut: '⌘1' })
    + commandItemMarkup({
      label: '設定',
      href: '/settings',
      keywords: 'せってい settings preferences',
      shortcut: '⌘,',
    })
    + commandItemMarkup({ label: '下書き', href: '/drafts', keywords: 'したがき drafts' }),
})

const ACTIONS = commandGroupMarkup({
  label: '操作',
  items:
    commandItemMarkup({
      label: '新しいノート',
      value: 'new',
      keywords: 'あたらしい new note',
      shortcut: '⌘N',
    }) + commandItemMarkup({ label: '共有', value: 'share', keywords: 'きょうゆう share' }),
})

const searchbox = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByRole('searchbox', { name: 'コマンド' })

/** 見えている項目の文言（`<li hidden>` は数えない） */
const shown = (canvasElement: HTMLElement): readonly string[] =>
  [...canvasElement.querySelectorAll<HTMLElement>('rd-command li')]
    .filter((li) => !li.hidden)
    .map((li) => li.textContent?.trim() ?? '')

const meta: Meta<Args> = {
  title: 'Components/Command',
  component: 'rd-command',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-command'] },
  args: {
    id: 'sb-command',
    label: 'コマンド',
    placeholder: '打って絞り込む',
    groups: PAGES + ACTIONS,
  },
  render: (args) => html`${unsafeHTML(commandMarkup(args))}`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const control = searchbox(canvasElement)
    // 役割は書き換えない（項目は本物のリンクとボタンのまま）
    await expect(control).toHaveAttribute('aria-controls')
    await expect(canvasElement.querySelectorAll('[role="option"]')).toHaveLength(0)
    await expect(shown(canvasElement)).toHaveLength(5)
  },
}

/** グループは `<ul>` を分けるだけ。見出しは `aria-label` から CSS が描く */
export const Grouped: Story = {
  play: async ({ canvasElement }) => {
    const lists = canvasElement.querySelectorAll('rd-command > ul[aria-label]')
    await expect(lists).toHaveLength(2)
    await expect(within(canvasElement).getByRole('list', { name: '操作' })).toBeInTheDocument()
  },
}

/** 打った文字で項目を隠す。当たった項目が無いグループは `<ul>` ごと隠れる */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(searchbox(canvasElement), 'せ')
    await expect(shown(canvasElement)).toEqual(['設定⌘,'])
    const groups = canvasElement.querySelectorAll<HTMLElement>('rd-command > ul')
    await expect(groups[1]?.hidden).toBe(true)
  },
}

/** 0 件のときだけ `[part="empty"]` を見せる（件数は読み上げない。ADR-0008 §6） */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(searchbox(canvasElement), 'みつからない')
    const empty = canvasElement.querySelector('[part="empty"]')
    await expect(empty).toBeVisible()
    await expect(empty).toHaveTextContent('見つかりません')
    await expect(canvasElement.querySelector('rd-command')?.matches(':state(empty)')).toBe(true)
  },
}

/**
 * ⌘K は部品に持たせない。利用側が `keydown` を拾って `rd-dialog` を開く。
 * **開いたあとに入力欄へフォーカスを移すのも利用側**——`showModal()` は帯の × に
 * フォーカスを置くので（`rd-dialog` の JSDoc）、パレットは自分で入力欄を掴む。
 */
const focusPalette = (scope: Element | null | undefined): boolean => {
  const control = scope?.querySelector('rd-command input')
  if (!(control instanceof HTMLElement)) {
    return false
  }
  control.focus()
  return true
}

const openNearest = (event: Event): void => {
  const target = event.currentTarget
  const scope = target instanceof Element ? target.closest('[data-dialog-scope]') : null
  const dialog = scope?.querySelector('rd-dialog')
  if (dialog instanceof RdDialog) {
    dialog.show()
    // `showModal()` は次の更新で走り、帯の × にフォーカスを置く。そのあとで入力欄を掴む
    void dialog.updateComplete.then(() => focusPalette(scope))
  }
}

export const InDialog: Story = {
  render: (args) =>
    html`<div data-dialog-scope>
      <rd-button>
        <button type="button" @click=${openNearest}>コマンドパレットを開く（⌘K）</button>
      </rd-button>
      ${unsafeHTML(dialogMarkup({ label: 'コマンドパレット', children: commandMarkup(args) }))}
    </div>`,
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', {
      name: 'コマンドパレットを開く（⌘K）',
    })
    opener.focus()
    await userEvent.click(opener)
    await expect(canvasElement.querySelector('rd-dialog')?.open).toBe(true)
    await waitFor(async () => {
      await expect(searchbox(canvasElement)).toHaveFocus()
    })
    // 窓の中でもそのまま打てる（フォーカスを入力欄へ移すのは利用側の仕事）
    await userEvent.keyboard('せ')
    await expect(shown(canvasElement)).toEqual(['設定⌘,'])
    // 窓の枠の遷移が終わるまで待つ。途中を axe が掴むとコントラスト違反に見える（CI で落ちた）
    await waitFor(async () => {
      await expect(dialogsAreSteady()).toBe(true)
      await expect(document.getAnimations()).toHaveLength(0)
    })
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
