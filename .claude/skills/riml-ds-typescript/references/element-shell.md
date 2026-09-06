# `*.element.ts` を薄く保つ

ADR-0005。class は標準 API が要求するから書く。**判断は書かない。**

## 許すもの

```ts
import { LitElement, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { styles } from './button.styles.js'
import { computeButtonState, type ButtonVariant } from './button.logic.js'

export class RdButton extends LitElement {
  static styles = styles
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true }

  @property() accessor variant: ButtonVariant = 'primary'
  @property({ type: Boolean, reflect: true }) accessor loading = false
  @property({ type: Boolean, reflect: true }) accessor disabled = false

  #internals = this.attachInternals()

  render() {
    const s = computeButtonState({ variant: this.variant, loading: this.loading, disabled: this.disabled })
    syncStates(this.#internals, s.states)           // logic が返した集合を反映するだけ
    return html`<button part="control" aria-disabled=${s.ariaDisabled ?? nothing} aria-busy=${s.ariaBusy ?? nothing}>
      <slot name="icon-start"></slot><slot></slot>
    </button>`
  }
}
```

## 禁止

- `if` / `switch` で属性の組み合わせを判断する → `*.logic.ts` に `computeXxxState` を作る
- 文字列整形・ID 生成・検証 → logic
- `addEventListener` の中に処理を書く → ハンドラは logic の関数を呼んで結果を反映するだけ
- private メソッドが 10 行を超える → logic へ

## 目安

- 150 行以下
- `if` は 5 個以下
- `*.logic.test.ts` のテスト数 ≥ `*.test.ts` のテスト数（DOM を立てるテストは少ないほうがよい）

## デコレータ

TC39 標準デコレータ + `accessor`。`experimentalDecorators` は使わない。TS 7 で出力に問題が出たら
`static properties = { variant: {}, loading: { type: Boolean, reflect: true } }` に落とし、
ADR-0005 に追記する（plan 004 の spike で決定）。
