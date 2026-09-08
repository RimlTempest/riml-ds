/**
 * `rd-command` の純関数。DOM を触らない（`*.element.ts` はここを呼ぶだけ。ADR-0005）。
 * light DOM の読み書きは `command.dom.ts`、比較規則は `_shared/text-filter.ts`。
 */
import { nextIndex } from '../_shared/roving-focus.js'
import { filterCandidates, type FilterMode } from '../_shared/text-filter.js'

/** 項目 1 つの検索文字列の材料（表示テキストと `data-keywords`） */
export type Item = { readonly text: string; readonly keywords: string }

/**
 * その項目が残るか。`_shared/text-filter.ts` に 1 件だけ渡して同じ比較規則
 * （NFKC + `toLocaleLowerCase`）を使う——combobox と絞り込みの当たり方をそろえる。
 */
export const matches = (item: Item, query: string, mode: FilterMode): boolean =>
  filterCandidates([{ value: item.keywords, label: item.text }], query, mode).length === 1

/** 見えている項目の番号（並び順） */
export const visibleIndexes = (
  items: readonly Item[],
  query: string,
  mode: FilterMode,
): readonly number[] => items.flatMap((item, index) => (matches(item, query, mode) ? [index] : []))

/** その `<ul>` の項目が 1 つも見えていなければ `<ul>` ごと隠す（見出しだけ残さない） */
export const groupHidden = (
  visible: readonly number[],
  groupItemIndexes: readonly number[],
): boolean => !groupItemIndexes.some((index) => visible.includes(index))

/** キー 1 打の意味。`none` 以外は呼び側が `preventDefault()` する */
export type CommandKeyAction =
  /** 入力欄で ↓ / ↑、項目で ↓ ↑ Home End */
  | { readonly kind: 'focus-item'; readonly index: number }
  /** 入力欄で Enter */
  | { readonly kind: 'activate-first' }
  /** 入力欄で Esc（文字が入っているとき） */
  | { readonly kind: 'clear' }
  /** 項目で印字キー。入力欄に戻して打ち続けられる */
  | { readonly kind: 'type'; readonly char: string }
  /** 項目で Backspace */
  | { readonly kind: 'backspace' }
  | { readonly kind: 'none' }

export type CommandKeyInput = {
  readonly key: string
  /** `ctrlKey || metaKey || altKey`（⌘クリックや近道を横取りしない） */
  readonly modified: boolean
  /** 入力欄で押されたか（false なら項目の上） */
  readonly onInput: boolean
  /** 見えている項目の中での現在地。項目に居なければ負 */
  readonly current: number
  /** 見えている項目の数 */
  readonly count: number
  readonly hasQuery: boolean
}

const NONE: CommandKeyAction = { kind: 'none' }

const focusItem = (index: number): CommandKeyAction => ({ kind: 'focus-item', index })

/**
 * 入力欄でのキー（表にあるものだけを扱う）。**印字キーと Home / End は横取りしない**——
 * 文字を打つのとカーソルを動かすのが入力欄の本業（APG「Combobox」と同じ判断）。
 */
const ON_INPUT: Readonly<Record<string, (input: CommandKeyInput) => CommandKeyAction>> = {
  ArrowDown: (input) => (input.count > 0 ? focusItem(0) : NONE),
  ArrowUp: (input) => (input.count > 0 ? focusItem(input.count - 1) : NONE),
  Enter: (input) => (input.count > 0 ? { kind: 'activate-first' } : NONE),
  // 空なら何もしない（外側の `rd-dialog` が閉じる）
  Escape: (input) => (input.hasQuery ? { kind: 'clear' } : NONE),
}

/** 項目に居るときの印字キー。Space は押下なのでネイティブに任せる */
const typed = (input: CommandKeyInput): CommandKeyAction =>
  input.key.length === 1 && input.key !== ' ' && !input.modified
    ? { kind: 'type', char: input.key }
    : NONE

const backspaced = (input: CommandKeyInput): CommandKeyAction =>
  input.key === 'Backspace' && !input.modified ? { kind: 'backspace' } : typed(input)

/** 項目でのキー。移動は `_shared/roving-focus.ts`（端で折り返す） */
const onItem = (input: CommandKeyInput): CommandKeyAction => {
  const moved = nextIndex(input.current, input.count, input.key, 'vertical')
  return moved === undefined ? backspaced(input) : focusItem(moved)
}

export const decideKey = (input: CommandKeyInput): CommandKeyAction =>
  input.onInput ? (ON_INPUT[input.key] ?? (() => NONE))(input) : onItem(input)

/** `rd-select` の `value`。空文字は「無い」と同じに扱う */
export const itemValue = (attrs: {
  readonly dataValue: string | null
  readonly value: string | null
  readonly href: string | null
  readonly text: string
}): string =>
  [attrs.dataValue, attrs.value, attrs.href, attrs.text].find(
    (candidate): candidate is string => candidate !== null && candidate !== '',
  ) ?? ''

/** 0 件のときの文言。`empty-text` が無ければページの言語で決める */
export const emptyCopy = (japanese: boolean, override: string | undefined): string =>
  override === undefined || override === ''
    ? japanese
      ? '見つかりません'
      : 'No results'
    : override

export type StateInput = {
  readonly malformed: boolean
  readonly filtering: boolean
  readonly empty: boolean
}

/** 契約に合わない子のときは他の状態を出さない（`_shared/field.ts` の `computeStates` に合わせる） */
export const computeStates = (input: StateInput): ReadonlySet<string> =>
  input.malformed
    ? new Set(['malformed'])
    : new Set([...(input.filtering ? ['filtering'] : []), ...(input.empty ? ['empty'] : [])])
