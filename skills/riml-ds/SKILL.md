---
name: riml-ds
description: riml-ds（@rimltempest/riml-ds-*）を使うアプリで UI を書く・直す前に読む。トークン（--rd-*）と部品（<rd-*>）の使い方、React / Vue / Svelte / Astro 別の導入と落とし穴、禁止事項（生値・独自ボタン・aria-live の自作）、MCP の登録、レビュー観点。「ボタンを置きたい」「色を指定したい」「ダークモード対応」「フォームを作る」「riml-ds に無い部品が要る」で発火。
---

# riml-ds を使う

対応バージョン: `@rimltempest/riml-ds-*` 0.x（初回リリースまでは main の状態）。
見た目の判断は riml-ds の `DESIGN.md`、部品 API は `@rimltempest/riml-ds-elements/custom-elements.json` が正。
分からないことは **MCP（`riml-ds`）に聞く**：`get_element("rd-button")`、`search_tokens("本文の色")`、
`check_contrast(...)`、`suggest_component("確認して削除する操作")`。

## 0. まずこれだけ

| やること                                                     | やらないこと                                  |
| ------------------------------------------------------------ | --------------------------------------------- |
| `var(--rd-color-text-default)`                               | `#333`、`16px`、`200ms` の生値                |
| `<rd-button variant="primary">保存</rd-button>`              | `<button class="btn">` を自作                 |
| `<rd-text-field label="メール" name="email" required>`       | `<input>` + 独自ラベル                        |
| `document.querySelector('rd-live-region').announce('保存しました')` | 自分で `aria-live` を置く              |
| ダークは `color-scheme` に任せる                             | `[data-theme="dark"]` で色を書き分ける        |
| 無い部品は **アプリ内に作り**、汎用なら riml-ds に提案        | riml-ds の部品を `::part` で別物に改造する    |

## 1. 導入

```bash
bun add @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css @rimltempest/riml-ds-elements
# フレームワーク別（任意）: @rimltempest/riml-ds-react | @rimltempest/riml-ds-vue | @rimltempest/riml-ds-svelte | @rimltempest/riml-ds-astro
```

ルート CSS（最初に読み込む）：

```css
@import "@rimltempest/riml-ds-css/layers.css";      /* @layer の順序宣言 */
@import "@rimltempest/riml-ds-tokens/tokens.css";   /* --rd-*（light-dark 込み） */
@import "@rimltempest/riml-ds-css/base.css";        /* reset + base */
/* ブランドテーマがあれば */
@import "@rimltempest/riml-ds-tokens/themes/qrcc.css";

@layer app {  /* rd.overrides より後に宣言されるので必ず勝つ */
  /* アプリの CSS */
}
```

`<html>` に `lang` と `<meta name="color-scheme" content="light dark">`。

`.mcp.json`：

```json
{ "mcpServers": { "riml-ds": { "command": "bunx", "args": ["@rimltempest/riml-ds-mcp"] } } }
```

## 2. 部品の使い方

```html
<rd-button variant="primary" type="submit">保存</rd-button>
<rd-button variant="ghost"><svg slot="icon-start" aria-hidden="true">…</svg>閉じる</rd-button>

<form>
  <rd-text-field label="メール" name="email" type="email" required hint="確認メールを送ります"></rd-text-field>
  <rd-button type="submit">送信</rd-button>
</form>

<rd-dialog id="confirm" label="削除の確認">
  <p>削除すると元に戻せません。</p>
  <rd-button slot="actions" variant="danger">削除</rd-button>
</rd-dialog>
<rd-live-region></rd-live-region>   <!-- ページに 1 つ -->
<rd-skip-link href="#main">本文へ</rd-skip-link>
```

- 部品は **ネイティブフォーム**に参加する。`FormData`、`required`、`checkValidity()` がそのまま使える。
- 状態は `:state()`：`rd-dialog:state(open) { … }`、`rd-text-field:state(invalid) { … }`。
- 上書きは `::part(control)` と `--rd-<component>-*` 変数だけ。shadow の中の class を狙わない。
- 独自イベントは `rd-*`（`rd-press`、`rd-dismiss`）。`input` / `change` / `click` はネイティブのまま届く。

### 登録

```ts
import '@rimltempest/riml-ds-elements/button/define'      // 使う部品ごとに 1 行。副作用 import
```

SSR（TanStack Start / Astro）では `:not(:defined)` の間のレイアウトを `@rimltempest/riml-ds-css/base.css` が
固定する。定義前に見た目を触らない。

## 3. フレームワーク別

### React 19（TanStack Start / Next）

```tsx
import { RdButton, RdTextField } from '@rimltempest/riml-ds-react'
<RdButton variant="primary" onRdPress={() => save()}>保存</RdButton>
```

- `@rimltempest/riml-ds-react` は `@lit/react` の `createComponent` を CEM から生成したもの。
  イベントは `onRdPress` の形で型が付く。
- RSC からは描画できない。`'use client'` の境界の内側で使う（`@rimltempest/riml-ds-react` の各 export は
  `'use client'` 付き）。
- SSR は Declarative Shadow DOM。`renderToString` では shadow が出ないので、
  レイアウトは `:not(:defined)` の CSS が受ける。ハイドレーション後に define が走る。
- `ref` はホスト要素。`ref.current.focus()` は `delegatesFocus` で内部に届く。

### Vue 3.5

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('rd-') } } })
```

```vue
<rd-text-field :label="t('email')" v-model="email" required />
```

`@rimltempest/riml-ds-vue` はプラグイン（型 + `v-model` の `value` / `input` 対応）。
非文字列のプロパティは `.prop`（`:items.prop="list"`）。

### Svelte 5

摩擦なし。`import '@rimltempest/riml-ds-elements/button/define'` して `<rd-button>` を書く。
型は `@rimltempest/riml-ds-svelte` の `svelteHTML` 拡張。イベントは `onrd-press={…}`。

### Astro 5

`client:*` 不要。`@rimltempest/riml-ds-astro` の integration が `tokens.css` と `layers.css` を注入する。
インタラクションが要るページで define を `<script>` から import。

## 4. ダーク・密度・強制テーマ

- ダーク：何もしない。`color-scheme` に従う。
- 強制：`<html style="color-scheme: dark">`。JS のトグルは `document.documentElement.style.colorScheme = 'dark'`。
- 密度：`<body data-density="compact">`。
- 高コントラスト・低モーション・強制配色：OS 設定に自動追従。アプリで上書きしない。

## 5. 無い部品が要るとき

1. **まずアプリの中に作る**（`features/<x>/ui/`）。riml-ds のトークンと `rd-button` 等を中で使う。
2. 2 つ以上のアプリで使いそうなら riml-ds に `docs/proposals/<name>.md` を出す。
3. riml-ds の部品を `::part` で別物にしない。別物が要るなら 1 に戻る。

## 6. レビュー観点（アプリ側）

- [ ] 生値ゼロ（`#`、`px`、`ms`、`oklch(` を grep）
- [ ] ボタン・入力・ダイアログは `rd-*`（`<button` / `<input` / `<dialog` の直書きが無いか）
- [ ] `aria-live` の自作が無い
- [ ] `[data-theme]` / `prefers-color-scheme` の自前分岐が無い
- [ ] `::part` の上書きが「微調整」の範囲（色・余白）に留まる
- [ ] 部品の `label` が空でない（Storybook / axe が落ちる前にレビューで見る）
- [ ] `rd-live-region` がページに 1 つ

## 7. トラブル

| 症状                                     | 原因と対処                                                       |
| ---------------------------------------- | ---------------------------------------------------------------- |
| 見た目が素の HTML                        | `tokens.css` / `base.css` の読み込み順。`layers.css` を最初に      |
| 部品が描画されない                       | `define` を import していない                                     |
| React で属性が文字列で渡る               | `@rimltempest/riml-ds-react` を使う（生の `<rd-x>` は boolean が `"false"` になる）|
| Vue で「Unknown custom element」         | `isCustomElement` 未設定                                         |
| フォームに値が載らない                   | `name` 属性が無い                                                |
| ダークで色が変わらない                   | `<meta name="color-scheme">` が `light` 固定                       |
| フォーカスリングが見えない               | アプリ CSS の `outline: none`。消す                              |
