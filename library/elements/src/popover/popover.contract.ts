/**
 * `rd-popover` のマークアップ契約（ティア B、ADR-0012）。
 * `rd-menu` と同じ骨格（トリガー + `[popover]`）だが、中身は自由（見出し・本文・フォーム）。
 * **モーダルにしない**——画面を止めて確定を迫るものは `rd-dialog`。
 *
 * JS が無くても **HTML だけで開閉する**（`popovertarget` + `[popover]`。Baseline Newly）。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'B',
  roles: {
    trigger: ':scope > [slot="trigger"]',
    panel: ':scope > [popover]',
    // `slot="label"` は**名前の出どころを指す印**（`[popover]` の中は slot されない）。
    // element がここに id を振って `aria-labelledby` で結ぶ
    label: ':scope > [popover] [slot="label"]',
  },
  required: ['trigger', 'panel'],
  tree: {
    tag: 'rd-popover',
    attrs: { placement: '$placement', hover: '$hover' },
    children: [
      // trigger / children は生 HTML。`popovertarget` を木のノードにしないのは
      // ラッパー生成器が React の `popoverTarget` に読み替えられないため
      { raw: '$trigger' },
      {
        tag: 'div',
        attrs: { popover: '', id: '$id' },
        children: [
          { tag: 'h2', slot: 'label', children: [{ prop: 'label' }] },
          { raw: '$children' },
        ],
      },
    ],
  },
} as const satisfies Contract

export type PopoverMarkupProps = {
  /** `[popover]` の id。トリガーの `popovertarget` と同じ値になる */
  readonly id: string
  /** 見出し。そのまま `[popover]` のアクセシブル名になる */
  readonly label: string
  /** 本文。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  /** インライン方向の揃え。`end` はトリガーの終端に揃える */
  readonly placement?: 'start' | 'end'
  /**
   * トリガーに乗せる / フォーカスすると遅れて開く（Hover Card）。
   * **押して開く経路は残る**——ホバーは近道でしかない
   */
  readonly hover?: boolean
}

/**
 * 開くボタン。`popovertarget` が `[popover]` の id を指すことが唯一の約束で、
 * これだけで **JS 無しでも開く**（Popover API。`docs/baseline.md`）。
 */
export const popoverTriggerMarkup = (props: {
  readonly id: string
  readonly label: string
}): string =>
  `<rd-button slot="trigger"><button type="button" popovertarget="${escapeHtml(props.id)}">`
  + `${escapeHtml(props.label)}</button></rd-button>`

export const markup = (props: PopoverMarkupProps): string =>
  renderMarkup(contract.tree, { ...props, trigger: popoverTriggerMarkup(props) })
