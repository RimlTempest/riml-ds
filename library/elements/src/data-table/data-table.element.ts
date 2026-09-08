import { LitElement, nothing, type PropertyDeclarations } from 'lit'
import { syncStates } from '../_shared/internals.js'
import type { SortDirection } from './data-table.contract.js'
import * as dom from './data-table.dom.js'
import { columnStates, computeStates, nextDirection, sortOrder } from './data-table.logic.js'

/**
 * 見出しを押すと並べ替えられる表。`<table class="rd-table">` を子として包む（ティア A、ADR-0012）。
 * JS が無ければ書かれた順の表がそのまま読める——定義されてはじめて `th[data-sort]` の中身が
 * `<button part="sort">` になる（押せないボタンを置かない）。
 *
 * 並べ替えは `<tbody>` の `<tr>` を**動かす**だけで、行を作り直さない。読み上げは `aria-sort` に
 * 任せる（`rd-live-region` を使わない。ADR-0008 §6）。
 *
 * @summary 見出しを押すと並べ替えられる表。表そのものは利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart sort - 見出しの中の並べ替えボタン
 * @attr column - 並べ替え中の列（0 始まり）。既定 -1 は並べ替えていない
 * @attr direction - 並べ替えの向き（ascending / descending）
 * @attr manual - 行を動かさず aria-sort と rd-sort だけにする（サーバー側で並べ替える利用側）
 * @event {CustomEvent<{ column: number; key: string | undefined; direction: string }>} rd-sort - 見出しのボタンが押されたとき
 * @state sorted - どれかの列で並べ替えている
 * @state malformed - 契約の子（<table> / <caption> / <thead> / <tbody>）が無い
 */
export class RdDataTable extends LitElement {
  static override properties: PropertyDeclarations = {
    column: { type: Number, reflect: true },
    direction: { reflect: true },
    manual: { type: Boolean, reflect: true },
  }

  /** 並べ替え中の列（0 始まり）。-1 は並べ替えていない */
  declare column: number
  declare direction: SortDirection
  /** 行を動かさない。`aria-sort` と `rd-sort` だけを出す */
  declare manual: boolean

  #internals = this.attachInternals()
  #wiring = dom.NO_WIRING
  #observer: MutationObserver | undefined = undefined
  /** 接続前は最も近い `[lang]` を引けないので、初回の更新まで作らない */
  #collator: Intl.Collator | undefined = undefined

  constructor() {
    super()
    this.column = -1
    this.direction = 'ascending'
    this.manual = false
  }

  /** light DOM に描く。既存の子は消さず、行を動かすだけ（強化ノードを足さない） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  /** 木から外れたら観測だけ止める。包みは戻さない——戻すとフォーカスが飛ぶ（保守メモ） */
  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#observer?.disconnect()
  }

  /**
   * 契約は 1 回だけ見て見出しを包む。リスナは `<thead>` に 1 つ（見出しごとに配らない）。
   * `manual` の表は行を動かさないので、行の増減も見ない。
   */
  override willUpdate(): void {
    if (this.hasUpdated) {
      return
    }
    this.#wiring = dom.wire(this)
    this.#wiring.head?.addEventListener('click', this.#onClick)
    this.#observer = this.manual
      ? undefined
      : dom.observeRows(this.#wiring.body, () => this.requestUpdate())
  }

  /** 属性が正。押されたときも JS から書き換えられたときも、並べ替えるのはここ 1 か所 */
  override updated(): void {
    const cells = dom.headers(this)
    this.#sort(cells)
    dom.applySortAttrs(cells, columnStates(cells.length, this.column, this.direction))
    syncStates(this.#internals, computeStates({ column: this.column, malformed: !this.#wiring.ok }))
  }

  /** 表は light DOM のまま。部品が描き足すものは無い */
  override render(): typeof nothing {
    return nothing
  }

  #sort = (cells: readonly HTMLTableCellElement[]): void => {
    if (this.column < 0 || this.manual) {
      return
    }
    const rows = dom.readRows(this.#wiring.body, this.column)
    const collator = (this.#collator ??= dom.collatorFor(this))
    const order = sortOrder(rows, dom.sortTypeAt(cells, this.column), this.direction, collator)
    dom.applyOrder(this.#wiring.body, order)
  }

  /**
   * 押されたら次の向きを決めて `rd-sort` を知らせる。並べ替えるのは `updated`——
   * JS から `column` / `direction` を書き換えたときと同じ道を通す（そちらは `rd-sort` を出さない）。
   */
  #onClick = (event: Event): void => {
    const column = dom.columnOf(event.target)
    if (column < 0) {
      return
    }
    this.direction = nextDirection(column, this.column, this.direction)
    this.column = column
    const detail = { column, key: dom.keyAt(dom.headers(this), column), direction: this.direction }
    this.dispatchEvent(new CustomEvent('rd-sort', { bubbles: true, composed: true, detail }))
  }
}
