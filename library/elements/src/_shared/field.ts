/**
 * ティア A のフォーム部品（`rd-text-field` / `rd-select` …）が共有する純関数。
 * DOM を触らない（`ValidityStateFlags` は型としてだけ参照する）。
 * 検証文言は `system/guidelines/writing.md`「フォーム検証の文言」が正。
 * 優先順位は error 属性 > customError > 表 > ネイティブ validationMessage。
 */

export type ValidationAttrs = {
  readonly type?: string | undefined
  readonly minlength?: string | undefined
  readonly maxlength?: string | undefined
  readonly min?: string | undefined
  readonly max?: string | undefined
  readonly step?: string | undefined
  readonly title?: string | undefined
}

export type MessageInput = {
  /** `error` 属性。空でなければ最優先 */
  readonly error: string
  readonly validity: ValidityStateFlags
  readonly validationMessage: string
  readonly attrs: ValidationAttrs
  /** 日本語 UI なら表を使う。英語 UI はネイティブ文言をそのまま */
  readonly japanese: boolean
}

/** writing.md の表の順。複数フラグが立ったら上から最初の 1 つだけを出す */
const TABLE: readonly (readonly [keyof ValidityStateFlags, (attrs: ValidationAttrs) => string])[] =
  [
    ['valueMissing', () => '未入力です。入力してください。'],
    [
      'typeMismatch',
      (attrs) =>
        attrs.type === 'url'
          ? 'URL の形式ではありません。https://example.com の形で入力してください。'
          : 'メールアドレスの形式ではありません。name@example.com の形で入力してください。',
    ],
    ['tooShort', (attrs) => `短すぎます。${attrs.minlength ?? ''} 文字以上で入力してください。`],
    ['tooLong', (attrs) => `長すぎます。${attrs.maxlength ?? ''} 文字以内で入力してください。`],
    [
      'patternMismatch',
      (attrs) =>
        attrs.title === undefined || attrs.title === ''
          ? '形式が違います。指定の形式で入力してください。'
          : `形式が違います。${attrs.title} の形で入力してください。`,
    ],
    ['rangeUnderflow', (attrs) => `小さすぎます。${attrs.min ?? ''} 以上で入力してください。`],
    ['rangeOverflow', (attrs) => `大きすぎます。${attrs.max ?? ''} 以下で入力してください。`],
    [
      'stepMismatch',
      (attrs) =>
        `${attrs.step ?? ''} 刻みの値ではありません。${attrs.step ?? ''} 刻みで入力してください。`,
    ],
    ['badInput', () => '読み取れませんでした。入力し直してください。'],
  ]

export const computeMessage = (input: MessageInput): string => {
  if (input.error !== '') {
    return input.error
  }
  if (input.validity.customError === true || !input.japanese) {
    return input.validationMessage
  }
  const hit = TABLE.find(([flag]) => input.validity[flag] === true)
  return hit === undefined ? input.validationMessage : hit[1](input.attrs)
}

/** 言語の見分けは `_shared/lang.ts` に置いてある（窓の操作ボタンも使うため）。ここからも出す */
export { usesJapaneseCopy } from './lang.js'

export type StateInput = {
  readonly malformed: boolean
  readonly invalid: boolean
  readonly touched: boolean
  readonly hasHint: boolean
  readonly hasError: boolean
  readonly filled: boolean
}

/** 契約に合わない子のときは他の状態を出さない（表示できるものが無い） */
export const computeStates = (input: StateInput): ReadonlySet<string> => {
  if (input.malformed) {
    return new Set(['malformed'])
  }
  const states = new Set<string>()
  if (input.hasError) {
    states.add('errored')
  }
  if (input.hasError || (input.invalid && input.touched)) {
    states.add('invalid')
  }
  if (input.hasHint) {
    states.add('hinted')
  }
  if (input.filled) {
    states.add('filled')
  }
  return states
}

/** `aria-describedby` の値。結ぶものが無ければ属性ごと消す（undefined） */
export const computeDescribedBy = (input: {
  readonly hintId: string
  readonly errorId: string
  readonly showError: boolean
}): string | undefined => {
  const ids = [input.hintId, input.showError ? input.errorId : ''].filter((id) => id !== '')
  return ids.length === 0 ? undefined : ids.join(' ')
}

export type ViewInput = StateInput & MessageInput & { readonly controlId: string }

export type FieldView = {
  readonly message: string
  readonly states: ReadonlySet<string>
  readonly hintId: string
  readonly errorId: string
  readonly describedBy: string | undefined
  readonly ariaInvalid: 'true' | undefined
}

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeView = (input: ViewInput): FieldView => {
  const message = input.hasError || input.touched ? computeMessage(input) : ''
  const hintId = `${input.controlId}-hint`
  const errorId = `${input.controlId}-error`
  const showError = message !== ''
  return {
    message,
    states: computeStates(input),
    hintId,
    errorId,
    describedBy: computeDescribedBy({ hintId: input.hasHint ? hintId : '', errorId, showError }),
    ariaInvalid: showError ? 'true' : undefined,
  }
}
