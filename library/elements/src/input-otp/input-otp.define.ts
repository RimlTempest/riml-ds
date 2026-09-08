import { RdInputOtp } from './input-otp.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    'rd-input-otp': RdInputOtp
  }
}

customElements.define('rd-input-otp', RdInputOtp)
