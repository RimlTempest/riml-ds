/**
 * `rd-button` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * `disabled` は部品の属性にしない：ネイティブ `<button disabled>` をそのまま使う。
 */

export const ButtonVariant = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
} as const

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant]

export type ButtonState = {
  readonly states: ReadonlySet<string>
  readonly ariaBusy?: 'true'
}

export type PressDecision = { readonly kind: 'blocked' } | { readonly kind: 'press' }

const isButtonVariant = (value: string): value is ButtonVariant =>
  Object.hasOwn(ButtonVariant, value)

/** 属性から来た文字列を variant に正規化する。知らない値は primary */
export const toButtonVariant = (value: string): ButtonVariant =>
  isButtonVariant(value) ? value : ButtonVariant.primary

export const computeButtonState = (input: {
  readonly variant: string
  readonly loading: boolean
  readonly contractOk: boolean
}): ButtonState => {
  const states = new Set<string>([toButtonVariant(input.variant)])
  if (input.loading) {
    states.add('loading')
  }
  if (!input.contractOk) {
    states.add('malformed')
  }
  return input.loading ? { states, ariaBusy: 'true' } : { states }
}

/** loading 中は押下を無視する（`disabled` にしてフォーカスを飛ばさない。ADR-0008） */
export const decidePress = (input: { readonly loading: boolean }): PressDecision =>
  input.loading ? { kind: 'blocked' } : { kind: 'press' }
