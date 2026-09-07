/** 失敗を値として返すための型。ドメイン層は throw しない（riml-ds-typescript §3）。 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): { readonly ok: true; readonly value: T } => ({ ok: true, value })

export const err = <E>(error: E): { readonly ok: false; readonly error: E } => ({
  ok: false,
  error,
})

/** unknown を「文字列キーのオブジェクト」に絞り込む型ガード。 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
