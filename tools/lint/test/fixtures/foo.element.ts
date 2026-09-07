export class RdFoo extends HTMLElement {
  connectedCallback() {
    this.textContent = 'hi'
  }
}
