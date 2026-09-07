// oxlint-disable import/no-unassigned-import -- define は副作用 import が正しい形
/**
 * ティア C。shadow 完結で、JS が無ければ何も出ない（害が無い）。
 * **読み上げは持たない**：ページに 1 つ置いた `rd-live-region` に委譲する（ADR-0008 §6）。
 * どの story にも `<rd-live-region>` を置く（無いと `console.warn` する契約）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { argTypes } from '@rd-argtypes'
import { shadowText } from '@rd-shadow'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../button/button.define.js'
import '../button/button.css'
import '../live-region/live-region.define.js'
import './toast.define.js'
import { RdToast, type ToastTone } from './index.js'

type Args = { readonly message: string; readonly tone: ToastTone; readonly duration: number }

const toastIn = (canvasElement: HTMLElement): RdToast | undefined => {
  const element = canvasElement.querySelector('rd-toast')
  return element instanceof RdToast ? element : undefined
}

const showFrom = (event: Event, args: Args): void => {
  const target = event.currentTarget
  const toast =
    target instanceof Element
      ? target.closest('[data-toast-scope]')?.querySelector('rd-toast')
      : undefined
  if (toast instanceof RdToast) {
    toast.show(args)
  }
}

const meta: Meta<Args> = {
  title: 'Components/Toast',
  component: 'rd-toast',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-toast'] },
  args: { message: '保存しました', tone: 'info', duration: 0 },
  render: (args) =>
    html`<div data-toast-scope>
      <rd-button>
        <button
          type="button"
          @click=${(event: Event) => {
            showFrom(event, args)
          }}
        >
          保存
        </button>
      </rd-button>
      <rd-toast></rd-toast>
      <rd-live-region></rd-live-region>
    </div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
    await waitFor(async () => {
      await expect(shadowText(toastIn(canvasElement), '[part="message"]')).toBe('保存しました')
    })
  },
}

/** variant は tone の 4 通り。**色だけで意味を伝えない**ので、文言そのものに結果を書く */
export const Variants: Story = {
  args: { message: '保存に失敗しました。もう一度試してください。', tone: 'danger', duration: 0 },
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
    await waitFor(async () => {
      await expect(toastIn(canvasElement)?.matches(':state(danger)')).toBe(true)
    })
  },
}

/** ボタンから出す導線。`duration: 0` は自動で消さない指定 */
export const FromButton: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '保存' }))
    await waitFor(async () => {
      await expect(shadowText(toastIn(canvasElement), '[part="message"]')).toBe('保存しました')
    })
  },
}

/** 閉じるボタンで閉じられる（WCAG 2.2.1「止められること」） */
export const Dismissed: Story = {
  play: async ({ args, canvasElement }) => {
    const toast = toastIn(canvasElement)
    toast?.show(args)
    await waitFor(async () => {
      await expect(toast?.open).toBe(true)
    })
    toast?.close()
    await waitFor(async () => {
      await expect(toast?.open).toBe(false)
    })
  },
}

export const Dark: Story = {
  globals: { scheme: 'dark' },
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
  },
}

export const Dense: Story = {
  globals: { density: 'compact' },
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
  },
}

export const RTL: Story = {
  globals: { dir: 'rtl' },
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
  },
}

export const ForcedColors: Story = {
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
  },
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
  play: async ({ args, canvasElement }) => {
    toastIn(canvasElement)?.show(args)
  },
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
