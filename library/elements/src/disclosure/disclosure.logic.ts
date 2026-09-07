/**
 * `rd-disclosure` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 */

export const computeStates = (input: {
  readonly open: boolean
  readonly malformed: boolean
}): ReadonlySet<string> => {
  if (input.malformed) {
    return new Set(['malformed'])
  }
  return input.open ? new Set(['open']) : new Set<string>()
}

export type DetailsAction = 'open' | 'close' | 'none'

/** 属性の `open` と `<details>` の実際の状態から、呼ぶべき操作を決める */
export const decideDetailsAction = (input: {
  readonly wanted: boolean
  readonly actual: boolean
}): DetailsAction => {
  if (input.wanted === input.actual) {
    return 'none'
  }
  return input.wanted ? 'open' : 'close'
}
