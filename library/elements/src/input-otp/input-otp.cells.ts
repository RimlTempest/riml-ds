/**
 * `rd-input-otp` が触る DOM の小道具。**判断は `input-otp.logic.ts` の純関数**が持ち、
 * ここはその結果を DOM に写すだけ。`*.element.ts` を薄い殻（≤ 150 行、ADR-0005）に保つために出す。
 */
import { distributePaste, nextCellIndex } from './input-otp.logic.js'

/** 桁に値を配る。`digits` に無い桁は `rest`（`''` で消す / `undefined` でそのまま残す） */
const fill = (
  cells: readonly HTMLInputElement[],
  digits: readonly string[],
  rest: string | undefined,
): void => {
  cells.forEach((cell, index) => {
    cell.value = digits[index] ?? rest ?? cell.value
  })
}

/** 契約のセレクタで桁の `<input>` を集める */
export const cellsOf = (host: ParentNode, selector: string): readonly HTMLInputElement[] =>
  [...host.querySelectorAll(selector)].flatMap((node) =>
    node instanceof HTMLInputElement ? [node] : [],
  )

/** 桁の値。桁でない `target` は空扱い（呼び側の判定が「動かない」に倒れる） */
export const valueOf = (target: EventTarget | null): string =>
  target instanceof HTMLInputElement ? target.value : ''

/** `target` の桁から `key` の向きへ focus を移す（移動先は `nextCellIndex` が決める） */
export const moveFocus = (
  cells: readonly HTMLInputElement[],
  target: EventTarget | null,
  key: string,
): void => {
  const index = cells.findIndex((cell) => cell === target)
  cells[nextCellIndex({ index, count: cells.length, key })]?.focus()
}

/** 桁に文字列を配り直す（足りない桁は消す）。focus は動かさない */
export const setCells = (cells: readonly HTMLInputElement[], text: string): void => {
  fill(cells, distributePaste({ text, count: cells.length }), '')
}

/** 貼り付けた文字列を桁に配り、最後に埋めた桁へ focus する。取れなければ何もしない */
export const pasteInto = (cells: readonly HTMLInputElement[], event: Event): void => {
  const text = event instanceof ClipboardEvent ? (event.clipboardData?.getData('text') ?? '') : ''
  const digits = distributePaste({ text, count: cells.length })
  fill(cells, digits, undefined)
  cells[Math.max(digits.length - 1, 0)]?.focus()
}
