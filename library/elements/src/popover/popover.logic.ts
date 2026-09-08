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

/**
 * Hover Card（`hover` 属性）の待ち時間（ms）。**数字はここ 1 か所**——
 * `--rd-motion-duration-*` はトークンにあるが、これは見た目の時間ではなく操作の猶予なので
 * JS から読まない。開くほうを長く待つのは、通り過ぎただけで面が出ないようにするため。
 */
export const hoverTimings = { open: 300, close: 200 } as const

/** `contains` だけを見る器。実 DOM が無い node のテストでも回せる（`checkContract` と同じ形） */
export type ContainerLike<N> = { readonly contains: (node: N) => boolean }

/**
 * ポインタ / フォーカスが離れたときに閉じるか。行き先（`relatedTarget`）がトリガーか
 * 面の中なら**閉じない**——トリガーから面へ渡るあいだに一度離れるため（WCAG 1.4.13）。
 */
export const shouldCloseOnLeave = <N>(
  next: N,
  panel: ContainerLike<N> | undefined,
  trigger: ContainerLike<N> | undefined,
): boolean => panel?.contains(next) !== true && trigger?.contains(next) !== true
