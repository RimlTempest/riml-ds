import { LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract } from './carousel.contract.js'
import {
  carouselStates,
  complain,
  controlsTemplate,
  labelSlides,
  readButtons,
  readItems,
  readTrack,
  scrollToItem,
  syncButtons,
  watchVisible,
} from './carousel.dom.js'
import { type Direction, targetIndex } from './carousel.logic.js'

/**
 * 横に並ぶ枚の列。利用側が書いた `<ul><li>` を包み、前へ／次へと「n / N」を足す
 * （ティア A、ADR-0012）。JS が無ければ `.rd-carousel` と同じ横スクロールできる列のまま。
 * 自動再生は持たない（WCAG 2.2.2 / AAA 2.3.3。`docs/proposals/carousel.md`）。
 *
 * @summary 横に並ぶ枚の列。前へ／次へと「n / N」を足す。<ul><li> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart controls - 前へ／次へと「n / N」を並べた枕
 * @csspart prev - 前の枚へ
 * @csspart next - 次の枚へ
 * @csspart counter - 「n / N」（<output>。暗黙のライブリージョン）
 * @cssprop --rd-carousel-item - 1 枚の幅。既定 min(100%, 20rem)
 * @cssprop --rd-carousel-padding - 端の scroll-padding。既定 0
 * @event {CustomEvent<{ index: number }>} rd-change - 見えている枚が変わったときに発火（ボタン・スクロールの両方。index への代入では出さない）
 * @state at-start - loop が無く先頭にいる
 * @state at-end - loop が無く末尾にいる
 * @state single - 枚が 1 つ以下
 * @state unlabeled - label が無い
 * @state malformed - 契約の子（<ul> と <li>）が無い
 */
export class RdCarousel extends LitElement {
  static override properties: PropertyDeclarations = {
    label: {},
    loop: { type: Boolean, reflect: true },
  }

  declare label: string
  declare loop: boolean

  #internals = this.attachInternals()
  #contractOk = false
  #index = 0
  #stop: () => void = () => {}

  constructor() {
    super()
    this.label = ''
    this.loop = false
  }

  /** light DOM に描く。既存の子は消さず、強化ノードだけを末尾に足す（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#stop()
  }

  /** 契約の検査は最初の描画の**前**に済ませる（`malformed` なら強化ノードを 1 つも足さない） */
  override willUpdate(): void {
    if (this.hasUpdated) {
      return
    }
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    const items = readItems(this)
    labelSlides(items)
    this.#stop = watchVisible(readTrack(this), items, this.#onVisible)
    complain(result.kind === 'ok' ? [] : result.roles, this.label)
  }

  override updated(): void {
    this.#internals.role = 'group'
    this.#internals.ariaRoleDescription = 'carousel'
    this.#internals.ariaLabel = this.label === '' ? null : this.label
    const states = carouselStates(this, {
      index: this.#index,
      loop: this.loop,
      label: this.label,
      contractOk: this.#contractOk,
    })
    syncStates(this.#internals, states)
    syncButtons(readButtons(this), states)
  }

  /** 強化ノードは `carousel.dom.ts` が組む。契約が破れていたら何も足さない */
  override render(): TemplateResult | typeof nothing {
    return this.#contractOk
      ? controlsTemplate(this, this.#index, { prev: this.#prev, next: this.#next })
      : nothing
  }

  /** いま見えている枚（0 始まり）。代入は移動だけで、`rd-change` は出さない */
  get index(): number {
    return this.#index
  }

  set index(next: number) {
    this.#index = next
    scrollToItem(readItems(this), next)
    this.requestUpdate()
  }

  #announce(next: number): void {
    this.#index = next
    this.dispatchEvent(
      new CustomEvent('rd-change', { bubbles: true, composed: true, detail: { index: next } }),
    )
    this.requestUpdate()
  }

  /** 転がりで見えている枚が変わった。同じ枚なら黙る（プログラムからの移動もここで黙る） */
  #onVisible = (next: number): void => {
    if (next !== this.#index) {
      this.#announce(next)
    }
  }

  #step(direction: Direction): void {
    const items = readItems(this)
    const next = targetIndex(this.#index, items.length, direction, this.loop)
    if (next === undefined || next === this.#index) {
      return
    }
    scrollToItem(items, next)
    this.#announce(next)
  }

  #prev = (): void => {
    this.#step(-1)
  }

  #next = (): void => {
    this.#step(1)
  }
}
