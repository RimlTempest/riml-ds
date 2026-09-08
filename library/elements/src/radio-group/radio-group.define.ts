import { RdRadioGroup } from './radio-group.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    'rd-radio-group': RdRadioGroup
  }
}

customElements.define('rd-radio-group', RdRadioGroup)
