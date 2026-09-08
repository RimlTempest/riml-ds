/**
 * `rd-combobox` が light DOM を読み書きするための層。判断は `combobox.logic.ts`（純関数）、
 * 位置決めは `_shared/popover-anchor.ts` が持つ。ここにあるのは「読む・書く・型で絞る」だけで、
 * `*.element.ts` を 150 行に収める（ADR-0005）ための置き場でもある。
 *
 * **候補の `<div role="option">` はこの層の `renderField` が描く**（`menu.dom.ts` との違い）。
 * 唯一の出どころは `<datalist>` で、`readCandidates` がそこから読む。
 */
import { html, nothing, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { computeView, type FieldView, usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Listeners } from '../_shared/native-control.js'
import { readAttrs } from '../_shared/native-control.js'
import { anchorPopover } from '../_shared/popover-anchor.js'
import { contract } from './combobox.contract.js'
import type { Candidate, ComboboxState } from './combobox.logic.js'
import { computeComboboxView, filterCandidates, optionId, parseFilter } from './combobox.logic.js'

/** 契約の子。`ok` が false なら `malformed`（部品は自分で `<input>` を作らない） */
export type Wiring = {
  readonly ok: boolean
  readonly control: HTMLInputElement | undefined
  readonly datalist: HTMLDataListElement | undefined
  readonly labelId: string
}

export const NO_WIRING: Wiring = {
  ok: false,
  control: undefined,
  datalist: undefined,
  labelId: '',
}

const asInput = (element: Element | undefined): HTMLInputElement | undefined =>
  element instanceof HTMLInputElement ? element : undefined

const asDatalist = (element: Element | undefined): HTMLDataListElement | undefined =>
  element instanceof HTMLDataListElement ? element : undefined

export const asElement = (node: Element | null | undefined): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

/** 空の `id` にだけ既定値を入れる。利用側が書いていればそのまま尊重する */
const ensureId = (element: Element | undefined, fallback: string): string => {
  if (element === undefined) {
    return ''
  }
  element.id = element.id === '' ? fallback : element.id
  return element.id
}

/**
 * 契約を見て子を掴み、**`list` 属性を外す**（ネイティブの吹き出しと候補リストが二重に出ないように）。
 * 契約の検査は外す前に 1 回だけ——`input[list]` は「JS 無しでも候補が出る形か」を見る役目なので、
 * 定義後に外れていても SSR / JS 無しの HTML は常に `input[list]` のまま（保守メモ）。
 */
export const wire = (host: HTMLElement, name: string): Wiring => {
  const result = checkContract(host, contract)
  if (result.kind === 'missing') {
    const missing = result.roles.join(', ')
    console.error(
      `[rd-combobox] <label for> と <input list> と <datalist> が必要（不足: ${missing}）`,
    )
  }
  const found: Readonly<Record<string, Element>> = result.kind === 'ok' ? result.found : {}
  const control = asInput(found['control'])
  control?.removeAttribute('list')
  const datalist = asDatalist(found['options'])
  // 候補は `[part='list']` に写したので、`<datalist>` は**データの置き場**として残すだけにする
  // （読み上げに二重で出さない。ブラウザは元から描かないが、木からも外しておく）
  datalist?.setAttribute('aria-hidden', 'true')
  return {
    ok: result.kind === 'ok',
    control,
    datalist,
    labelId: ensureId(found['label'], `${name}-label`),
  }
}

/**
 * `<datalist>` の候補。`option.label` は「`label` 属性、無ければテキスト」を返すので、
 * それも空なら `value` を表示名にする（HTML の意味論どおり）。
 */
export const readCandidates = (datalist: HTMLDataListElement | undefined): readonly Candidate[] =>
  [...(datalist?.options ?? [])].map((option) => ({
    value: option.value,
    label: option.label === '' ? option.value : option.label,
  }))

/** いまの入力と `filter` で絞った候補（`<datalist>` を読んで純関数に渡すだけ） */
export const matchesOf = (wiring: Wiring, query: string, filter: string): readonly Candidate[] =>
  filterCandidates(readCandidates(wiring.datalist), query, parseFilter(filter))

/** `<option>` の増減・書き換えに追随する（候補の唯一の出どころは `<datalist>`） */
export const observeOptions = (
  datalist: HTMLDataListElement | undefined,
  onChange: () => void,
): MutationObserver | undefined => {
  if (datalist === undefined) {
    return undefined
  }
  const observer = new MutationObserver(onChange)
  observer.observe(datalist, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })
  return observer
}

/** `KeyboardEvent` でなければ空のキー（`Listeners` は `Event` しか渡さない） */
export const keyOf = (event: Event): { readonly key: string; readonly altKey: boolean } =>
  event instanceof KeyboardEvent
    ? { key: event.key, altKey: event.altKey }
    : { key: '', altKey: false }

/** フォーカスが候補リストの中へ移ったか（ポインタで候補を押している途中は閉じない） */
export const movedInto = (event: Event, list: HTMLElement | undefined): boolean =>
  event instanceof FocusEvent
  && event.relatedTarget instanceof Node
  && list !== undefined
  && list.contains(event.relatedTarget)

/** ポインタが指している候補の番号（id の末尾が番号。`optionId`）。候補の外なら -1 */
export const optionIndexOf = (event: Event): number => {
  const target = event.target instanceof Element ? event.target.closest('[role="option"]') : null
  const id = target?.id ?? ''
  return id === '' ? -1 : Number(id.slice(id.lastIndexOf('-') + 1))
}

/** 候補の上で押されたときだけ既定動作を止める（入力欄のフォーカスを奪わない。APG） */
const preventOnOption = (event: Event): void => {
  if (optionIndexOf(event) >= 0) {
    event.preventDefault()
  }
}

/** いまの開閉と違うときだけ動かす（`popover="manual"` なので部品が開け閉めする） */
const togglePopover = (list: HTMLElement | undefined, open: boolean): void => {
  if (list === undefined || list.matches(':popover-open') === open) {
    return
  }
  if (open) {
    list.showPopover()
  } else {
    list.hidePopover()
  }
}

/** 1 回の更新に要るものを 1 つにまとめたもの。`applyUpdate` と `renderField` の唯一の入力 */
export type Snapshot = {
  readonly wiring: Wiring
  readonly name: string
  readonly state: ComboboxState
  readonly hint: string
  readonly error: string
  readonly touched: boolean
  readonly candidates: readonly Candidate[]
  readonly list: HTMLElement | undefined
  readonly host: HTMLElement
  readonly onClick: (event: Event) => void
}

/** ティア A 共通の文言・状態（`_shared/field.ts`）に、この部品の入力欄を読ませる */
const fieldView = (snap: Snapshot): FieldView => {
  const control = snap.wiring.control
  return computeView({
    controlId: control?.id ?? '',
    error: snap.error,
    validity: control?.validity ?? {},
    validationMessage: control?.validationMessage ?? '',
    attrs: readAttrs(control, ['type', 'minlength', 'maxlength', 'title']),
    japanese: usesJapaneseCopy(snap.host),
    malformed: !snap.wiring.ok,
    invalid: control?.validity.valid === false,
    touched: snap.touched,
    hasHint: snap.hint !== '',
    hasError: snap.error !== '',
    filled: (control?.value ?? '') !== '',
  })
}

/** ネイティブ要素・候補リストへの反映。判断は `computeComboboxView` が済ませている */
export const applyUpdate = (internals: ElementInternals, snap: Snapshot): void => {
  const control = snap.wiring.control
  const field = fieldView(snap)
  const view = computeComboboxView({
    ...snap.state,
    count: snap.candidates.length,
    query: control?.value ?? '',
    name: snap.name,
    field,
  })
  syncStates(internals, view.states)
  Object.entries(view.inputAttrs).forEach(([attr, value]) => control?.setAttribute(attr, value))
  syncAttribute(control, 'aria-activedescendant', view.activeId)
  syncAttribute(control, 'aria-describedby', field.describedBy)
  syncAttribute(control, 'aria-invalid', field.ariaInvalid)
  togglePopover(snap.list, snap.state.open)
  anchorPopover(control, snap.list, snap.name, { placement: 'start' })
}

/** ネイティブ要素に配るリスナ。`change` / `invalid` は「触った」を立てるだけ */
export const listenersFor = (handlers: {
  readonly input: () => void
  readonly keydown: (event: Event) => void
  readonly blur: (event: Event) => void
  readonly touched: () => void
}): Listeners => ({
  input: handlers.input,
  keydown: handlers.keydown,
  blur: handlers.blur,
  change: handlers.touched,
  invalid: (event) => {
    event.preventDefault()
    handlers.touched()
  },
})

/** 候補を確定する。ネイティブと同じ順で `input` → `change` を出してから `rd-select` を知らせる */
export const commitCandidate = (
  host: HTMLElement,
  control: HTMLInputElement | undefined,
  candidate: Candidate | undefined,
  index: number,
): void => {
  if (candidate === undefined || control === undefined) {
    return
  }
  control.value = candidate.value
  control.dispatchEvent(new Event('input', { bubbles: true }))
  control.dispatchEvent(new Event('change', { bubbles: true }))
  const detail = { value: candidate.value, index }
  host.dispatchEvent(new CustomEvent('rd-select', { bubbles: true, composed: true, detail }))
}

/** 候補 1 つ。番号は id の末尾から引く（`optionIndexOf`） */
const optionNode = (snap: Snapshot, item: Candidate, index: number): TemplateResult => {
  const on = index === snap.state.active
  const id = optionId(snap.name, index)
  return html`<div role="option" id=${id} aria-selected=${on}>${item.label}</div>`
}

/**
 * 候補リスト。`popover="manual"` なので開け閉めは部品が行う（light dismiss にしない）。
 * 0 件のときは `role="listbox"` を出さない——空の listbox は WAI-ARIA の Required Owned Elements を
 * 満たさない。0 件なら必ず閉じている（`empty`）ので読み上げにも出ない。
 */
const listNode = (snap: Snapshot): TemplateResult => {
  // 0 件なら listbox として出さない（role も名前も付けない。generic に aria-labelledby は書けない）
  const listbox = snap.candidates.length > 0
  return html`<div
    part="list"
    id=${snap.name}
    role=${listbox ? 'listbox' : nothing}
    popover="manual"
    aria-labelledby=${listbox && snap.wiring.labelId !== '' ? snap.wiring.labelId : nothing}
    @pointerdown=${preventOnOption}
    @click=${snap.onClick}
  >
    ${snap.candidates.map((item, index) => optionNode(snap, item, index))}
  </div>`
}

/**
 * 強化ノード（hint / error / 候補リスト）。既存の子は消さず末尾に足す。
 * 候補は `<datalist>` の写しなので、利用側は `<option>` を書き換えればよい。
 */
export const renderField = (snap: Snapshot): TemplateResult => {
  const field = fieldView(snap)
  const hint = snap.hint === '' ? nothing : html`<p part="hint" id=${field.hintId}>${snap.hint}</p>`
  const error =
    field.message === '' ? nothing : html`<p part="error" id=${field.errorId}>${field.message}</p>`
  return html`${hint}${error}${listNode(snap)}`
}
