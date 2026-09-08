/**
 * `rd-popover` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 */

export type PopoverView = {
  readonly expanded: string
  readonly states: ReadonlySet<string>
}

export type PopoverViewInput = {
  readonly open: boolean
  /** `[slot="label"]` の見出しがある */
  readonly labeled: boolean
  readonly malformed: boolean
}

export const computePopoverView = (input: PopoverViewInput): PopoverView => {
  const states = [
    input.malformed ? 'malformed' : '',
    input.labeled ? '' : 'unlabeled',
    input.open ? 'open' : '',
  ].filter((state) => state !== '')
  return { expanded: String(input.open), states: new Set(states) }
}

/**
 * `[popover]` に載せる属性。**非モーダルの `dialog`**（`rd-dialog` の `showModal()` とは別物）。
 * `tabindex="-1"` は「押せるものが 1 つも無い中身」でも開いた先に入れるようにするため。
 */
export const panelAttributes = (labelId: string): Readonly<Record<string, string>> => ({
  role: 'dialog',
  ...(labelId === '' ? {} : { 'aria-labelledby': labelId }),
  tabindex: '-1',
})

/** トリガーに載せる属性。`aria-haspopup` は「押すと重ね物が出る」ことの予告 */
export const triggerAttributes = (view: PopoverView): Readonly<Record<string, string>> => ({
  'aria-haspopup': 'dialog',
  'aria-expanded': view.expanded,
})
