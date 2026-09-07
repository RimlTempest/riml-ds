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

const meta: Meta<Args> = {
  title: 'Components/Dialog',
  component: 'rd-dialog',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-dialog'] },
  args: {
    label: '確認',
    children:
      '<p>保存しますか？</p><rd-button slot="actions"><button type="button">保存</button></rd-button>',
    dismissible: true,
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
    // Esc はブラウザ内蔵の動作で信頼済みイベントでしか起きない（合成イベントでは閉じない）。
    // Esc の導線は `e2e/a11y/keyboard.spec.ts` が実キー入力で見る。
    // ここは閉じたあとのフォーカス復帰（部品の責務）だけを見る。
    dialog?.close('api')
    await waitFor(async () => {
      await expect(dialog?.open).toBe(false)
    })
    await expect(opener).toHaveFocus()
  },
}

/** variant は `dismissible` の 2 通り。閉じた状態を並べて見せる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack">
      ${example({ ...args, label: '確認' }, '閉じられる（dismissible）')}
      ${example({ ...args, label: '確定', dismissible: false }, '閉じられない（persistent）')}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-dialog')).toHaveLength(2)
  },
}

export const Open: Story = { args: { open: true } }

/**
 * `dismissible: false` は Esc も背面クリックも受けない。`Disabled` に相当する状態。
 *
 * **既定が true の boolean 属性は HTML で「false」を書けない**（属性が在れば true）。
 * `markup({ dismissible: false })` は属性を省くだけなので、部品は既定の true のまま立ち上がる。
 * story はプロパティで倒して見せる。契約の欠陥として plan 004 に差し戻す（`persistent` のような
 * 既定 false の名前に反転するのが正しい）。
 * Esc を実際に押して閉じないことは `e2e/a11y/keyboard.spec.ts` が見る（合成イベントでは再現できない）。
 */
export const Persistent: Story = {
  args: { open: true, dismissible: false },
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement)
    await expect(dialog?.open).toBe(true)
    if (dialog !== undefined) {
      dialog.dismissible = false
    }
    await dialog?.updateComplete
    await expect(dialog?.dismissible).toBe(false)
  },
}

export const Dark: Story = { args: { open: true }, globals: { scheme: 'dark' } }

export const Dense: Story = { args: { open: true }, globals: { density: 'compact' } }

export const RTL: Story = { args: { open: true }, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  args: { open: true },
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
