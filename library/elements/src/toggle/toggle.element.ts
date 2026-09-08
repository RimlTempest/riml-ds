import { LitElement, nothing, type PropertyDeclarations } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './toggle.contract.js'
import { computeToggleView, nextPressed, toAriaPressed, type ToggleView } from './toggle.logic.js'

/** 押下の真実。外から書き換えられたら `:state(pressed)` を追随させる */
const OBSERVED = ['aria-pressed']

/**
 * 押下状態を持つボタン。ネイティブの `<button type="button" aria-pressed>` を子として包む
 * （ティア A、ADR-0012）。部品がするのは押下で `aria-pressed` を反転し `:state(pressed)` に
 * 写すことだけ。JS が無いときは「押しても変わらない普通のボタン」に縮退する（害は無い）。
 * **送信に載せる値なら `rd-checkbox`（`switch`）を使う**。
 *
 * @summary 押下状態を持つボタン。<button aria-pressed> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @event {CustomEvent<{ pressed: boolean }>} rd-toggle - 押下が切り替わったときに発火
 * @state outline - variant=outline（既定）。罫線のピル
 * @state ghost - variant=ghost。罫線の無いピル
 * @state pressed - aria-pressed="true"
 * @state malformed - 契約の子（<button>）が無い
 */
export class RdToggle extends LitElement {
  static override properties: PropertyDeclarations = { variant: {} }

  declare variant: string

  #internals = this.attachInternals()
  #control: HTMLButtonElement | undefined = undefined
  #contractOk = false
  #binding: Binding | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  constructor() {
    super()
    this.variant = 'outline'
  }

  /** light DOM に描く。既存の子は消さず、強化ノードも足さない（値はネイティブが持つ） */
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
      console.error(`[rd-toggle] <button> が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    const found = result.kind === 'ok' ? result.found['control'] : undefined
    this.#control = found instanceof HTMLButtonElement ? found : undefined
    this.#binding = bindListeners(this.#control, { click: this.#onClick })
    this.#observe()
  }

  override updated(): void {
    syncStates(this.#internals, this.#view().states)
  }

  /** 強化ノードは無い。押下も見た目もネイティブと CSS が持つ */
  override render(): typeof nothing {
    return nothing
  }

  /** 押下はネイティブ要素の `aria-pressed` が持つ。部品は委譲するだけ */
  get pressed(): boolean {
    return this.#control?.getAttribute('aria-pressed') === 'true'
  }

  set pressed(next: boolean) {
    syncAttribute(this.#control, 'aria-pressed', toAriaPressed(next))
    this.requestUpdate()
  }

  /** 属性が外から書き換わったら追随する。`disconnectedCallback` で切る */
  #observe = (): void => {
    const control = this.#control
    if (control === undefined) {
      return
    }
    const observer = new MutationObserver(() => {
      this.requestUpdate()
    })
    observer.observe(control, { attributes: true, attributeFilter: OBSERVED })
    this.#observer = observer
  }

  #onClick = (): void => {
    const pressed = nextPressed(this.pressed)
    this.pressed = pressed
    this.dispatchEvent(
      new CustomEvent('rd-toggle', { bubbles: true, composed: true, detail: { pressed } }),
    )
  }

  #view = (): ToggleView =>
    computeToggleView({
      pressed: this.pressed,
      variant: this.variant,
      malformed: !this.#contractOk,
    })
}
