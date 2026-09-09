# 036: `rd-number-field` — 数値入力（`<label for>` + `<input type="number">` を包むティア A。− / + の刻みボタンと丸め）

**優先度**: P1　**規模**: M　**依存**: 004（`rd-text-field`）、009（ヒント・エラー文言の仕組み `_shared/field.ts`）、019（`rd-slider` の「値はネイティブが持つ」形）
**レーン**: `feat/number-field`　**計画時の main**: `c9355a7`（031 マージ後。**032（`feat/carousel`）・033（`feat/calendar`）・035（`chore/follow-ups-035`）と並行** — `system/**` / `_shared/**` / `text-field/**` / `slider/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/number-field && echo EXISTS` が何も出ないこと。出たら STOP（自分の `scaffold:element` の出力なら続行）。
> `grep -c 'export const computeView' library/elements/src/_shared/field.ts` = 1、`grep -c 'export const setControlValue' library/elements/src/_shared/native-control.ts` = 1、
> `grep -c 'export const readAttrs' library/elements/src/_shared/native-control.ts` = 1、`grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1。
> `grep -c "value: '\$defaultValue'" library/elements/src/text-field/text-field.contract.ts` = 1（React ラッパーの生成器はフォーム部品の `value` を `defaultValue` に写す。契約は `'$defaultValue'` で書く）。
> `wc -l library/elements/src/slider/slider.element.ts` が **149**、`library/elements/src/text-field/text-field.element.ts` が **149**（どちらも上限ぎりぎり。**この部品は最初から `number-field.dom.ts` に出す**）。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

数量・枚数・サイズ・価格など**数値を 1 つ入れる**場面に、いまは `rd-text-field` に `type="number"` を書くしかない。
ネイティブの `<input type="number">` はそれで送信・検証（`min` / `max` / `step`）・↑↓ キーの刻みまで動くが、

1. ブラウザの刻みボタン（spinner）は **小さすぎて触れない**（44px に届かない。WCAG 2.2 Target Size）。タッチでは事実上使えない
2. `step="0.1"` で刻むと `0.30000000000000004` のような浮動小数の誤差が**値に残る**ブラウザがある
3. 空欄から刻んだときの開始値（`min` か 0 か）がブラウザごとに違い、`stepUp()` は `step="any"` で例外を投げる

`rd-number-field` は `rd-text-field` と同じヒント・エラーの仕組み（`_shared/field.ts`）の上に、**44px の − / + ボタン**と**刻みの純関数**（開始値・丸め・境界での無効化）だけを足す。
値の真実はネイティブの `<input type="number">`（送信・検証・↑↓ はブラウザのまま）。JS が無いときは「ボタンの無い普通の数値入力」に縮退する（害は無い。ティア A）。

shadcn には Number Field が無い（`Input type="number"` で済ませている）。これは shadcn の外の追加で、qrcc（印刷枚数・QR のサイズ）と noter（フォントサイズ・行数）の両方が使う。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/slider/**`**（`<label for>` + `<input>` を包む、`_shared/field.ts` の `computeView` / `usesJapaneseCopy`、`readAttrs(['min','max','step'])`、`MutationObserver` で属性に追随、`value` / `valueAsNumber` の委譲）と
  **`library/elements/src/text-field/**`**（入力欄の CSS、`:user-invalid`、hint / error の `<p part>`、`invalid` イベントの `preventDefault`）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **ドメイン層（`*.logic.ts`）で `throw` しない**。`Number()` が `NaN` を返すケースは値で返す
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。CEM は private フィールド（`#internals` など）も載せるので、field を足すたびに `custom-elements.json` が変わる。**同じコミットに含める**（guard 規則 15）
- **ラッパーの props は契約の `tree.attrs` から作られる**。`hint` / `error` は host の `attrs`、`min` / `max` / `step` / `required` / `name` は `<input>` の `attrs`。`value` は **`'$defaultValue'`**（生成器が `defaultValue` に写す）
- `bun run scaffold:element number-field --pe A` で骨格を作る（`number-field.styles.ts` は作らない。ティア A）
- `library/elements/package.json` の `exports` に `./experimental/number-field{,/contract,/define,/style.css}` の 4 ブロックを **`./experimental/menu/style.css` の直後**（アルファベット順。`menu` < `number-field` < `popover`）
- story は 8 種（Default / WithHint / Disabled（`<input disabled>`。ボタンも無効） / Invalid（`error` 属性） / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Bounded`（`min="0" max="3" value="3"` → + が無効）+ `Decimal`（`step="0.1"`。`play` で + を 3 回押して `0.3` になる）+ `Stepper`（`play` で + を 2 回・− を 1 回押し、`value` が `2` になる）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/number-field`）: `library/elements/src/number-field/**`（新規）、`library/elements/src/experimental/number-field/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/number-field.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/text-field/**`、`library/elements/src/slider/**`、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 032 / 033 / 035** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。自分の追記は各ファイルの**最後の既存エントリの直後**（`build-pages.ts` は `echo.html` の前）に置く。
  `git merge main` は任意。コンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。生成物（`custom-elements.json` / `registry.json` / generated）のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/slider/slider.contract.ts`（`<label for>` + `<input>` の契約。`value: '$defaultValue'`。この形を `type: 'number'` に写す）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="range"]',
    output: ':scope > output',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-slider',
    attrs: { orientation: '$orientation', hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          type: 'range',
          id: '$id',
          name: '$name',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          step: '$step',
          list: '$list',
        },
      },
      { tag: 'output', attrs: { for: '$id' }, children: [{ prop: 'defaultValue' }] },
    ],
  },
} as const satisfies Contract
```

`library/elements/src/slider/slider.element.ts`（ネイティブに委譲する形。`firstUpdated` の契約検査、`MutationObserver`、`updated` での `syncStates` / `syncAttribute`、`#view`。**全体を読む**）:

```ts
const OBSERVED = ['value', 'min', 'max', 'step']
…
  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-slider] <label for> と range が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    const found = result.kind === 'ok' ? result.found['control'] : undefined
    this.#control = found instanceof HTMLInputElement ? found : undefined
    this.#binding = bindListeners(this.#control, this.#listeners)
    this.#observer = new MutationObserver(this.#redraw)
    this.#observer.observe(this, { attributes: true, attributeFilter: OBSERVED, subtree: true })
  }

  override updated(): void {
    const view = this.#view()
    …
    syncStates(this.#internals, view.states)
    syncAttribute(this.#control, 'aria-describedby', view.describedBy)
    syncAttribute(this.#control, 'aria-invalid', view.ariaInvalid)
  }
…
  /** 値はネイティブ要素が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#control?.value ?? ''
  }

  set value(next: string) {
    setControlValue(this.#control, next)
    this.requestUpdate()
  }

  get valueAsNumber(): number {
    return this.#control?.valueAsNumber ?? Number.NaN
  }
…
  #listeners: Listeners = {
    input: this.#redraw,
    change: this.#setTouched,
    blur: this.#setTouched,
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched()
    },
  }

  #view = (): SliderView =>
    computeSliderView({
      controlId: this.#control?.id ?? this.querySelector(contract.roles.control)?.id ?? '',
      error: this.error,
      validity: this.#control?.validity ?? {},
      validationMessage: this.#control?.validationMessage ?? '',
      attrs: readAttrs(this.#control, ['min', 'max', 'step']),
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#control?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: true,
      …
    })
```

`library/elements/src/_shared/field.ts`（ヒント・エラー・状態の純関数。**そのまま使う**。`rangeUnderflow` / `rangeOverflow` / `stepMismatch` の日本語文言が既にある）:

```ts
export type ViewInput = StateInput & MessageInput & { readonly controlId: string }
export type FieldView = { … states, describedBy, ariaInvalid, message, hintId, errorId … }
export const computeView = (input: ViewInput): FieldView => { … }
export { usesJapaneseCopy } from './lang.js'
```

`library/elements/src/_shared/native-control.ts`:

```ts
export const bindListeners = (target, listeners): Binding   // { detach }
export const setControlValue = (control: NativeControl | undefined, value: string): void
export const readAttrs = (element: Element | undefined, names: readonly string[]): Readonly<Record<string, string | undefined>>
```

`library/elements/src/text-field/text-field.css`（入力欄の見た目。**同じ値を `number-field.css` に書く**。text-field.css は触らない）:

```css
  rd-text-field > input,
  rd-text-field > textarea {
    display: block;
    inline-size: 100%;
    min-block-size: var(--rd-sizing-target-min);
    padding-block: var(--rd-space-2);
    padding-inline: var(--rd-space-3);
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-default);
    border-radius: var(--rd-radius-md);
    background: var(--rd-color-surface-raised);
    color: var(--rd-color-text-default);
    font: inherit;
    line-height: var(--rd-line-height-body);
  }
```

`e2e/pe/build-pages.ts` の `slider.html`（ページの書き方。`sliderMarkup` を `numberFieldMarkup` に読み替える）と `e2e/pe/tier-a.spec.ts` の `slider:` 2 本（JS 無しで送信される／JS 無しでは部品の描画物が無い）。

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`number-field.contract.ts`）

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="number"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-number-field',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          type: 'number',
          id: '$id',
          name: '$name',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          step: '$step',
          required: '$required',
        },
      },
    ],
  },
} as const satisfies Contract

export type NumberFieldMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  /** 初期値。数値の文字列で渡す（属性はすべて文字列）。省略で空欄 */
  readonly defaultValue?: string
  readonly min?: string
  readonly max?: string
  /** 刻み。省略は 1。`any` は使わない（ボタンで刻めないため。契約テストで拒む必要は無い。純関数が 1 に読む） */
  readonly step?: string
  readonly required?: boolean
  readonly hint?: string
  readonly error?: string
}
```

- `inputmode` は書かない（`type="number"` がモバイルの数字キーボードを出す）。`pattern` も書かない。
- **`<input type="text" inputmode="numeric">` にはしない**。ネイティブの `min` / `max` / `step` 検証と ↑↓ の刻みを捨てることになる。桁区切りやロケール表示が要る場面は利用側の責任（proposal に書く）。

### 2. 純関数（`number-field.logic.ts`）

```ts
export type StepAttrs = {
  readonly value: string   // input.value（空欄は ''）
  readonly min?: string | undefined
  readonly max?: string | undefined
  readonly step?: string | undefined
}
export type StepDirection = -1 | 1

/** 刻み。無い・`any`・0 以下・数値でない → 1 */
export const parseStep = (step: string | undefined): number

/** 小数点以下の桁数。`'0.1'` → 1、`'1'` → 0、`'0.25'` → 2、指数表記は 0 に落とす */
export const decimalsOf = (text: string): number

/** 次の値。空欄は「min があれば min、無ければ 0」から刻む（min 側へ刻むときも同じ）。min / max で止め（clamp）、
 *  `step` と現在値の桁数の大きい方で丸める（`0.1 + 0.2` → `'0.3'`）。返り値は input.value に入れる文字列 */
export const stepValue = (attrs: StepAttrs, direction: StepDirection): string

/** ボタンを無効にするか。値が max 以上なら +、min 以下なら −。空欄はどちらも押せる。min / max が無ければ押せる */
export const canStep = (attrs: StepAttrs, direction: StepDirection): boolean

export type NumberFieldStateInput = Parameters<typeof computeStates>[0]   // `_shared/field.ts` の StateInput をそのまま
export type NumberFieldView = FieldView & {
  readonly canDecrement: boolean
  readonly canIncrement: boolean
  readonly decrementLabel: string   // japanese ? '減らす' : 'Decrease'
  readonly incrementLabel: string   // japanese ? '増やす' : 'Increase'
}
export const computeNumberFieldView = (input: ViewInput & StepAttrs & { readonly disabled: boolean }): NumberFieldView
// canDecrement = !disabled && canStep(attrs, -1)、canIncrement = !disabled && canStep(attrs, 1)
```

- `stepValue` は `Number()` で読み、`NaN`（`'abc'` などの不正値。`type="number"` では通常入らない）は**空欄と同じ**に扱う。`throw` しない。
- 丸めは `Number(next.toFixed(decimals))` → `String()`。`decimals` は `decimalsOf(step)` と `decimalsOf(value)` の大きい方（`step="1"` で `value="1.5"` から刻むと `2.5`）。
- `min` / `max` が `step` の格子に乗っていない値（`min="0.5" step="1"`）でも、clamp の結果はそのまま返す（ネイティブの `stepMismatch` が出るなら `_shared/field.ts` の文言で見せる。**格子に寄せる補正はしない**）。

### 3. element（`number-field.element.ts`、≤ 150 行、`if` ≤ 5）と `number-field.dom.ts`

- `createRenderRoot() { return this }`。`static override properties = { hint: {}, error: {} }`（`rd-text-field` と同じ）。
- `firstUpdated`: `checkContract` → `malformed` + `console.error('[rd-number-field] <label for> と <input type="number"> が必要（不足: …）')`。
  `bindListeners(control, { input, change, blur, invalid })`（slider と同じ 4 つ）+ `bindListeners(this.closest('form'), { reset })`（text-field と同じ。`touched` を戻す）。
  `MutationObserver` を `this` に `{ attributes: true, attributeFilter: ['value', 'min', 'max', 'step', 'disabled'], subtree: true }` で付け、変化で `requestUpdate()`。
- `updated`: `syncStates` / `aria-describedby` / `aria-invalid`（slider と同じ）。
- `render()`（**light DOM の末尾**に足す。既存の子は消さない）:
  `hint` / `error` の `<p part>`（text-field と同じ）+ `<span part="stepper">` に `<button type="button" part="decrement" tabindex="-1" aria-label=${view.decrementLabel} ?disabled=${!view.canDecrement} @click=${…}>−</button>` と同形の `increment`。
  文字は **U+2212（−）と U+002B（+）**。`aria-label` があるので `aria-hidden` は要らない。
  **`tabindex="-1"`**: キーボード利用者は入力欄の ↑↓ で刻めるので、Tab 順に 2 個のボタンを足さない（APG Spinbutton の Note、react-aria NumberField と同じ）。タッチ・ポインタ・SR のタッチ探索では押せる。
- `#step(direction)`（`number-field.dom.ts` の `applyStep(control, direction)` を呼ぶ）: `stepValue(readStepAttrs(control), direction)` を `control.value` に入れ、**`input` と `change` イベントを `control` から dispatch**（`new Event('input', { bubbles: true, composed: true })` → `new Event('change', …)`）。
  フレームワークの `v-model` / `onChange` はこの 2 つを見る。**`rd-change` のような独自イベントは出さない**（`rd-text-field` と同じ。値の真実は `<input>` で、購読は `<input>` に付ける）。
  押した後に `control.focus()` は**しない**（ポインタで押した人の焦点を入力欄へ飛ばさない。SR のタッチ探索でボタンを押した人は読み上げで値を知る → `<input>` の値変化はネイティブが通知する）。
- `#listeners`: `input` → `requestUpdate`、`change` / `blur` → touched、`invalid` → `preventDefault` + touched（slider と同じ）。
- `get value` / `set value` / `get valueAsNumber` は slider と同じ委譲。`stepUp()` / `stepDown()` を公開メソッドとして持つ（中身は `#step(1)` / `#step(-1)`。ネイティブの `stepUp` と名前を揃えるが、こちらは**空欄・`any`・丸めを純関数で扱い、例外を投げない**）。
- `disconnectedCallback` で `detach` ×2 と `observer.disconnect()`。
- **`number-field.dom.ts`** に置くもの: `readStepAttrs(control): StepAttrs`、`applyStep(control, direction): void`（値を書き、2 イベントを出す）、`stepperTemplate(view, onStep): TemplateResult`。element が 150 行を超えない配置を**最初から**取る（slider が 149 行）。

### 4. CSS（`number-field.css`）

- `rd-number-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--rd-space-2); row-gap: var(--rd-number-field-gap, var(--rd-space-1)); align-items: center }`
  `> label { grid-column: 1 / -1; font-weight: var(--rd-font-weight-bold); color: var(--rd-color-text-default) }`
  `> input { grid-row: 2; grid-column: 1 }`、`> [part='stepper'] { grid-row: 2; grid-column: 2 }`、`> [part='hint'], > [part='error'] { grid-column: 1 / -1; margin: 0 }`
  （light DOM の並びは label → input → hint → error → stepper。**grid の位置指定**で stepper を input の横に置く）
- `> input`: `text-field.css` の入力欄と**同じ宣言**（上の抜粋）+ `font-variant-numeric: tabular-nums`（`.rd-numeric` と同じ 1 行。クラスは付けない）。`:focus-visible` の輪、`:user-invalid` の危険色、`:disabled` の muted も text-field と同じ
- **ブラウザの spinner を消す**: `rd-number-field:defined > input { appearance: textfield }` と `rd-number-field:defined > input::-webkit-inner-spin-button, rd-number-field:defined > input::-webkit-outer-spin-button { appearance: none; margin: 0 }`。
  `:defined` の中だけ（JS 無しではネイティブの spinner を残す）。**stylelint がベンダー疑似要素を落としたら、この 2 宣言は書かずに残す**（規則を緩めない。報告に書く。STOP ではない）
- `[part='stepper'] { display: inline-flex; gap: var(--rd-space-1); padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken) }`
  （`.rd-input-group` / `rd-toggle-group [part='options']` と同じ「枕」）
- `[part='stepper'] > button { inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); border: var(--rd-border-width-default) solid transparent; border-radius: var(--rd-radius-full); background: var(--rd-color-surface-raised); box-shadow: var(--rd-shadow-raised); color: var(--rd-color-text-default); font: inherit; font-size: var(--rd-type-heading-4-font-size); line-height: 1; cursor: pointer }`（`--rd-font-size-*` というトークンは無い。`--rd-type-*-font-size` を使う）
  `:hover:where(:enabled) { background: var(--rd-color-surface-hover) }`、`:active:where(:enabled) { box-shadow: none }`、`:disabled { color: var(--rd-color-text-muted); box-shadow: none; cursor: not-allowed }`
  **`rd-button` は使わない**（部品が部品を描くと定義順に依存する。`rd-data-table` の `part="sort"` と同じ判断）
- 強制配色: `[part='stepper'] { border: var(--rd-border-width-default) solid CanvasText; background: Canvas }`、`button { border-color: ButtonText; background: ButtonFace; color: ButtonText; box-shadow: none }`、`button:disabled { color: GrayText; border-color: GrayText }`
- `@media (prefers-reduced-motion: no-preference)` の中だけに `transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard)`
- **`box-shadow: inset …` は書かない**（stylelint）。`:not(:defined)` は何も足さない（label + input が縦に並ぶ普通の数値入力）。
- 詳細度は **`0,3,0` 以下**（stylelint `selector-max-specificity`）。`:where()` で逃がす

### 5. イベント・状態・JSDoc

- 独自イベントは**無し**。`@fires` は書かない（`<input>` の `input` / `change` が出ることは `@summary` と proposal に書く）
- `@csspart stepper` / `@csspart decrement` / `@csspart increment` / `@csspart hint` / `@csspart error`
- `@cssprop --rd-number-field-gap - ラベル・入力欄・文言の間隔。既定 var(--rd-space-1)`
- `@state invalid` / `@state errored` / `@state hinted` / `@state filled` / `@state malformed`（`_shared/field.ts` の `computeStates` のまま）
- `@summary 数値を 1 つ。<label for> と <input type=number> は利用側が書く。− / + の 44px ボタンと刻みの丸めだけ部品が足す`、`@status experimental`、`@pe A`

### 6. 検証面

- `number-field.contract.test.ts`（roles / tree / `numberFieldMarkup` が `type="number"` と `value` を書く、`defaultValue` 省略で `value` 属性が出ない、エスケープ）
- `number-field.logic.test.ts`（`parseStep`: 無し・`any`・`0`・`-1`・`abc` → 1、`'0.1'` → 0.1；`decimalsOf`；`stepValue`: 空欄 + min 無し → `'1'` / `'-1'`、空欄 + `min="5"` → `'5'`（どちら向きでも）、`'0.2'` + `step="0.1"` → `'0.3'`（`0.30000000000000004` にならない）、`'1.5'` + `step="1"` → `'2.5'`、`max="3"` で `'3'` + 1 → `'3'`、`min="0"` で `'0'` − 1 → `'0'`、`'abc'` は空欄扱い；`canStep`: 境界・空欄・min/max 無し；`computeNumberFieldView`: `disabled` で両方 false、文言の日英）
- `number-field.test.ts`（実 DOM）: 契約欠落で `malformed` + `console.error`、+ を押すと `input.value` が `'2'` になり **`input` → `change` の順で 2 つのイベントが `<input>` から bubble する**、− で戻る、`max` に達すると `increment` が `disabled`、外から `max` 属性を書き換えると `disabled` が追随（MutationObserver）、`<input disabled>` で両方 `disabled`、`stepUp()` / `stepDown()`、`value` setter、`hint` / `error` の `aria-describedby`、`invalid` イベントで `:state(invalid)`、`form.reset()` で touched が戻る、ボタンが **44 × 44px 以上**（`getBoundingClientRect`）、`tabindex="-1"`（Tab で止まらない）、`prefers-reduced-motion: reduce` で `getAnimations()` が空
- `number-field.sr.test.ts`: 仮想 SR が「数量 spinbutton 1」の後に「減らす button」「増やす button」を読む（ボタンは Tab 順に無いが**アクセシビリティツリーには居る**）
- `e2e/pe/build-pages.ts` に `number-field.html`（`numberFieldMarkup({ id: 'copies', label: '枚数', name: 'copies', defaultValue: '1', min: '1', max: '99' })` を `<form>` に）、`tier-a.spec.ts` に **JS 無し 2 本**（値が送信される `copies=1`／`[part='stepper']` が 0 個）、`e2e/a11y/keyboard.spec.ts` に **JS あり 2 本**（+ をクリックで `2`／入力欄で ↑ を押すとネイティブが刻む（`2`）— 部品が邪魔していないこと）、`axe.spec.ts` に 1 ページ追加
- `e2e/frameworks/shared.ts` に `numberFieldSuite`（4 フレームワークで描画・+ を押すと `<input>` の値が `2`・フレームワーク側の `input` 購読が動く（`echo` 表示など既存 suite の作法に合わせる））、4 アプリに 1 例ずつ
- `tools/mcp/src/examples.ts` に `'rd-number-field'`、`library/react/test/markup.test.tsx` に生成ラッパーのテスト 1 本（**名前付き import**。`RdNumberField` の props に `min` / `max` / `step` / `defaultValue` が通る）
- `.size-limit.json` に `number-field/define`（lit 込み）**12 KB**（`slider/define` の直前。アルファベット順）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check を通す。

### Step 1 — 契約と純関数（`feat(elements): add the rd-number-field contract and stepping logic`）

`bun run scaffold:element number-field --pe A` → 契約と `number-field.logic.ts` のテストを先に書く → green。

### Step 2 — element と CSS（`feat(elements): add rd-number-field (experimental, tier A)`）

`number-field.dom.ts` / `number-field.element.ts` / `number-field.css` / stories / `number-field.test.ts` / `number-field.sr.test.ts`。`bun run build && bun run gen`。
exports・size-limit・examples・react test・`custom-elements.json` もこの Step で。

### Step 3 — 検証面（`test(e2e): cover rd-number-field with and without JS and in the four frameworks`）

### Step 4 — VRT（`test(vrt): baselines for number-field`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（新規画像だけ増えること。`git status` で既存画像の変更が無いこと）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-number-field decision and add a changeset`）

`docs/proposals/number-field.md`（なぜ `<input type="number">` を捨てず包むのか（`inputmode="numeric"` + `type="text"` 案との比較。桁区切り・ロケール表示は利用側）／なぜボタンが `tabindex="-1"` か／なぜ独自イベントを出さず `<input>` の `input` / `change` を出すのか／なぜ `stepUp()` を自前で持つか（空欄・`any`・丸め・例外）／長押しの連続刻みを入れない理由（タイマー注入が要り、まず要望を待つ）／`unit` 属性を持たない理由（`hint` か label に書く。`rd-slider` の `unit` とは役割が違う））、`.changeset/number-field.md`（`@rimltempest/riml-ds-elements` minor、ラッパー 4 つ patch）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`number-field.*.test.ts` を含む）
- `wc -l library/elements/src/number-field/number-field.element.ts` ≤ 150、`grep -c '\bif\b' …/number-field.element.ts` ≤ 5
- **ティア A の不変条件**: `grep -c '@pe A' …/number-field.element.ts` = 1、`grep -cE 'static (override )?styles|shadowRootOptions|attachShadow' …/number-field.element.ts` = 0、`test ! -e library/elements/src/number-field/number-field.styles.ts`、`grep -c 'createRenderRoot' …/number-field.element.ts` = 1
- `grep -c "'\$defaultValue'" library/elements/src/number-field/number-field.contract.ts` = 1、`grep -c "'\$value'" … = 0`
- `grep -c 'throw' library/elements/src/number-field/number-field.logic.ts` = 0、`grep -c 'stepUp\|stepDown' …/number-field.dom.ts` = 0（ネイティブの `stepUp` / `stepDown` を呼んでいない。自前の純関数で刻む）
- `grep -c "dispatchEvent" …/number-field.dom.ts` = 2（`input` と `change`）、`grep -c "CustomEvent" library/elements/src/number-field/*.ts` = 0（独自イベント無し）
- `grep -c 'tabindex="-1"' …/number-field.dom.ts` ≥ 1
- `bash scripts/guard.sh` = 0（規則 8・9・15 を含む）、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c "'rd-number-field'" library/react/src/generated/jsx.ts` ≥ 1、`grep -c 'RdNumberField' library/react/src/generated/experimental.ts` ≥ 1、React の `markup` props に `min` / `max` / `step` / `required` / `defaultValue` がある
- `.size-limit.json` の `number-field/define` が通る（12 KB）

## STOP する条件（改善せず報告する）

- **`bash scripts/guard.sh` が落ちる**（規則 8・9 のどちらでも）。guard を緩めたり grep をすり抜ける書き方で通したりしない
- 既存 VRT 画像が変わる。size-limit 超過。`number-field.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- markuplint が light DOM の `<span part="stepper"><button tabindex="-1">` を落とす（規則を緩めない。報告する）
- axe が `<button tabindex="-1">` に何かを出す、または `<input type="number">` と `aria-describedby` の組で `aria-valid-attr-value` を出す
- vitest browser で `input.value = …` の後に `validity.rangeOverflow` が更新されない（`max` 到達のテストが書けない）
- `_shared/**` / `system/**` / `text-field/**` / `slider/**` を変えないと実装できない

## スコープ外

- 長押しの連続刻み（タイマー注入。要望が出たら別計画）、桁区切り・通貨・ロケール表示（`Intl.NumberFormat` を使う `type="text"` の別部品になる。まず要望を待つ）、`unit` 属性、`rd-text-field` への統合（`type="number"` の判定で分岐すると text-field が 150 行を超える）、ホイールでの値変更の抑止（ブラウザ既定に任せる）

## 保守メモ

- 値の真実は light DOM の `<input type="number">`。**部品は値を持たない**（`value` / `valueAsNumber` は委譲）。外から値を変えるときは `element.value = …` か「`input.value = …` + `input` イベント」
- ボタンの刻みは `number-field.logic.ts` の `stepValue` **だけ**が決める。ネイティブの `stepUp()` は呼ばない（`step="any"` で例外、空欄の開始値がブラウザ依存、浮動小数の誤差）。↑↓ キーはネイティブのまま（部品は触らない）ので、**キーとボタンで丸めの結果が違う**場合がある（`step="0.1"` をキーで刻んだときの誤差はブラウザの責任）。気になる利用側は `step` の桁に合わせた `value` を書く
- `_shared/field.ts` の文言表（`rangeUnderflow` / `rangeOverflow` / `stepMismatch`）はそのまま使う。文言を変えるときは `system/guidelines/writing.md` → `_shared/field.ts` → text-field / select / slider / number-field の VRT を見る
- 「枕」の見た目（`[part='stepper']`）は `.rd-input-group` / `rd-toggle-group [part='options']` / `rd-checkbox-group:state(segmented)` と 4 つ目の重複。**次に増えたら `patterns.css` の `.rd-segmented` に寄せる**（031 / 021 の proposal 保守メモと同じ判断）
