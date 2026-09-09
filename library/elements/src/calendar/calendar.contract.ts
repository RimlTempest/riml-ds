/**
 * `rd-calendar` のマークアップ契約（ティア A、ADR-0012）。
 * `<label for>` と `<input type="date">` は**利用側が light DOM に書く**。部品は生成しない。
 * `id` は呼び側が渡す（React は `useId`、Astro は props）。
 *
 * **値の真実は `<input>`**。`min` / `max` / `required` も `<input>` の属性なので、JS が
 * 来なくてもネイティブの検証がそのまま働く（部品は読むだけ）。ホストに載るのは
 * 「今日」（`today`）と週の始まり（`week-start`）——どちらも見え方だけを決める。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="date"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-calendar',
    attrs: { today: '$today', 'week-start': '$weekStart', picker: '$picker' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: 'date',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          required: '$required',
        },
      },
    ],
  },
} as const satisfies Contract

/** 週の始まり。`'0'` は日曜（既定）、`'1'` は月曜 */
export type CalendarWeekStart = '0' | '1' | '2' | '3' | '4' | '5' | '6'

export type CalendarMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name?: string
  /**
   * 選ばれている日（`YYYY-MM-DD`）。`<input value>` に書く。
   * **綴りは `defaultValue`**（React ラッパー生成器がティア A の `<input>` に対して固定している名前。
   * `text-field.contract.ts` と同じ）
   */
  readonly defaultValue?: string
  /** 「今日」。省略すると部品が実時刻から決める。テスト・story は必ず書く */
  readonly today?: string
  /** 週の始まり。`'0'`（日曜、既定）〜 `'6'` */
  readonly weekStart?: CalendarWeekStart
  /** 選べる範囲（`YYYY-MM-DD`）。`<input min max>` に出るので JS 無しでも効く */
  readonly min?: string
  readonly max?: string
  readonly required?: boolean
  /**
   * 月表を常設せず、`<input>` の右のボタンで開く `[popover]` に入れる。
   * JS 無しでは `<input type="date">` だけの普通の入力欄（OS のピッカーが出る）。
   */
  readonly picker?: boolean
}

export const markup = (props: CalendarMarkupProps): string => renderMarkup(contract.tree, props)
