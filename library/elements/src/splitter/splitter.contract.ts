/**
 * `rd-splitter` のマークアップ契約（ティア B、ADR-0012）。
 * つまみだけが shadow にあり、2 つの面（`slot="start"` / `slot="end"`）は light DOM。
 *
 * JS が無いときは **2 つの面が縦に積まれて読める**（`splitter.css` の `:not(:defined)`）。
 * 割合を変えるのは JS が来てからで、それまでは両方の面が全部見えているのが正しい姿。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

/** 面の並び。`horizontal`（既定）は横に並び、`vertical` は縦に積まれる（shadcn と同じ語） */
export type SplitterDirection = 'horizontal' | 'vertical'

export const contract = {
  pe: 'B',
  roles: {
    start: ':scope > [slot="start"]',
    end: ':scope > [slot="end"]',
  },
  required: ['start', 'end'],
  tree: {
    tag: 'rd-splitter',
    attrs: {
      label: '$label',
      direction: '$direction',
      position: '$position',
      min: '$min',
      max: '$max',
    },
    children: [
      // start / end は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す
      { tag: 'div', slot: 'start', children: [{ raw: '$start' }] },
      { tag: 'div', slot: 'end', children: [{ raw: '$end' }] },
    ],
  },
} as const satisfies Contract

export type SplitterMarkupProps = {
  /** つまみのアクセシブル名（`role="separator"` の `aria-label`）。**省略不可** */
  readonly label: string
  /** 始端側の面。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly start: string
  /** 終端側の面。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly end: string
  /** 面の並び。既定は `horizontal`（横に並ぶ） */
  readonly direction?: SplitterDirection
  /** 始端側の面が取る割合（%）。既定 50 */
  readonly position?: number
  /** `position` の下限（%）。既定 20 */
  readonly min?: number
  /** `position` の上限（%）。既定 80 */
  readonly max?: number
}

/** 属性はすべて文字列で書く（ラッパーの props も文字列。`rd-slider` の `min` と同じ） */
const asAttr = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value)

export const markup = (props: SplitterMarkupProps): string =>
  renderMarkup(contract.tree, {
    ...props,
    position: asAttr(props.position),
    min: asAttr(props.min),
    max: asAttr(props.max),
  })
