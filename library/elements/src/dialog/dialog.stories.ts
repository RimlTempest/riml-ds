// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。枠（`<dialog>`）だけが shadow にあり、見出し・本文・アクションはすべて slot。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方（`:not(:defined)`）は `e2e/pe` が見る。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { queryShadow } from '@rd-shadow'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../button/button.define.js'
import '../button/button.css'
import './dialog.define.js'
import './dialog.css'
import { dialogMarkup, type DialogMarkupProps, RdDialog } from './index.js'

type Args = DialogMarkupProps

const openNearest = (event: Event): void => {
  const target = event.currentTarget
  const dialog =
    target instanceof Element
      ? target.closest('[data-dialog-scope]')?.querySelector('rd-dialog')
      : undefined
  if (dialog instanceof RdDialog) {
    dialog.show()
  }
}

const example = (args: Args, openerLabel: string) =>
  html`<div data-dialog-scope>
    <rd-button>
      <button type="button" @click=${openNearest}>${openerLabel}</button>
    </rd-button>
    ${unsafeHTML(dialogMarkup(args))}
  </div>`

const dialogIn = (canvasElement: HTMLElement): RdDialog | undefined => {
  const element = canvasElement.querySelector('rd-dialog')
  return element instanceof RdDialog ? element : undefined
}

/**
 * 開いた状態で描く story は、`@starting-style` の opacity 遷移が終わるまで待つ。
 * 遷移の途中を axe が掴むと、半透明の枠が背面（backdrop）と混ざってコントラスト違反に見える。
 * 待つのは `document.getAnimations()`（shadow 内の遷移も含まれる）。
 */
const settled = async (): Promise<void> => {
  await Promise.all(document.getAnimations().map((animation) => animation.finished))
}

const meta: Meta<Args> = {
  title: 'Components/Dialog',
  component: 'rd-dialog',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-dialog'] },
  args: {
    label: '確認',
    children:
      '<p>保存しますか？</p><rd-button slot="actions"><button type="button">保存</button></rd-button>',
  },
  render: (args) => example(args, '確認を開く'),
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: '確認を開く' })
    // `show()` は「いま focus のある要素」を戻り先として覚える。並列実行でウィンドウが
    // 非アクティブだと click だけでは activeElement が body のままになることがあるので、
    // 戻り先を先に確定させる。
    opener.focus()
    await userEvent.click(opener)
    const dialog = dialogIn(canvasElement)
    await expect(dialog?.open).toBe(true)
    await expect(queryShadow(dialog, 'dialog')).toHaveAttribute(
      'aria-labelledby',
      'rd-dialog-label',
    )
    // 帯の左端の × が閉じるボタン（ADR-0014 決定 4）。開く遷移の途中なので見た目は VRT が見る
    await expect(queryShadow(dialog, 'button[data-action=close]')).toBeInTheDocument()
    // Esc はブラウザ内蔵の動作で信頼済みイベントでしか起きない（合成イベントでは閉じない）。
    // Esc の導線は `e2e/a11y/keyboard.spec.ts` が実キー入力で見る。
    // ここは閉じたあとのフォーカス復帰（部品の責務）だけを見る。
    dialog?.close('api')
    await waitFor(async () => {
      await expect(dialog?.open).toBe(false)
    })
    await expect(opener).toHaveFocus()
    // 閉じる遷移の途中を axe が掴むと、消えかけの枠が背面と混ざってコントラスト違反に見える
    await settled()
  },
}

/** variant は `persistent` の 2 通り。閉じた状態を並べて見せる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${example({ ...args, label: '確認' }, '閉じられる（既定）')}
      ${example({ ...args, label: '確定', persistent: true }, '閉じられない（persistent）')}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-dialog')).toHaveLength(2)
  },
}

export const Open: Story = { args: { open: true }, play: settled }

/**
 * `persistent` は Esc も背面クリックも受けない。`Disabled` に相当する状態。
 * 既定 false の boolean 属性なので、`markup({ persistent: true })` が属性をそのまま出せる
 * （既定 true の名前では属性で false を表せなかった。plan 009 Step 0 で反転した）。
 * Esc を実際に押して閉じないことは `e2e/a11y/keyboard.spec.ts` が見る（合成イベントでは再現できない）。
 */
export const Persistent: Story = {
  args: { open: true, persistent: true },
  play: async ({ canvasElement }) => {
    await settled()
    const dialog = dialogIn(canvasElement)
    await expect(dialog?.open).toBe(true)
    await expect(dialog?.persistent).toBe(true)
    // 閉じられないので × を出さない（押せないボタンを置かない）
    await expect(queryShadow(dialog, 'button[data-action=close]')).toBeNull()
  },
}

export const Dark: Story = { args: { open: true }, globals: { scheme: 'dark' }, play: settled }

export const Dense: Story = {
  args: { open: true },
  globals: { density: 'compact' },
  play: settled,
}

export const RTL: Story = { args: { open: true }, globals: { dir: 'rtl' }, play: settled }

export const ForcedColors: Story = {
  args: { open: true },
  play: settled,
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
  args: { open: true },
  play: settled,
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
