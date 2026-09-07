import { RdButton } from './button.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    'rd-button': RdButton
  }
}

customElements.define('rd-button', RdButton)
