import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract, type SplitterDirection } from './splitter.contract.js'
import {
  applyPosition,
  dragController,
  positionFromKey,
  reportMissing,
  wireHandle,
} from './splitter.dom.js'
import { ariaOrientation, clampPosition, computeStates } from './splitter.logic.js'
import { styles } from './splitter.styles.js'

/**
 * 2 つの面のあいだにつまみを 1 つ置き、割合を変えられるようにする（APG「Window Splitter」）。
 * 面の中身は light DOM の `slot="start"` / `slot="end"` なので、**JS が無いときは
 * 2 つの面が縦に積まれてそのまま読める**（ティア B、ADR-0012）。
 *
 * @summary つまみを動かして 2 つの面の割合を変える
 * @status experimental
 * @pe B
 *
 * @slot start - 始端側の面（横並びなら左、縦並びなら上）。省略不可
 * @slot end - 終端側の面。省略不可
 * @attr label - つまみのアクセシブル名。省略不可
 * @attr direction - 面の並び。`horizontal`（既定）は横、`vertical` は縦
 * @attr position - 始端側の面が取る割合（%）。既定 50。JS からも読み書きできる
 * @attr min - `position` の下限（%）。既定 20
 * @attr max - `position` の上限（%）。既定 80
 * @csspart start - 始端側の面の入れ物
 * @csspart handle - つまみ（`role="separator"`）
 * @csspart grip - つまみに重なる透明な当たり領域（44px。読み上げには出ない）
 * @csspart end - 終端側の面の入れ物
 * @cssprop --rd-splitter-size - つまみの見える太さ。既定 var(--rd-space-2)
 * @event {CustomEvent<{ position: number }>} rd-resize - 利用者の操作で割合が変わったとき。`pointermove` ごとに出る
 * @state dragging - つまみをつかんでいる
 * @state vertical - direction="vertical"
 * @state malformed - slot="start" / slot="end" / label のどれかが無い
 */
export class RdSplitter extends LitElement {
  static override styles = styles

  // `delegatesFocus` は付けない——フォーカスの行き先はつまみ 1 つで、順序は tabindex が持つ
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = {
    label: { reflect: true },
    direction: { reflect: true },
    position: { type: Number, reflect: true },
    min: { type: Number },
    max: { type: Number },
  }

  /** つまみのアクセシブル名（「サイドバーの幅」）。空なら `:state(malformed)` */
  declare label: string
  /** 面の並び。`aria-orientation` は**逆**になる（`ariaOrientation()`） */
  declare direction: SplitterDirection
  /** 始端側の面が取る割合（%）。`min`..`max` に丸められる */
  declare position: number
  declare min: number
  declare max: number

  #internals = this.attachInternals()
  #contractOk = false
  #drag = dragController({
    host: this,
    direction: () => this.direction,
    bounds: () => ({ min: this.min, max: this.max }),
    onStart: () => this.requestUpdate(),
    onMove: (position) => this.#setPosition(position, true),
    onEnd: () => this.requestUpdate(),
  })

  constructor() {
    super()
    this.label = ''
    this.direction = 'horizontal'
    this.position = 50
    this.min = 20
    this.max = 80
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#drag.dispose()
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    reportMissing(result, this.label)
    wireHandle(this.shadowRoot, this.#drag)
    this.requestUpdate()
  }

  override updated(): void {
    // 属性から来た値もここで正規化する。変われば Lit がもう一度 updated を回す
    this.position = clampPosition(this.position, this.min, this.max)
    applyPosition(this, this.position)
    syncStates(
      this.#internals,
      computeStates({
        dragging: this.#drag.dragging(),
        direction: this.direction,
        malformed: !this.#contractOk || this.label === '',
      }),
    )
  }

  override render(): TemplateResult {
    return html`<div part="start"><slot name="start"></slot></div>
      <div
        part="handle"
        role="separator"
        tabindex="0"
        @keydown=${this.#onKeydown}
        aria-orientation=${ariaOrientation(this.direction)}
        aria-valuenow=${this.position}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-label=${this.label === '' ? nothing : this.label}
      >
        <span part="grip" aria-hidden="true"></span>
      </div>
      <div part="end"><slot name="end"></slot></div>`
  }

  /** 変わったときだけ書き、**利用者の操作のときだけ** `rd-resize` を出す */
  #setPosition = (next: number, byUser: boolean): void => {
    const clamped = clampPosition(next, this.min, this.max)
    const changed = clamped !== this.position
    this.position = clamped
    if (changed && byUser) {
      const detail = { position: clamped }
      this.dispatchEvent(new CustomEvent('rd-resize', { bubbles: true, composed: true, detail }))
    }
  }

  /** APG のキー操作。扱わないキーは `decideKey` が `undefined` を返し、既定を止めない */
  #onKeydown = (event: KeyboardEvent): void => {
    const bounds = { min: this.min, max: this.max }
    const next = positionFromKey(this, event, this.direction, this.position, bounds)
    if (next === undefined) {
      return
    }
    event.preventDefault()
    this.#setPosition(next, true)
  }
}
