/**
 * `rd-number-field` が light DOM を読み書きするための層。判断は `number-field.logic.ts`（純関数）が
 * 持ち、ここにあるのは「読む・書く・型で絞る・木を作る」だけ——`*.element.ts` を 150 行に収める
 * （ADR-0005）ための置き場でもある。
 *
 * 刻みはネイティブの spinner API を呼ばず、純関数が決めた文字列を `input.value` に書いて
 * **`input` → `change`** の順に知らせる（`v-model` / `onChange` はこの 2 つを見る）。
 * 独自イベントは出さない——値の真実は `<input>` で、購読は `<input>` に付ける（`rd-text-field` と同じ）。
 */
import { html, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import type { Listeners } from '../_shared/native-control.js'
import { bindListeners, readAttrs } from '../_shared/native-control.js'
import { contract } from './number-field.contract.js'
import {
  computeNumberFieldView,
  type NumberFieldView,
  type StepAttrs,
  type StepDirection,
  stepValue,
} from './number-field.logic.js'

/** ネイティブが持つ値と範囲。変わったらボタンの無効を描き直す（rd-slider と同じ仕組み） */
const OBSERVED = ['value', 'min', 'max', 'step', 'disabled']

/** 契約の子と、そこに配ったリスナ・観測。`ok` が false なら `malformed` */
export type Attached = {
  readonly ok: boolean
  readonly control: HTMLInputElement | undefined
  readonly detach: () => void
}

export const NOT_ATTACHED: Attached = { ok: false, control: undefined, detach: () => {} }

/** ホストが持つ「部品側の状態」。値・範囲・検証はすべて `<input>` から読む */
export type FieldFlags = {
  readonly hint: string
  readonly error: string
  readonly touched: boolean
}

/**
 * 契約を見て `<input type="number">` を掴み、ネイティブのイベントと属性の変化に繋ぐ。
 * `<form>` の `reset` も聞く（`touched` を戻す。`rd-text-field` と同じ）。
 */
export const attach = (
  host: HTMLElement,
  listeners: Listeners,
  formListeners: Listeners,
  onRedraw: () => void,
): Attached => {
  const result = checkContract(host, contract)
  if (result.kind === 'missing') {
    const missing = result.roles.join(', ')
    console.error(
      `[rd-number-field] <label for> と <input type="number"> が必要（不足: ${missing}）`,
    )
  }
  const found = result.kind === 'ok' ? result.found['control'] : undefined
  const control = found instanceof HTMLInputElement ? found : undefined
  const bindings = [
    bindListeners(control, listeners),
    bindListeners(host.closest('form'), formListeners),
  ]
  const observer = new MutationObserver(onRedraw)
  observer.observe(host, { attributes: true, attributeFilter: OBSERVED, subtree: true })
  return {
    ok: result.kind === 'ok',
    control,
    detach: () => {
      bindings.forEach((binding) => {
        binding.detach()
      })
      observer.disconnect()
    },
  }
}

/** 純関数に渡す形。値は要素のプロパティ、範囲と刻みは属性から読む */
export const readStepAttrs = (control: HTMLInputElement | undefined): StepAttrs => {
  const attrs = readAttrs(control, ['min', 'max', 'step'])
  return {
    value: control?.value ?? '',
    min: attrs['min'],
    max: attrs['max'],
    step: attrs['step'],
  }
}

/** 1 回の更新に要るものを全部まとめる。`*.element.ts` は返り値を反映するだけ */
export const viewOf = (
  host: HTMLElement,
  attached: Attached,
  flags: FieldFlags,
): NumberFieldView => {
  const control = attached.control
  return computeNumberFieldView({
    ...readStepAttrs(control),
    controlId: control?.id ?? host.querySelector(contract.roles.control)?.id ?? '',
    error: flags.error,
    validity: control?.validity ?? {},
    validationMessage: control?.validationMessage ?? '',
    attrs: readAttrs(control, ['type', 'min', 'max', 'step']),
    japanese: usesJapaneseCopy(host),
    malformed: !attached.ok,
    invalid: control?.validity.valid === false,
    touched: flags.touched,
    hasHint: flags.hint !== '',
    hasError: flags.error !== '',
    filled: (control?.value ?? '') !== '',
    disabled: control?.disabled ?? false,
  })
}

/** 値を書いてネイティブと同じ形で知らせる。押した人の焦点は動かさない */
export const applyStep = (
  control: HTMLInputElement | undefined,
  direction: StepDirection,
): void => {
  if (control === undefined) {
    return
  }
  control.value = stepValue(readStepAttrs(control), direction)
  control.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  control.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
}

/**
 * 44px の − / +。`tabindex="-1"` なのは、キーボード利用者が入力欄の ↑↓ で刻めるから
 * （APG Spinbutton の Note、react-aria NumberField と同じ）。タッチ・ポインタ・
 * スクリーンリーダーのタッチ探索では押せる。文字は U+2212 と U+002B。
 */
export const stepperTemplate = (
  view: NumberFieldView,
  onStep: (direction: StepDirection) => void,
): TemplateResult =>
  html`<span part="stepper"
    ><button
      type="button"
      part="decrement"
      tabindex="-1"
      aria-label=${view.decrementLabel}
      ?disabled=${!view.canDecrement}
      @click=${() => {
        onStep(-1)
      }}
    >
      −</button
    ><button
      type="button"
      part="increment"
      tabindex="-1"
      aria-label=${view.incrementLabel}
      ?disabled=${!view.canIncrement}
      @click=${() => {
        onStep(1)
      }}
    >
      +
    </button></span
  >`
