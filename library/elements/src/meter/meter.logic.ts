/**
 * `rd-meter` の純関数。DOM を触らない。失敗は `Result` で返す（throw しない）。
 * `*.element.ts` はここを呼んで `--rd-meter-fill` に写すだけ（ADR-0005）。
 */

/** 失敗を値として返すための型。ドメイン層は throw しない（riml-ds-typescript §3） */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export type Range = {
  readonly value: number
  readonly min: number
  readonly max: number
}

export type FillError = 'invalid-range'

/** min..max のあいだの割合を 0–1 で返す。範囲の外は丸める */
export const computeFill = (range: Range): Result<{ readonly fill: number }, FillError> => {
  const { value, min, max } = range
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { ok: false, error: 'invalid-range' }
  }
  const ratio = (value - min) / (max - min)
  return { ok: true, value: { fill: Math.min(1, Math.max(0, ratio)) } }
}

export type MeterAttrs = {
  readonly value: string | undefined
  readonly min: string | undefined
  readonly max: string | undefined
}

export type MeterInput = {
  readonly attrs: MeterAttrs
  /** `<progress>` に value 属性が無い（HTML の既定で不確定） */
  readonly indeterminate: boolean
  readonly malformed: boolean
}

export type MeterView = {
  readonly fill: number
  readonly states: ReadonlySet<string>
}

/** HTML の既定は value 0 / min 0 / max 1。読めない値は NaN のまま computeFill に渡す */
const toNumber = (raw: string | undefined, fallback: number): number =>
  raw === undefined || raw.trim() === '' ? fallback : Number(raw)

/** 部品が 1 回の更新で必要とするものを全部出す。`*.element.ts` は反映するだけ */
export const computeMeterView = (input: MeterInput): MeterView => {
  if (input.malformed) {
    return { fill: 0, states: new Set(['malformed']) }
  }
  if (input.indeterminate) {
    return { fill: 0, states: new Set(['indeterminate']) }
  }
  const result = computeFill({
    value: toNumber(input.attrs.value, 0),
    min: toNumber(input.attrs.min, 0),
    max: toNumber(input.attrs.max, 1),
  })
  return { fill: result.ok ? result.value.fill : 0, states: new Set<string>() }
}
