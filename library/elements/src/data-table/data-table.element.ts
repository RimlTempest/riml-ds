import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract } from './data-table.contract.js'
import { computeStates } from './data-table.logic.js'

/**
 * TODO: 部品の役割を 1〜2 文で書く。ネイティブ要素を子として包む（ティア A、ADR-0012）。
 * JS が無くても動く。部品が足すのは `:state()` と強化ノードだけ。
 *
 * @summary TODO
 * @status experimental
 * @pe A
 *
 * @csspart hint - 補足文言
 * @state malformed - 契約の子が無い
 */
export class RdDataTable extends LitElement {
  static override properties: PropertyDeclarations = { hint: {} }

  declare hint: string

  #internals = this.attachInternals()
  #contractOk = false

  constructor() {
    super()
    this.hint = ''
  }

  /** light DOM に描く。既存の子は消さず、強化ノードだけを末尾に足す（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-data-table] 契約の子が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
  }

  override updated(): void {
    // TODO: column / direction を持たせて並べ替える（plan 029 Step 2）
    syncStates(this.#internals, computeStates({ column: -1, malformed: !this.#contractOk }))
  }

  /** 強化ノード。TODO: この部品が足すものに書き換える */
  override render(): TemplateResult {
    return html`${this.hint === '' ? nothing : html`<p part="hint">${this.hint}</p>`}`
  }
}
