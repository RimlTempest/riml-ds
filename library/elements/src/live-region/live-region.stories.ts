// oxlint-disable import/no-unassigned-import -- define は副作用 import が正しい形
/**
 * ティア C。shadow 完結で視覚的には隠れている（`.rd-visually-hidden` と同じ 5 宣言）。
 * マークアップ契約を持たないので story も要素をそのまま置く。JS 無しでは何も起きない（害が無い）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { argTypes } from '@rd-argtypes'
import { shadowText } from '@rd-shadow'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import '../button/button.define.js'
import '../button/button.css'
import './live-region.define.js'
import { RdLiveRegion } from './index.js'

type Args = { readonly message: string }

const regionIn = (canvasElement: HTMLElement): RdLiveRegion | undefined => {
  const element = canvasElement.querySelector('rd-live-region')
  return element instanceof RdLiveRegion ? element : undefined
}

const announceFrom = (event: Event, message: string, politeness: 'polite' | 'assertive'): void => {
  const target = event.currentTarget
  const region =
    target instanceof Element
      ? target.closest('[data-region-scope]')?.querySelector('rd-live-region')
      : undefined
  if (region instanceof RdLiveRegion) {
    region.announce(message, { politeness })
  }
}

const meta: Meta<Args> = {
  title: 'Components/LiveRegion',
  component: 'rd-live-region',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-live-region'] },
  args: { message: '保存しました' },
  render: (args) =>
    html`<div data-region-scope>
      <rd-button>
        <button
          type="button"
          @click=${(event: Event) => {
            announceFrom(event, args.message, 'polite')
          }}
        >
          保存
        </button>
      </rd-button>
      <rd-live-region></rd-live-region>
    </div>`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const region = regionIn(canvasElement)
    region?.announce('保存しました')
    await waitFor(async () => {
      await expect(shadowText(region, '[part="polite"]')).toBe('保存しました')
    })
  },
}

/** polite / assertive の 2 通り。ページに置くリージョンは 1 つのまま（ADR-0008 §6） */
export const Variants: Story = {
  play: async ({ canvasElement }) => {
    const region = regionIn(canvasElement)
    region?.announce('下書きを保存しました')
    region?.announce('保存に失敗しました', { politeness: 'assertive' })
    await waitFor(async () => {
      await expect(shadowText(region, '[part="polite"]')).toBe('下書きを保存しました')
      await expect(shadowText(region, '[part="assertive"]')).toBe('保存に失敗しました')
    })
  },
}

/** JS が無いときと同じ状態。何も出ず、害も無い（ティア C の要件） */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(shadowText(regionIn(canvasElement), '[part="polite"]')).toBe('')
    await expect(shadowText(regionIn(canvasElement), '[part="assertive"]')).toBe('')
  },
}

/** ボタンから積む導線。押しても見た目は変わらない（読み上げだけが変わる） */
export const FromButton: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '保存' }))
    await waitFor(async () => {
      await expect(shadowText(regionIn(canvasElement), '[part="polite"]')).toBe('保存しました')
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
