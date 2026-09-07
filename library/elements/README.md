# @rimltempest/riml-ds-elements

riml-ds の Web Components（Lit 3）。部品の実装はここだけに書く（ADR-0002）。

部品には **PE ティア**がある（ADR-0012。`custom-elements.json` の `pe`）。

| ティア | JS 無しで        | 構造                                    | 置き場                                               |
| ------ | ---------------- | --------------------------------------- | ---------------------------------------------------- |
| A      | 動く             | light DOM。ネイティブ要素を子として包む | `<name>.css` + `<name>.contract.ts`                  |
| B      | 内容が見える     | shadow は枠だけ。内容は slot            | `<name>.css`（`:not(:defined)`）+ `<name>.styles.ts` |
| C      | 無くても害が無い | shadow 完結                             | `<name>.styles.ts`                                   |

## ビルド

- **反応的プロパティは `static properties` + `declare` フィールドで宣言する**（ADR-0005 §4 の退路）。
  TC39 標準デコレータ（`@property() accessor`）は `tsc` は正しく emit するが、Vitest browser が使う
  Vite 8 / rolldown（oxc）はデコレータと `accessor` を**素通し**し、Chromium が構文エラーにする。
- 計測（`bunx size-limit`、lit 込み・esbuild bundle・brotli、2026-09-07）：`static properties` **5.35 kB** /
  標準デコレータ 6.25 kB。デコレータのヘルパは `importHelpers: true`（tslib import）でも `false`（インライン）でも
  bundle 後は同値だった。`importHelpers: true` は据え置き（今は helper が 1 つも出ないので 0 バイト）。
- light DOM 描画（`createRenderRoot() { return this }`）は**既存の子を消さない**。`render()` が返す強化ノードは
  子の**末尾**に足される（spike で `<rd-probe><span>keep</span></rd-probe>` → `span`, `p` の順を確認）。

## `disabled` の運用

- 部品は `disabled` 属性を**持たない**。押せなくするならネイティブの `<button disabled>` を子に書く。
- ただし ADR-0008 は「フォーカスを消さない」を求める。押せないことを伝えつつフォーカスを残すなら、
  利用側が子に `aria-disabled="true"` を書き、`click` を無視する（部品は関与しない）。
- 「処理中で押せない」は `disabled` ではなく `rd-button` の `loading`。押下は無視され `aria-busy` が付く。
