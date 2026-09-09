import { LitElement, nothing, type PropertyDeclarations } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import type { Binding } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './toggle-group.contract.js'
import {
  applyPressed,
  applyTabStops,
  applyValues,
  indexOfItem,
  observeItems,
  readGroup,
} from './toggle-group.dom.js'
import {
  computeStates,
  moveIndex,
  parseMode,
  parseOrientation,
  parseVariant,
  pressAt,
  selectedValues,
} from './toggle-group.logic.js'

/**
 * 押下ボタンの列。`<fieldset>` / `<legend>` と `<button aria-pressed>` を子として包む（ティア A、
 * ADR-0012）。するのは 3 つだけ：`single` のとき他を戻す、矢印キーで列の中を移動する（roving
 * tabindex。APG「Toolbar」）、`rd-change` を投げる。JS が無いときは「押しても変わらない普通の
 * ボタンの列」に縮退する（害は無い）。**送信に載せる値なら `rd-*-group segmented` を使う**。
 *
 * @summary 押下ボタンの列。単一 / 複数選択と矢印キー移動。<fieldset><legend> と <button aria-pressed> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart options - 項目の入れ物
 * @event {CustomEvent<{ values: readonly string[] }>} rd-change - 押下で選択が変わったときに発火
 * @state outline - variant=outline（既定）。丸い面に区画を並べる
 * @state ghost - variant=ghost。面も罫線も持たない
 * @state single - mode=single。1 個だけ押せる
 * @state multiple - mode=multiple（既定）。いくつでも押せる
 * @state horizontal - orientation=horizontal（既定）
 * @state vertical - orientation=vertical。矢印は ↑ ↓
 * @state malformed - 契約の子が無い
 */
export class RdToggleGroup extends LitElement {
  static override properties: PropertyDeclarations = { mode: {}, orientation: {}, variant: {} }

  declare mode: string
  declare orientation: string
  declare variant: string

  #internals = this.attachInternals()
  #options: Element | undefined = undefined
  #contractOk = false
  #binding: Binding | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  constructor() {
    super()
    this.mode = 'multiple'
    this.orientation = 'horizontal'
    this.variant = 'outline'
  }

  /** light DOM に描く。既存の子は消さず、強化ノードも足さない（値は属性が持つ） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#binding = undefined
    this.#observer?.disconnect()
    this.#observer = undefined
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      const need = '<fieldset> / <legend> / [part="options"] / <button>'
      console.error(`[rd-toggle-group] ${need} が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    // 購読は入れ物 1 個に委譲する。ボタンを動的に足しても付け直さなくてよい
    this.#options = result.kind === 'ok' ? result.found['options'] : undefined
    this.#binding = bindListeners(this.#options, { click: this.#onClick, keydown: this.#onKeydown })
    this.#observer = observeItems(this.#options, () => {
      this.requestUpdate()
    })
  }

  /** roving tabindex を付け直し、`:state()` を写す。描画のたびに冪等に走る */
  override updated(): void {
    applyTabStops(this)
    syncStates(
      this.#internals,
      computeStates({
        mode: parseMode(this.mode),
        orientation: parseOrientation(this.orientation),
        variant: parseVariant(this.variant),
        malformed: !this.#contractOk,
      }),
    )
  }

  /** 強化ノードは無い。押下も見た目もネイティブと CSS が持つ */
  override render(): typeof nothing {
    return nothing
  }

  /** 選択は各 `<button>` の `aria-pressed` が持つ。部品は委譲するだけ */
  get values(): readonly string[] {
    return selectedValues(readGroup(this).items)
  }

  /** プログラムからの変更。`rd-change` は出さない（`rd-select` / `rd-sort` と同じ方針） */
  set values(next: readonly string[]) {
    const wanted = parseMode(this.mode) === 'single' ? next.slice(0, 1) : next
    applyValues(this, wanted)
    this.requestUpdate()
  }

  #onClick = (event: Event): void => {
    const { buttons, items } = readGroup(this)
    const next = pressAt(items, indexOfItem(buttons, event.target), parseMode(this.mode))
    // 変化が無い（disabled や項目の外を押した）なら DOM も触らず発火もしない
    if (next.every((pressed, index) => pressed === items[index]?.pressed)) {
      return
    }
    applyPressed(buttons, next)
    this.requestUpdate()
    const detail = { values: this.values }
    this.dispatchEvent(new CustomEvent('rd-change', { bubbles: true, composed: true, detail }))
  }

  /** フォーカスを動かすだけで押さない（APG Toolbar。押すのは Enter / Space = ネイティブの click） */
  #onKeydown = (event: Event): void => {
    const { buttons, items } = readGroup(this)
    const key = event instanceof KeyboardEvent ? event.key : ''
    const from = indexOfItem(buttons, event.target)
    const to = moveIndex(items, from, key, parseOrientation(this.orientation))
    if (to === undefined) {
      return
    }
    event.preventDefault()
    buttons[to]?.focus()
  }
}
