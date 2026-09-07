# @rimltempest/riml-ds-elements

riml-ds の Web Components（Lit 3）。部品の実装はここだけに書く（ADR-0002）。
公開 API の正は `custom-elements.json`（CEM）。ラッパー・Storybook・MCP はそこから生成する。

## PE ティア（ADR-0012）

部品は Progressive Enhancement のティアを 1 つ宣言する（JSDoc `@pe`。CEM の `pe` に出る）。

| ティア | JS 無しで        | 構造                                    | 置き場                                               |
| ------ | ---------------- | --------------------------------------- | ---------------------------------------------------- |
| A      | 動く             | light DOM。ネイティブ要素を子として包む | `<name>.css` + `<name>.contract.ts`                  |
| B      | 内容が見える     | shadow は枠だけ。内容はすべて slot      | `<name>.css`（`:not(:defined)`）+ `<name>.styles.ts` |
| C      | 無くても害が無い | shadow 完結                             | `<name>.styles.ts`（`.css` を持たない）              |

## 部品

| 部品             | ティア | 概要                                              | 主な API                                                       |
| ---------------- | ------ | ------------------------------------------------- | -------------------------------------------------------------- |
| `rd-button`      | A      | 子の `<button>` / `<a href>` を包む               | `variant`, `loading`, `rd-press`, `:state(loading)`            |
| `rd-text-field`  | A      | 子の `<label for>` + `<input>` を包む             | `hint`, `error`, `value`, `checkValidity()`, `:state(invalid)` |
| `rd-dialog`      | B      | ネイティブ `<dialog>` を枠にし内容は slot         | `open`, `persistent`, `show()`, `close()`, `rd-dismiss`        |
| `rd-live-region` | C      | 読み上げの集約点。ページに 1 つ                   | `announce(text, { politeness })`, `rd-announce`                |
| `.rd-skip-link`  | —      | 本文へのスキップ。**部品ではない**（ADR-0012 §6） | `@rimltempest/riml-ds-css` のクラス                            |

## 使い方

```html
<!-- ティア A：ネイティブ要素を子として書く。JS が無くても押せる・送信できる -->
<rd-button variant="primary"><button type="submit">保存</button></rd-button>

<form method="post" action="/save">
  <rd-text-field hint="確認メールを送ります">
    <label for="email">メール</label>
    <input id="email" name="email" type="email" required autocomplete="email" />
  </rd-text-field>
</form>

<!-- ティア B：内容は slot。JS が無くても inline のセクションとして読める -->
<rd-dialog id="confirm">
  <h2 slot="label">削除の確認</h2>
  <p>削除すると元に戻せません。</p>
  <rd-button slot="actions" variant="danger"><button type="button">削除</button></rd-button>
</rd-dialog>

<!-- ティア C：無くても害が無い -->
<rd-live-region></rd-live-region>
```

```ts
// 登録（副作用 import）。部品ごとに読み込む。`.` エントリは無い（ADR-0002）
import '@rimltempest/riml-ds-elements/button/define'
import '@rimltempest/riml-ds-elements/text-field/define'
```

```css
/* ティア A/B の見た目。define を読まなくても当たる */
@import '@rimltempest/riml-ds-elements/styles.css';
/* 部品ごとに読むなら */
@import '@rimltempest/riml-ds-elements/button/style.css';
```

`@rimltempest/riml-ds-tokens/tokens.css` と `@rimltempest/riml-ds-css/layers.css` を先に読み込むこと
（`--rd-*` と `@layer` の順序がここに依存する）。

### `markup()`（マークアップ契約）

ティア A/B は「必要な子」と「既定のマークアップの木」を `<name>.contract.ts` に持つ。
Storybook・e2e・各フレームワークのラッパー生成器（plan 006）は**同じ木**から出力する。

```ts
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'

textFieldMarkup({ id: 'email', label: 'メール', name: 'email', type: 'email', required: true })
// → <rd-text-field><label for="email">メール</label><input id="email" name="email" type="email" required></rd-text-field>
```

`id` は**呼び側が渡す**（React は `useId`、Astro は props）。部品は生成しない。
契約に合わない子（`<input>` が無い等）は `console.error` + `:state(malformed)` になる。

`rd-dialog` の `children` は**エスケープされない生 HTML**（`MarkupNode` の `{ raw }`）。
利用側が組み立てた信頼済みの断片だけを渡すこと。

## `disabled` の運用

- 部品は `disabled` 属性を**持たない**。押せなくするならネイティブの `<button disabled>` を子に書く。
- ただし ADR-0008 は「フォーカスを消さない」を求める。押せないことを伝えつつフォーカスを残すなら、
  利用側が子に `aria-disabled="true"` を書き、`click` を無視する（部品は関与しない）。
- 「処理中で押せない」は `disabled` ではなく `rd-button` の `loading`。押下は無視され `aria-busy` が付く。

## ビルド

- **反応的プロパティは `static properties` + `declare` フィールドで宣言する**（ADR-0005 §4 の退路）。
  TC39 標準デコレータ（`@property() accessor`）は `tsc` は正しく emit するが、Vitest browser が使う
  Vite 8 / rolldown（oxc）はデコレータと `accessor` を**素通し**し、Chromium が構文エラーにする。
- 計測（`bunx size-limit`、lit 込み・esbuild bundle・brotli、2026-09-07）：`static properties` **5.35 kB** /
  標準デコレータ 6.25 kB。デコレータのヘルパは `importHelpers: true`（tslib import）でも `false`（インライン）でも
  bundle 後は同値だった。`importHelpers: true` は据え置き（今は helper が 1 つも出ないので 0 バイト）。
- light DOM 描画（`createRenderRoot() { return this }`）は**既存の子を消さない**。`render()` が返す強化ノードは
  子の**末尾**に足される（spike で `<rd-probe><span>keep</span></rd-probe>` → `span`, `p` の順を確認）。

```bash
bun run --filter @rimltempest/riml-ds-elements build   # dist/**/*.js + .d.ts + .css + styles.css
bun run gen                                            # custom-elements.json と tools/cem/registry.json
bunx size-limit                                        # button/define ≤ 12 KB、dialog/define ≤ 14 KB（brotli）
```
