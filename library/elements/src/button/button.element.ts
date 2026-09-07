import { LitElement, nothing, type PropertyDeclarations } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import { contract } from './button.contract.js'
import { type ButtonVariant, computeButtonState, decidePress } from './button.logic.js'

/**
 * 操作の起点となるボタン。ネイティブの `<button>` / `<a href>` を子として包む（ティア A、ADR-0012）。
 * JS が無くても押せる・送信できる。部品が足すのは `:state()` と `aria-busy` だけ。
 *
 * @summary 操作の起点。primary は画面に 1 つ
 * @status stable
 * @pe A
 *
 * @cssprop --rd-button-padding-inline - 横パディング。既定 var(--rd-space-4)
 * @event {CustomEvent<Record<string, never>>} rd-press - 子の click で発火（loading 中は発火しない）
 * @state primary - variant=primary
 * @state secondary - variant=secondary
 * @state ghost - variant=ghost
 * @state danger - variant=danger
 * @state loading - 読み込み中。押下を無視し aria-busy を付ける
 * @state malformed - 契約の子（<button> か <a href>）が無い
 */
export class RdButton extends LitElement {
  static override properties: PropertyDeclarations = {
    variant: {},
    loading: { type: Boolean, reflect: true },
  }

  declare variant: ButtonVariant
  declare loading: boolean

  #internals = this.attachInternals()
  #control: Element | undefined = undefined
  #contractOk = false

  constructor() {
    super()
    this.variant = 'primary'
    this.loading = false
  }

  /** light DOM に描く。既存の子は消さず、強化ノードだけを末尾に足す（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.#control?.addEventListener('click', this.#onClick)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#control?.removeEventListener('click', this.#onClick)
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-button] <button> か <a href> が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    this.#control = result.kind === 'ok' ? result.found['control'] : undefined
    this.#control?.addEventListener('click', this.#onClick)
  }

  override updated(): void {
    const state = computeButtonState({
      variant: this.variant,
      loading: this.loading,
      contractOk: this.#contractOk,
    })
    syncStates(this.#internals, state.states)
    syncAttribute(this.#control, 'aria-busy', state.ariaBusy)
  }

  /** 強化ノードは今は無い。スピナーを足すならここに返す */
  override render(): typeof nothing {
    return nothing
  }

  #onClick = (event: Event): void => {
    const decision = decidePress({ loading: this.loading })
    if (decision.kind === 'blocked') {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    this.dispatchEvent(new CustomEvent('rd-press', { bubbles: true, composed: true, detail: {} }))
  }
}
