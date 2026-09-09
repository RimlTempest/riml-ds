/**
 * `rd-carousel` の純関数。DOM を触らない。`*.element.ts` / `*.dom.ts` はここを呼ぶだけ（ADR-0005）。
 */

/** -1 は前へ、1 は次へ */
export type Direction = -1 | 1

export type VisibleEntry = { readonly index: number; readonly ratio: number }

export type StateInput = {
  readonly count: number
  readonly index: number
  readonly loop: boolean
  readonly unlabeled: boolean
  readonly malformed: boolean
}

/** 端の判断。`loop` なら折り返す。枚が無ければ `undefined`（呼び側は何もしない） */
export const targetIndex = (
  current: number,
  count: number,
  direction: Direction,
  loop: boolean,
): number | undefined => {
  if (count <= 0) {
    return undefined
  }
  const next = current + direction
  if (next >= 0 && next < count) {
    return next
  }
  return loop ? (next + count) % count : undefined
}

/** 「n / N」。`index` は 0 始まり、表示は 1 始まり */
export const counterText = (index: number, count: number): string => `${index + 1} / ${count}`

/**
 * 見えている枚を 1 つに決める。交差比が最大の枚、同率なら先頭（番号の小さい枚）。
 * どれも見えていなければ `fallback`（スクロール中に一瞬 0 件になることがある）。
 */
export const pickVisible = (entries: readonly VisibleEntry[], fallback: number): number =>
  entries.reduce<VisibleEntry | undefined>((best, entry) => {
    if (entry.ratio <= 0) {
      return best
    }
    if (best === undefined || entry.ratio > best.ratio) {
      return entry
    }
    return entry.ratio === best.ratio && entry.index < best.index ? entry : best
  }, undefined)?.index ?? fallback

/** ボタンの `aria-label`。`lang` が日本語（か未指定）なら日本語（`_shared/lang.ts`） */
export const buttonCopy = (japanese: boolean): { readonly prev: string; readonly next: string } =>
  japanese ? { prev: '前へ', next: '次へ' } : { prev: 'Previous', next: 'Next' }

/** 属性と契約の状態を `:state()` の集合にする */
export const computeStates = (input: StateInput): ReadonlySet<string> => {
  if (input.malformed) {
    return new Set(['malformed'])
  }
  const atEdge = !input.loop
  return new Set(
    [
      input.unlabeled ? 'unlabeled' : '',
      input.count <= 1 ? 'single' : '',
      atEdge && input.index <= 0 ? 'at-start' : '',
      atEdge && input.index >= input.count - 1 ? 'at-end' : '',
    ].filter((state) => state !== ''),
  )
}

/**
 * 開発者に知らせる問題の文言。契約の不足（`checkContract` の役割名）と、
 * 名前（`label`）の不足を並べる。何も無ければ空（`console.error` は呼ばれない）。
 */
export const contractProblems = (missing: readonly string[], label: string): readonly string[] =>
  [
    missing.length === 0 ? '' : `<ul> と <li> が必要（不足: ${missing.join(', ')}）`,
    label === '' ? 'label が必要' : '',
  ].filter((problem) => problem !== '')
