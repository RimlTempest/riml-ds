import { RdDataTable } from './data-table.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    'rd-data-table': RdDataTable
  }
}

customElements.define('rd-data-table', RdDataTable)
