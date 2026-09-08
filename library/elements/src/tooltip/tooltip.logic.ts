/**
 * `rd-tooltip` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 */

export type TooltipStateInput = {
  readonly open: boolean
  /** `for` の先が見つからない */
  readonly orphan: boolean
}

export type TooltipView = { readonly visible: boolean; readonly states: ReadonlySet<string> }

/** 対象が無ければ何も出さない——説明する相手が居ない吹き出しは害にしかならない */
export const computeTooltipView = (input: TooltipStateInput): TooltipView => ({
  visible: input.open && !input.orphan,
  states: new Set(input.orphan ? ['orphan'] : input.open ? ['open'] : []),
})

const TIME = /^(?<value>\d+(?:\.\d+)?)(?<unit>ms|s)$/u

/**
 * `--rd-tooltip-delay` の CSS 時間をミリ秒にする。読めない値は既定に落とす
 * （利用側が単位を書き忘れても壊れない）。
 */
export const parseDelay = (raw: string, fallback: number): number => {
  const match = TIME.exec(raw.trim())
  const value = Number(match?.groups?.['value'] ?? Number.NaN)
  if (Number.isNaN(value)) {
    return fallback
  }
  return match?.groups?.['unit'] === 's' ? value * 1000 : value
}
