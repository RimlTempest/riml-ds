# 関数 DI

## 形

```ts
type Deps = {
  readonly now: () => number
  readonly matchMedia: (q: string) => { readonly matches: boolean }
}

export const makeResolveMotion = (deps: Deps) => (): MotionMode =>
  deps.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'standard'
```

- 依存の型は**利用側**（この関数）が定義する。`window.matchMedia` の型を import しない。
  必要なメンバーだけ書く（ISP）。
- テストはプレーンなオブジェクト：`makeResolveMotion({ now: () => 0, matchMedia: () => ({ matches: true }) })()`。

## 部品での配線

```ts
// text-field.element.ts（殻）
export class RdTextField extends LitElement {
  #internals = this.attachInternals()
  #computeAria = makeComputeAria({ idFor: (k) => `${this.#id}-${k}` })   // composition root
  render() {
    const aria = this.#computeAria({ label: this.label, error: this.error, hint: this.hint })
    return html`<input id=${aria.inputId} aria-describedby=${aria.describedBy ?? nothing} …>`
  }
}
```

`#computeAria` の中身（`text-field.logic.ts`）は node の Vitest で網羅する。`render()` は結果を
テンプレートに流すだけ。

## クロージャで状態を持つ

```ts
export const makeAnnouncer = (deps: { readonly setText: (t: string) => void; readonly schedule: (f: () => void) => void }) => {
  let queue: readonly string[] = []
  const flush = () => { const [head, ...rest] = queue; if (head !== undefined) { deps.setText(head); queue = rest; deps.schedule(flush) } }
  return { announce: (t: string) => { queue = [...queue, t]; if (queue.length === 1) deps.schedule(flush) } }
}
```

class を使わずに状態と振る舞いを束ねる。`rd-live-region` の殻はこの `announce` を公開メソッドに
つなぐだけ。
