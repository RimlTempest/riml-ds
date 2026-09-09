/**
 * `rd-toggle-group` の DOM 読み書き。判断は `*.logic.ts` の純関数が持ち、ここは
 * 「light DOM から読む」「light DOM に書き戻す」だけを引き受ける（`*.element.ts` を
 * 薄い殻に保つための分割 — plan 031 Step 2）。
 */
import { syncAttribute } from '../_shared/internals.js'
import { toAriaPressed } from '../toggle/toggle.logic.js'
import { ITEM_SELECTOR } from './toggle-group.contract.js'
import type { ItemState } from './toggle-group.logic.js'
import { tabStopIndex } from './toggle-group.logic.js'

/** 列の項目。契約の `item` と同じセレクタで引く */
const itemButtons = (host: ParentNode): readonly HTMLButtonElement[] =>
  [...host.querySelectorAll(ITEM_SELECTOR)].flatMap((node) =>
    node instanceof HTMLButtonElement ? [node] : [],
  )

export type Group = {
  readonly buttons: readonly HTMLButtonElement[]
  readonly items: readonly ItemState[]
}

/**
 * 列を 1 回だけ読む。押下の真実は `aria-pressed`、無効はネイティブの `disabled`。
 * `buttons` は書き戻しとフォーカスに、`items` は純関数の入力に使う。
 */
export const readGroup = (host: ParentNode): Group => {
  const buttons = itemButtons(host)
  return {
    buttons,
    items: buttons.map((button) => ({
      value: button.value,
      pressed: button.getAttribute('aria-pressed') === 'true',
      disabled: button.disabled,
    })),
  }
}

/** 押下を書き戻す。`aria-pressed` は消さない（消すと toggle でなくなる） */
export const applyPressed = (
  buttons: readonly HTMLButtonElement[],
  pressed: readonly boolean[],
): void => {
  buttons.forEach((button, index) => {
    syncAttribute(button, 'aria-pressed', toAriaPressed(pressed[index] === true))
  })
}

/** `values` setter の書き戻し。渡された値だけを押下にする（イベントは出さない） */
export const applyValues = (host: ParentNode, wanted: readonly string[]): void => {
  const { buttons, items } = readGroup(host)
  applyPressed(
    buttons,
    items.map((item) => wanted.includes(item.value)),
  )
}

/**
 * roving tabindex。辿れる 1 個は属性ごと消し（既定 0）、他は `-1`。
 * `disabled` な項目は触らない（ネイティブが既にフォーカスを外している）。
 * **`tabindex` は JS が付ける**ので、JS 無しでは全部 Tab で辿れる（縮退）。
 */
export const applyTabStops = (host: ParentNode): void => {
  const { buttons, items } = readGroup(host)
  const stop = tabStopIndex(items)
  buttons.forEach((button, index) => {
    syncAttribute(
      items[index]?.disabled === true ? undefined : button,
      'tabindex',
      index === stop ? undefined : '-1',
    )
  })
}

/** イベントの発火元が何番目の項目か。項目の外なら `-1` */
export const indexOfItem = (
  buttons: readonly HTMLButtonElement[],
  target: EventTarget | null,
): number => {
  const button = target instanceof Element ? target.closest('button') : null
  return buttons.findIndex((candidate) => candidate === button)
}

/**
 * 押下・無効・項目の増減を見張る。契約の子が無ければ何も張らない。
 * 返した observer は `disconnectedCallback` で切る。
 */
export const observeItems = (
  options: Element | undefined,
  onChange: () => void,
): MutationObserver | undefined => {
  if (options === undefined) {
    return undefined
  }
  const observer = new MutationObserver(onChange)
  observer.observe(options, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-pressed', 'disabled'],
  })
  return observer
}
