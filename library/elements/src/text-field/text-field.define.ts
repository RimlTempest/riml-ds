import { RdTextField } from './text-field.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    'rd-text-field': RdTextField
  }
}

customElements.define('rd-text-field', RdTextField)
