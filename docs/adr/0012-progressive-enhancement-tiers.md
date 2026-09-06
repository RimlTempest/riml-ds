# 0012: Progressive Enhancement を 3 ティアで規約化し、フォーム・ナビ部品は light DOM でネイティブ要素を包む

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0002（§4 SSR を改める）、ADR-0004、ADR-0008（「捨てた選択肢」の 2 項目目を部分的に改める）、
  [architecture.md](../architecture.md) §2、[baseline.md](../baseline.md)

## 文脈

利用側は RSC（TanStack Start / Next）、Astro、Vue / Svelte の SSR。要求は「JS が無い・遅い・失敗した
ときにも壊れないこと（Progressive Enhancement）」と「RSC のサーバーコンポーネントから使えること」。

ADR-0002 / 0008 の当初設計（shadow DOM の中に `<button>` / `<input>` を描き、`ElementInternals` で
form-associated にする。Shoelace 型）を JS 無しで評価すると：

| 部品            | JS 無し                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `rd-text-field` | 入力欄が**存在しない**（shadow は JS が作る）。フォームが送信できない          |
| `rd-button`     | 文字は見えるが押せない。shadow 内の `<button type=submit>` は外の `<form>` に属せない |
| `rd-skip-link`  | リンクが存在しない                                                            |
| `rd-dialog`     | 中身が見えない                                                                |
| `rd-live-region`| 何も起きない（害は無い）                                                      |

Declarative Shadow DOM（Baseline Widely）は**見た目**を SSR できるが**機能**は直らない：shadow 内の
`<input>` は light DOM の `<form>` に参加せず、form-associated custom element は `define` されるまで
form に載らない。DSD を出す `@lit-labs/ssr` は Labs のままで、ADR-0002 で見送っている。

RSC 側の事実（react.dev、2026-09 確認）：サーバーコンポーネントは**どの要素にも**イベントハンドラを
付けられない（controlled `<input>` も元から `'use client'`）。一方、custom element の props は
サーバーで**属性として直列化**され、children も渡せる。つまり「ネイティブ要素を包む純粋な HTML」なら
サーバーコンポーネントからそのまま出せる。controlled / uncontrolled の難しさは `<input>` と同じで、
WC 固有ではない。

「HTML web components」（Jeremy Keith ほか）——既に動くマークアップを custom element で包んで強化する
——は、この 2 つの要求を同時に満たす。代わりに shadow DOM のカプセル化を form 部品では手放す。

## 決定

1. **部品は PE ティアを 1 つ宣言する**（JSDoc `@pe A|B|C`。CEM → registry → docs → MCP に載る）。

   | ティア | 定義                                   | 対象                                         | 構造                                                |
   | ------ | -------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
   | **A**  | JS 無しで**動く**                      | フォーム部品、ボタン、リンク、ナビ            | **light DOM**。ネイティブ要素を子として包む。shadow 無し |
   | **B**  | JS 無しで**内容が見える**。操作は JS   | dialog、disclosure、tabs、menu、toast の本文  | shadow は枠だけ。**内容はすべて slot（light DOM）**   |
   | **C**  | JS 無しで**無くても害が無い**          | live-region、tooltip、スケルトン              | shadow 完結（従来どおり）                            |

   フォームに参加する部品・リンク・ボタンは **A 以外を選べない**（guard で落とす）。

2. **ティア A の作り方**
   - 利用側が書く（または各フレームワークのラッパーが出す）マークアップは
     `<rd-text-field><label for="e">メール</label><input id="e" name="email" type="email" required></rd-text-field>`
     のように**ネイティブ要素が light DOM に居る**。送信・検証・ラベル関連付け・`:user-invalid` は
     ブラウザが素で行う。
   - 部品の `*.element.ts` は `createRenderRoot() { return this }`（light DOM に描く）。
     既存の子は消さず、**強化ノード**（インラインのエラー文言、ヒント、カウンタ）を末尾に追加する。
     `attachInternals()` は `states` のためだけに使う（`formAssociated` にしない。form 参加者はネイティブ要素）。
   - スタイルは `static styles` ではなく **`<name>.css`**（`@layer rd.components { rd-text-field > input { … } }`）。
     `@rimltempest/riml-ds-elements/<name>/style.css` と束ねた `styles.css` で配る。JS が無くても CSS は当たる。
     `::slotted()` の制限（子孫・擬似要素に届かない）を避けるためでもある。
   - **マークアップ契約** `<name>.contract.ts`：必要な子要素（役割 → セレクタ）と、props からマークアップ
     を作る**純データの木**（`MarkupTree`。`$prop` プレースホルダ付き）。`markup(props)` はその木を
     HTML 文字列にする純関数。Storybook・Astro・e2e・各フレームワークのラッパー生成器（plan 006）が
     **同じ木**から出力する。契約に合わない子（`input` が無い等）は `console.error` + `:state(malformed)`。
   - ラベルはネイティブ `<label for>` で完結するため、ADR-0008 §4 の `labelledBy: Element[]` は
     **ティア B/C の部品にだけ**要る。

3. **ティア B の作り方**：内容（見出し・本文・アクション）は slot。`<name>.css` に
   `rd-dialog:not(:defined) { display: block }` のような**定義前の見え方**を書き、JS 無しでも内容が
   読める（dialog は inline のセクションとして表示される）。操作（`showModal()`、フォーカス管理）は JS。

4. **ティア C**：従来どおり shadow 完結、`static styles`。

5. **ラッパー**（plan 006）：ティア A/B のフレームワーク部品は契約の木から**マークアップを出す**だけの
   部品を生成する。React では関数 props（イベント）を受け取らない版を `'use client'` 無しで export し、
   サーバーコンポーネントから使える。イベントが要る場合は `'use client'` 版（React 19 は
   `onrd-press` を直接扱えるので `@lit/react` は複雑なプロパティを渡す部品にだけ使う）。
   controlled は `value` prop → 各描画でプロパティ再設定 + `useLayoutEffect` で不一致を書き戻す。
   uncontrolled は `defaultValue`。`<input>` と同じ意味論。

6. **スキップリンクは部品にしない**。JS が不要なので `@rimltempest/riml-ds-css` の `.rd-skip-link`
   （`rd.utilities` 層）で提供する。

7. **検証**：`e2e/pe/` で Playwright `javaScriptEnabled: false` のプロジェクトを持ち、ティア A の
   `markup()` 出力 + CSS だけを配信して「送信できる」「押せる」「axe AAA が通る」を固定する。
   ティア B は「内容が見える」を同様に固定する。

## 理由

- 要求の 2 つ（PE、RSC）を**同じ 1 つの設計**で満たせる。DSD も `@lit-labs/ssr` も要らない。
- a11y が単純になる：shadow をまたぐラベル問題（ADR-0008 の主要な苦労）が、フォーム部品では消える。
- Lit の価値が残るところ（枠・状態・イベント・ティア B/C の shadow）にだけ Lit を使う。
- 「境界が二重になり保守不能」（ADR-0008 で light DOM 案を捨てた理由）には、**ティアを宣言で固定し、
  ティアごとに置き場を 1 つにする**（A は `.css`、C は `static styles`）ことで答える。guard が守る。

## 捨てた選択肢

- **全部 shadow + DSD で SSR** — 見た目だけ直り、フォームが JS 無しで動かない。`@lit-labs/ssr` は Labs。
- **全部 light DOM（HTML web components 徹底）** — dialog / tooltip / live-region のような「枠しか無い」
  部品まで light DOM にする利点が無く、利用側 CSS との衝突面だけ広がる。Lit を使う理由もほぼ消える。
- **ティアを宣言せず部品ごとに判断** — 「フォーム部品だけ light DOM」を場当たりでやると ADR-0008 の
  懸念どおり保守不能になる。宣言 + guard が要る。
- **`ElementInternals` の form-associated をティア A で併用** — form 参加者が二重になる。使わない。

## 影響

- ADR-0002 §4「SSR は DSD + フォールバック」は、**ティア A/B では「マークアップは純粋な HTML、
  `:not(:defined)` は `.css` が受ける」に改める**。ティア C は従来どおり。
- ADR-0008 「捨てた選択肢」の light DOM 項は、**ティア A に限って採用**に改める。§4 `labelledBy` はティア B/C 限定。
- `riml-ds-element` skill：ファイル構成に `<name>.contract.ts`、`<name>.css`（A/B）を追加、ティア表と
  `@pe` タグ、ティア A の `createRenderRoot`。`riml-ds-css` skill：ティア A の CSS は `.css` ファイル、
  `rd.components` 層、セレクタは `rd-<name> > <native>` 形。
- `library/elements/package.json`：`exports` に `./<name>/style.css` と `./styles.css`、`sideEffects` に `*.css`。
- `tools/cem`：`@pe` を CEM に載せる。`registry.json` に `pe`。
- `scripts/guard.sh`：（a）`@pe A` の部品に `static styles` / `shadowRoot` が無い、（b）`@pe C` に `.css` が無い、
  （c）`<form>` 参加要素を包む部品（`contract` に `input|select|textarea|button` がある）は `@pe A`。
- plan 003：`.rd-skip-link` を `utilities.css` に追加。plan 004：`rd-skip-link` を外し、`rd-button` /
  `rd-text-field` をティア A、`rd-dialog` をティア B、`rd-live-region` をティア C として書き直す。
  plan 005：ティア A の story は `markup()` から描く。plan 006：契約の木からラッパーを生成。
- 出典（2026-09-07 参照）：react.dev「Custom HTML elements」「'use client'」、lit.dev「React」「SSR overview /
  client usage」、web.dev「Declarative Shadow DOM」、adactio.com「HTML web components」。
