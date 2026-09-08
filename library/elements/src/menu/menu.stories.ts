// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * ティア B。枠だけが shadow にあり、トリガーもリストも light DOM。
 * story も `markup()` から描く（ADR-0012 §5）。JS 無しの見え方は `e2e/pe` が見る。
 * VRT のために **開いた状態**で撮る（閉じたメニューを撮っても面が写らない）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../button/button.define.js'
import '../button/button.css'
import './menu.define.js'
import './menu.css'
import { type MenuMarkupProps, menuItemMarkup, menuMarkup, menuSeparatorMarkup } from './index.js'

type Args = MenuMarkupProps

const ITEMS =
  menuItemMarkup({ label: '複製', href: '#duplicate' })
  + menuItemMarkup({ label: '名前を変える' })
  + menuSeparatorMarkup()
  + menuItemMarkup({ label: '削除' })

const meta: Meta<Args> = {
  title: 'Components/Menu',
  component: 'rd-menu',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-menu'] },
  args: { id: 'sb-menu', label: '操作', items: ITEMS },
  // 下に開くので、開いた面が切れない高さを確保する
  render: (args) =>
    html`<div class="rd-stack" style="min-block-size: 18rem">${unsafeHTML(menuMarkup(args))}</div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

/** トリガーを押すと開く。開いた瞬間に最初の項目へフォーカスが移る（APG） */
const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }): Promise<void> => {
  const trigger = within(canvasElement).getByRole('button', { name: '操作' })
  await userEvent.click(trigger)
  await waitFor(async () => {
    await expect(canvasElement.querySelector('rd-menu')?.matches(':state(open)')).toBe(true)
  })
}

export const Default: Story = { play: openMenu }

/** 閉じている姿。押すまでリストは top layer に出ない */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: '操作' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  },
}

/** `placement` は `start`（既定）と `end` の 2 通り。インライン方向の揃えだけが変わる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack" style="min-block-size: 18rem">
      ${unsafeHTML(menuMarkup({ ...args, id: 'sb-menu-start', label: '始端に揃える' }))}
      ${unsafeHTML(
        menuMarkup({ ...args, id: 'sb-menu-end', label: '終端に揃える', placement: 'end' }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-menu')).toHaveLength(2)
  },
}

/** トリガーの終端に揃える。画面の端で溢れそうなときに使う */
export const Placement: Story = { args: { placement: 'end' }, play: openMenu }

/** 押せない項目は `aria-disabled`。**フォーカスは残す**（見つけられない項目を作らない） */
export const Disabled: Story = {
  args: {
    items:
      menuItemMarkup({ label: '複製', href: '#duplicate' })
      + menuItemMarkup({ label: '書き出し', disabled: true })
      + menuItemMarkup({ label: '削除' }),
  },
  play: async (context) => {
    await openMenu(context)
    const item = within(context.canvasElement).getByRole('menuitem', { name: '書き出し' })
    await expect(item).toHaveAttribute('aria-disabled', 'true')
    await expect(item).not.toHaveAttribute('disabled')
  },
}

/** 区切りは `<hr>`。暗黙の role が `separator` なので role 属性を手で書かない */
export const WithSeparator: Story = {
  play: async (context) => {
    await openMenu(context)
    await expect(context.canvasElement.querySelectorAll('rd-menu hr')).toHaveLength(1)
  },
}

export const Dark: Story = { ...Default, globals: { scheme: 'dark' } }

export const Dense: Story = { ...Default, globals: { density: 'compact' } }

export const RTL: Story = { ...Default, globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  ...Default,
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
  ...Default,
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
