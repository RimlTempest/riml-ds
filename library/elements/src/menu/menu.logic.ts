/**
 * `rd-menu` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * 「開いているか」と「そのときトリガー・各項目に付く属性」だけを決める。
 */

export type MenuItemView = {
  readonly role: 'menuitem'
  /** roving tabindex。Tab では列に入らず、開いたときに element が最初の項目へ移す */
  readonly tabIndex: -1
  /** 押せない項目は `aria-disabled`。`disabled` にはしない（フォーカスは残す） */
  readonly ariaDisabled: 'true' | undefined
}

export type MenuView = {
  readonly expanded: string
  readonly items: readonly MenuItemView[]
  readonly states: ReadonlySet<string>
}

export type MenuViewInput = {
  readonly open: boolean
  /** 各項目が押せないか。並びは DOM の順 */
  readonly disabled: readonly boolean[]
  readonly label: string
  readonly malformed: boolean
}

export const computeMenuView = (input: MenuViewInput): MenuView => {
  const states = [
    input.malformed ? 'malformed' : '',
    input.label === '' ? 'unlabeled' : '',
    input.open ? 'open' : '',
  ].filter((state) => state !== '')
  return {
    expanded: String(input.open),
    items: input.disabled.map((disabled) => ({
      role: 'menuitem',
      tabIndex: -1,
      ariaDisabled: disabled ? 'true' : undefined,
    })),
    states: new Set(states),
  }
}

/** 項目に載せる属性。`aria-disabled` は押せないときだけ出す */
export const menuItemAttributes = (
  item: MenuItemView | undefined,
): Readonly<Record<string, string>> => ({
  role: 'menuitem',
  tabindex: '-1',
  ...(item?.ariaDisabled === undefined ? {} : { 'aria-disabled': item.ariaDisabled }),
})

/** トリガーに載せる属性。`aria-haspopup` は「押すとメニューが出る」ことの予告 */
export const triggerAttributes = (view: MenuView): Readonly<Record<string, string>> => ({
  'aria-haspopup': 'menu',
  'aria-expanded': view.expanded,
})
