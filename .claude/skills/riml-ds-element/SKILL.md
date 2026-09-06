---
name: riml-ds-element
description: riml-ds の部品（Lit Web Components）の作り方。library/elements に部品を足す・直す前に読む。ファイル構成（element/logic/styles/define/stories/test）、rd- プレフィックス、ElementInternals と form-associated、:state()、delegatesFocus、JSDoc（@slot/@csspart/@cssprop/@event/@status）による CEM、story 8 種。「部品を追加する」「フォーム部品にする」「イベント名をどうする」「ラッパーに反映されない」「CEM に出ない」で発火。
---

# riml-ds 部品規約

根拠は [ADR-0002](../../../docs/adr/0002-lit-elements-and-generated-wrappers.md)、
[ADR-0005](../../../docs/adr/0005-class-exception-for-elements.md)、
[ADR-0008](../../../docs/adr/0008-aaa-and-element-internals.md)。a11y の必須事項は
[system/guidelines/accessibility.md](../../../system/guidelines/accessibility.md)。
CSS は `riml-ds-css`、TS は `riml-ds-typescript`、テストは `riml-ds-tdd`。

## 1. ファイル構成（1 部品 = 1 ディレクトリ）

```
library/elements/src/button/
  button.logic.ts        純関数。属性 → 状態・aria の集合。DOM を触らない
  button.logic.test.ts   node
  button.element.ts      class RdButton extends LitElement（薄い殻）
  button.styles.ts       css``（riml-ds-css）
  button.define.ts       customElements.define('rd-button', RdButton) だけ
  button.test.ts         Vitest browser（実 DOM）
  button.sr.test.ts      仮想スクリーンリーダー（任意だが対話部品は必須）
  button.stories.ts      CSF3 + play
  index.ts               export { RdButton } from './button.element.js'（define しない）
```

`package.json` の `exports`：`"./button"`（class）と `"./button/define"`（登録込み）。
実験的なら `src/experimental/button/` と `"./experimental/button"`。

## 2. 命名

| 対象          | 規約                                | 例                            |
| ------------- | ----------------------------------- | ----------------------------- |
| タグ          | `rd-<kebab>`                        | `rd-text-field`               |
| class         | `Rd<Pascal>`                        | `RdTextField`                 |
| 属性          | kebab、boolean は存在で true        | `variant`, `disabled`         |
| プロパティ    | camel（属性と自動対応）             | `helpText` ↔ `help-text`      |
| イベント      | `rd-<kebab>`、`detail` はオブジェクト | `rd-change` `{ value }`     |
| slot          | kebab。既定 slot は無名             | `icon-start`                  |
| CSS part      | kebab。操作対象は必ず `control`     | `control`, `label`, `hint`    |
| CSS 変数      | `--rd-<component>-<prop>`           | `--rd-button-padding-inline`  |
| 状態          | kebab                               | `:state(loading)`             |

ネイティブイベント（`input`、`change`、`click`）は**透過**させ、同名の独自イベントを出さない。
独自イベントは「ネイティブに無い意味」だけ（`rd-dismiss`、`rd-announce`）。

## 3. `*.element.ts` の骨格

```ts
/**
 * 操作の起点となるボタン。
 *
 * @summary 操作の起点。primary は画面に 1 つ
 * @status stable
 *
 * @slot - ラベル。省略不可
 * @slot icon-start - ラベルの前のアイコン（aria-hidden を付ける）
 * @csspart control - 内側の <button>
 * @cssprop --rd-button-padding-inline - 横パディング。既定 var(--rd-space-4)
 * @event {CustomEvent<{}>} rd-press - Enter/Space/click のいずれかで発火（loading 中は発火しない）
 * @state loading - 読み込み中
 */
export class RdButton extends LitElement {
  static styles = styles
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true }
  static formAssociated = true              // type=submit を form に届けるため

  @property() accessor variant: ButtonVariant = 'primary'
  @property() accessor type: 'button' | 'submit' | 'reset' = 'button'
  @property({ type: Boolean, reflect: true }) accessor loading = false
  @property({ type: Boolean, reflect: true }) accessor disabled = false

  #internals = this.attachInternals()

  render() {
    const s = computeButtonState({ variant: this.variant, loading: this.loading, disabled: this.disabled })
    syncStates(this.#internals, s.states)
    return html`<button part="control" type=${this.type}
      aria-disabled=${s.ariaDisabled ?? nothing} aria-busy=${s.ariaBusy ?? nothing}
      @click=${this.#onClick}>
      <slot name="icon-start"></slot><slot></slot>
    </button>`
  }

  #onClick = (e: MouseEvent) => {
    const r = decidePress({ loading: this.loading, disabled: this.disabled, type: this.type })
    if (r.kind === 'blocked') { e.preventDefault(); e.stopPropagation(); return }
    if (r.kind === 'submit') this.#internals.form?.requestSubmit()
    this.dispatchEvent(new CustomEvent('rd-press', { bubbles: true, composed: true, detail: {} }))
  }
}
```

JSDoc の `@summary` / `@status` / `@slot` / `@csspart` / `@cssprop` / `@event` / `@state` は
**CEM に載る唯一の経路**。書かなければラッパー・Storybook・MCP に出ない。

## 4. a11y の必須実装

- **ラベル**：`label` 属性（テキスト系）か既定 slot（ボタン系）。空なら
  `console.error('[rd-x] accessible name is required')` + `states.add('unlabeled')`。
- **`delegatesFocus: true`**。フォーカスリングは内部の `[part='control']:focus-visible`。
- **無効**は `aria-disabled`（`disabled` 属性を内部 `<button>` に渡さない）。フォーカス可能のまま。
- **読み込み中**は `aria-busy` + 視覚表示 + 操作の無視。`disabled` にしない。
- **フォーム部品**：`static formAssociated = true`、`#internals.setFormValue(value)`、
  `setValidity({ valueMissing: true }, message, anchor)`、`formResetCallback()`、
  `formDisabledCallback(disabled)`。エラー表示は `:user-invalid` 以降。
- **ラベル参照**：`labelledBy: Element[]` プロパティ → `#internals.ariaLabelledByElements`
  （ID 文字列の `aria-labelledby` は受け取らない）。
- **ライブリージョン**：部品に `aria-live` を書かない。`rd-live-region` の `announce()` へ。
- **キーボード**：Enter / Space（ボタン）、Esc（閉じる）。矢印はリスト系だけ。
- **ダイアログ**：ネイティブ `<dialog>` を包み `showModal()`。閉じたら開いた要素へフォーカスを戻す。

## 5. story 8 種（最低）

`Default`、`Variants`（全 variant）、`Disabled`、`Invalid` / `Loading`（該当時）、`Dark`、
`ForcedColors`、`ReducedMotion`、`RTL`、`Dense`。共通の decorator（`apps/storybook/.storybook/modes.ts`）が
モードを当てる。`argTypes` は `tools/cem` が CEM から生成したものを spread する。

## 6. 完了条件

- [ ] `bun run gen` で `custom-elements.json` に部品が出る（`@status` 付き）
- [ ] `library/react/src/generated/<Name>.ts` が生成され `e2e/react` で描画・操作できる
- [ ] story 8 種、addon-a11y（AAA）が通る
- [ ] `*.logic.test.ts` / `*.test.ts` / `*.sr.test.ts`
- [ ] `*.element.ts` ≤ 150 行、`if` ≤ 5
- [ ] `size-limit` の予算内
- [ ] `docs/proposals/<name>.md` があり、guidelines と矛盾しない
