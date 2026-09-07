import { LitElement, nothing, type PropertyDeclarations } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './disclosure.contract.js'
import { computeStates, decideDetailsAction } from './disclosure.logic.js'

/**
 * 折りたたみ。子の `<details>` / `<summary>` を包む（ティア A、ADR-0012）。
 * 開閉はブラウザが素で行い、JS が無くても動く。部品が足すのは `:state(open)` と
 * `rd-toggle` イベント、そして `open` プロパティからの操作だけ。
 *
 * @summary 折りたたみ。<details> と <summary> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @cssprop --rd-disclosure-padding - 見出しと本文の内側の余白。既定 var(--rd-space-3)
 * @event {CustomEvent<{ open: boolean }>} rd-toggle - 開閉したときに発火
 * @state open - 開いている
 * @state malformed - 契約の子（<details> と <summary>）が無い
 */
export class RdDisclosure extends LitElement {
  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
  }

  declare open: boolean

  #internals = this.attachInternals()
  #details: HTMLDetailsElement | undefined = undefined
  #contractOk = false
  #ready = false
  #binding: Binding | undefined = undefined

  constructor() {
    super()
    this.open = false
  }

  /** light DOM に描く。`<details>` は利用側の子をそのまま使う（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#binding = undefined
  }

  /**
   * 契約の確認と初期状態の取り込みは `firstUpdated` ではなく描画前に行う。
   * `<details open>` を `open` プロパティへ写す＝反応的プロパティの代入なので、
   * 描画後にやると Lit が「更新後の更新」を警告する。
   */
  override willUpdate(): void {
    if (this.#ready) {
      return
    }
    this.#ready = true
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(
        `[rd-disclosure] <details> と <summary> が必要（不足: ${result.roles.join(', ')}）`,
      )
    }
    this.#contractOk = result.kind === 'ok'
    const found = result.kind === 'ok' ? result.found['details'] : undefined
    this.#details = found instanceof HTMLDetailsElement ? found : undefined
    // 属性で書かれた `<details open>` を部品の状態に取り込む（利用側のマークアップが正）
    this.open = this.#details?.open ?? this.open
    this.#binding = bindListeners(this.#details, this.#listeners)
  }

  override updated(): void {
    syncStates(this.#internals, computeStates({ open: this.open, malformed: !this.#contractOk }))
    this.#applyOpen()
  }

  /** 強化ノードは無い。`<details>` がそのまま開閉する */
  override render(): typeof nothing {
    return nothing
  }

  #listeners: Listeners = {
    // `<details name>` の排他で他が閉じたときも toggle が飛ぶ
    toggle: () => {
      const open = this.#details?.open ?? false
      this.open = open
      this.dispatchEvent(
        new CustomEvent('rd-toggle', { bubbles: true, composed: true, detail: { open } }),
      )
    },
  }

  #applyOpen = (): void => {
    const details = this.#details
    if (details === undefined) {
      return
    }
    switch (decideDetailsAction({ wanted: this.open, actual: details.open })) {
      case 'open':
        details.open = true
        break
      case 'close':
        details.open = false
        break
      case 'none':
        break
    }
  }
}
