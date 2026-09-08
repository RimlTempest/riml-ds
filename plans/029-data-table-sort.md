# 029: `rd-data-table` — 見出しを押すと並べ替えられる表（`<table class="rd-table">` を包むティア A）

**優先度**: P1　**規模**: M　**依存**: 022（`.rd-table` の atoms。マージ済み）
**レーン**: `feat/table-sort`　**計画時の main**: `fa1835c`（025・026 マージ後。**028（`feat/command`）・030（`feat/splitter`）と並行** — `system/**` / `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/data-table && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c '\.rd-table :where(th)' system/css/src/atoms.css` = 1、`grep -c '\[data-numeric\]' system/css/src/atoms.css` ≥ 1（表の atoms がある）。
> `wc -l library/elements/src/combobox/combobox.element.ts` が **146**（light DOM ティア A の手本の形が変わっていない）。
> `grep -c 'export const usesJapaneseCopy' library/elements/src/_shared/lang.ts` = 1。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Data Table** に当たるものが `.rd-table`（見た目だけの atoms）しか無く、**並べ替え**ができない。qrcc の「保存したコードの一覧」、noter の「ノート一覧」は
どちらも列見出しで並べ替えたい。ページ送り（`.rd-pagination`）、行の選択（`rd-checkbox`）、絞り込み（`rd-text-field`）は既にある部品を**外側で組み合わせる**。
この部品が持つのは**並べ替えだけ**——それが APG「Sortable Table」で、`aria-sort` と見出しの中のボタンで足りる。

**JS が無いときは書かれた順の表がそのまま読める**（ティア A、ADR-0012）。見出しは文字のまま（押せないボタンを置かない）。定義されると見出しの中身を
`<button type="button" part="sort">` で包み、押すと `<tbody>` の行を並べ替える。

決めていること:

- **包むのは `<table class="rd-table">`**（`<caption>` と `<thead><tr><th scope="col">` が必須。`<tbody>` 1 つ）。**並べ替えられる列は `th[data-sort]`** で利用側が印を付ける。
  値は `text`（既定。空文字も `text`）/ `number` / `date`
- **セルの比較キーは `td[data-value]` があればそれ、無ければ `textContent.trim()`**（「1,234 GB」の列は `data-value="1234"` を書く。日付は `data-value="2026-09-08"`）
- 比較: `text` は `Intl.Collator(lang, { numeric: true, sensitivity: 'base' })`（`lang` は最も近い `[lang]`。無ければ `undefined` でブラウザ既定）。
  `number` は `Number.parseFloat`（NaN は**末尾**）。`date` は `Date.parse`（NaN は末尾）。**安定**（同値は元の順）
- **向きの巡り**: 未ソート → `ascending` → `descending` → `ascending` …（「無し」に戻さない。APG の例と同じ）
- **`aria-sort` は並べ替え中の 1 列だけ**に付き、他の列からは外す。矢印は CSS の `::after` で描く（DOM を増やさない）
- **`column`（0 始まりの列番号。既定 −1 = 無し）と `direction`（`ascending` / `descending`）を属性で持ち、反映する**。初期値が書いてあれば定義時に並べ替える。
  JS から書き換えても並べ替わる（`rd-sort` は**出さない**——利用側が起こした変化）
- **`manual` 属性**: 行を動かさず `aria-sort` と `rd-sort` だけ（サーバー側で並べ替える利用側。`rd-combobox` の `filter="none"` と同じ思想）
- **イベント `rd-sort`**（`detail: { column: number; key: string | undefined; direction: 'ascending' | 'descending' }`。`key` は `th[data-key]`）。ボタンが押されたときだけ
- **読み上げは `aria-sort` に任せる**（`rd-live-region` を使わない。ADR-0008 §6）
- 状態（`:state()`）: `sorted`（`column ≥ 0`）/ `malformed`（契約違反: `table` / `thead` / `tbody` / `caption` のどれかが無い）
- 横に溢れる表は **`rd-data-table` 自身が転がす**（`display: block; overflow-x: auto`。`.rd-table-scroll` を二重に要らない。WCAG 1.4.10）

守る不変条件:

- **AAA**。矢印（非文字）は 3:1 — 未ソートは `--rd-color-text-muted`（`::after { content: '↕' }`）、ソート中は `--rd-color-accent-default`。**色だけに頼らない**（矢印の向きと `aria-sort`）
- **`outline: none` / `0` を書かない**。**グラデーションを描かない**
- `*.element.ts` ≤ 150 行、`if` ≤ 5 → DOM の読み書きは `data-table.dom.ts`
- `.size-limit.json` に `data-table/define` **12 KB**
- `_shared/**` / `system/**` を変えない。`.rd-table` の atoms を**変えない**（この部品の CSS は `rd-data-table > table` に限定して足す）
- ボタンで包んでも `th` の**アクセシブル名は変わらない**（ボタンの文字 = 見出しの文字）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/combobox/**`**（light DOM ティア A。`createRenderRoot` → `this`、`willUpdate` の初回配線、`*.dom.ts`、`MutationObserver`）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ
- **失敗するテストを先に書く**
- ラッパー（React / Vue / Svelte / Astro）の props は**文字列**で生成される（`rd-slider` の `min?: string` と同じ）。`column="1"` と書く。数値型にする改修はこの計画の外（STOP せず、proposal に 1 行書く）
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。**ラッパーの props は契約の `tree.attrs` から作られる**——`column` / `direction` / `manual` を `attrs` に入れる
- `bun run scaffold:element data-table --pe A` で骨格を作る
- `library/elements/package.json` の `exports` に `./experimental/data-table{,/contract,/define,/style.css}` を **`./experimental/combobox/style.css` の直後**に
- story は 8 種（Default / Variants（number・date 列）/ Disabled → **Manual** に読み替える / Invalid → **Sorted**（初期 `column="1"`）に読み替える / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Clicked`（`play` で 2 列目の見出しを押す）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/table-sort`）: `library/elements/src/data-table/**`（新規）、`library/elements/src/experimental/data-table/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/data-table.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/` の data-table 以外、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 028 / 030** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `tier-b.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。
  生成物のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`system/css/src/atoms.css`（`.rd-table`。**変えない**。この部品はこの上に乗る）:

```css
  .rd-table :where(th) {
    padding: var(--rd-space-2) var(--rd-space-3);
    border-block-end: 0.125rem dotted var(--rd-color-border-default);
    font-weight: var(--rd-font-weight-bold);
    text-align: start;
  }
  /* 数の列は桁を揃えて行末に寄せる（比べるのは末尾から） */
  .rd-table :where(th, td)[data-numeric] {
    font-variant-numeric: tabular-nums;
    text-align: end;
  }
  .rd-table[data-sticky] :where(thead th) { position: sticky; inset-block-start: 0; background: var(--rd-color-surface-raised); }
```

`library/elements/src/_shared/lang.ts`: `usesJapaneseCopy(host)`（`[lang]` を `closest` で見る）。Collator の `lang` は同じやり方で `host.closest('[lang]')?.getAttribute('lang') ?? undefined` を渡す（`data-table.dom.ts` に小さな関数を書く。`_shared` は変えない）。

`library/elements/src/combobox/combobox.element.ts` の骨格（手本）: `static override properties` + `declare` + constructor 既定値、`createRenderRoot` → `this`、`willUpdate` 初回で `dom.wire` と listener と observer、`updated` で `dom.applyUpdate`、`disconnectedCallback` で外す。

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`data-table.contract.ts`）

```ts
export const SORTABLE_SELECTOR = ':scope > table > thead > tr > th[data-sort]'

export const contract = {
  pe: 'A',
  roles: {
    table: ':scope > table',
    caption: ':scope > table > caption',
    head: ':scope > table > thead',
    body: ':scope > table > tbody',
  },
  required: ['table', 'caption', 'head', 'body'],
  tree: {
    tag: 'rd-data-table',
    attrs: { column: '$column', direction: '$direction', manual: '$manual' },
    children: [
      {
        tag: 'table',
        attrs: { class: 'rd-table' },
        children: [
          { tag: 'caption', children: [{ prop: 'caption' }] },
          // 見出し行と本体は生 HTML。利用側が dataTableHeadMarkup() / dataTableRowMarkup() で組み立てる
          { raw: '$head' },
          { raw: '$body' },
        ],
      },
    ],
  },
} as const satisfies Contract
```

- `DataTableMarkupProps = { caption; head: string; body: string; column?: number; direction?: SortDirection; manual?: boolean }`、`SortDirection = 'ascending' | 'descending'`、`SortType = 'text' | 'number' | 'date'`
- `dataTableHeadMarkup(columns: readonly { label; sort?: SortType; key?; numeric? }[])` → `<thead><tr><th scope="col" data-sort="number" data-key="size" data-numeric>サイズ</th>…</tr></thead>`
- `dataTableRowMarkup(cells: readonly { text; value?; numeric? }[])` → `<tr><td data-value="1234" data-numeric>1,234</td>…</tr>`（`<tbody>` は利用側が `body` にまとめる。`dataTableBodyMarkup(rows)` も用意する）

### 2. 純関数（`data-table.logic.ts`）

```ts
export const parseSortType = (raw: string | null): SortType           // 知らない値・空 → 'text'
export const parseDirection = (raw: string | null): SortDirection      // 'descending' 以外 → 'ascending'
export const nextDirection = (column: number, current: number, direction: SortDirection): SortDirection
  // 別の列なら 'ascending'、同じ列なら反転
export type Row = { readonly key: string; readonly index: number }
export const sortOrder = (rows: readonly Row[], type: SortType, direction: SortDirection, collator: Intl.Collator): readonly number[]
  // 返り値は元の index の並び。NaN（number / date で読めない）は向きに関わらず末尾。同値は index 順
export const columnStates = (count: number, column: number, direction: SortDirection): readonly (SortDirection | undefined)[]
  // 各 th の aria-sort（1 列だけ値が入る）
```

`Intl.Collator` は DOM ではないので logic に渡してよい（テストでは `new Intl.Collator('ja', { numeric: true, sensitivity: 'base' })` を作る）。

### 3. DOM 層（`data-table.dom.ts`）

- `wire(host)`: `checkContract` → ok なら `SORTABLE_SELECTOR` の各 `th` の子ノードを `<button type="button" part="sort">` に移す（**`th.append(button)`、`button.append(...th.childNodes)` の順**。既に `[part="sort"]` があれば何もしない = 再接続で二重に包まない）。missing なら `NO_WIRING`
- `readRows(body, column)`: `tbody > tr` の各行の `column` 番目の `td` から `{ key: td.dataset.value ?? td.textContent.trim(), index }` を読む（`td` が無い行は `key: ''`）
- `applyOrder(body, order)`: `order` の順に `tr` を `body.append(...)`（DOM の移動。フォーカスは動かない）
- `applySortAttrs(ths, states)`: `aria-sort` を付け外し
- `collatorFor(host)`: `new Intl.Collator(lang, { numeric: true, sensitivity: 'base' })`
- `columnOf(button)`: `th.cellIndex`
- listener は `thead` への `click` 1 つ（`event.target.closest('[part="sort"]')` で判定）
- `MutationObserver` は `tbody` の `childList` だけ（行の増減で再ソート。`manual` なら見ない）

### 4. element（`data-table.element.ts` ≤ 150 行）

- properties: `column: { type: Number, reflect: true }`（既定 −1）、`direction: { reflect: true }`（既定 `'ascending'`）、`manual: { type: Boolean, reflect: true }`
- `willUpdate` 初回: `wire` + `click` listener + observer。`updated`: `column ≥ 0 && !manual` なら `readRows` → `sortOrder` → `applyOrder`。常に `applySortAttrs` と `syncStates`
- `#onClick`: `column` / `direction` を `nextDirection` で更新し **`rd-sort` を発火**（`updated` が並べ替える）
- `render()` は `nothing`（表は light DOM のまま。`renderRoot` は `this`）
- JSDoc: `@summary` / `@status experimental` / `@pe A` / `@event rd-sort` / `@state sorted|malformed` / `@csspart sort` / `@attr column|direction|manual`

### 5. CSS（`data-table.css`。`@layer rd.components`）

- `rd-data-table { display: block; overflow-x: auto }`
- `rd-data-table > table > thead th > [part='sort']`: `display: inline-flex; align-items: center; gap: var(--rd-space-1); min-block-size: var(--rd-sizing-target-min); margin: calc(var(--rd-space-2) * -1) 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: inherit; cursor: pointer`
  （`th` の padding の中で 44px を確保するため上下の margin を打ち消す）
- `[part='sort']::after { content: '↕'; color: var(--rd-color-text-muted) }`、`th[aria-sort='ascending'] > [part='sort']::after { content: '↑'; color: var(--rd-color-accent-default) }`、`descending` は `'↓'`
- `[part='sort']:hover, [part='sort']:focus-visible { color: var(--rd-color-accent-default) }`（`outline` は書かない）
- `th[data-numeric] > [part='sort'] { flex-direction: row-reverse }`（矢印を行頭側に。数字の末尾揃えを崩さない）
- `@media (forced-colors: active)`: `::after` を `color: ButtonText`、`[aria-sort]` を `text-decoration: underline`
- **`.rd-table` の規則を書き換えない**。`content` に文字を書くのを stylelint が落としたら STOP（規則を緩めない）

### 6. 露出・検証面・VRT・proposal

- `experimental/data-table/index.ts`、exports、`.size-limit.json`（12 KB）、`tools/mcp/src/examples.ts`（3 列 × 4 行。`number` 列と `date` 列を含む）、`tools/mcp/test`、`library/react/test`
- e2e: `build-pages.ts` に `data-table.html`（3 列 × 4 行。`caption` 必須）、`tier-a.spec.ts` に JS 無し 2 本（表がそのまま読める・見出しに `button` が**無い**）、`axe.spec.ts` 1 本、
  `e2e/a11y/keyboard.spec.ts` に JS あり 3 本（見出しを押すと `aria-sort="ascending"` と行順／もう一度で `descending`／Tab で見出しボタンに届き Enter で並ぶ）、`e2e/frameworks/shared.ts` に `dataTableSuite` + 4 spec・app
- VRT 新規画像のみ
- `docs/proposals/data-table.md`（「なぜ並べ替えだけか」「なぜ見出しをボタンで包むのが定義後か」「`manual` の意図」）、`.changeset/data-table.md`（elements minor）

## 手順（red → green。各 Step の終わりにコミット）

- **Step 0** 準備（`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check）
- **Step 1** `feat(elements): add the rd-data-table contract and sort logic`（scaffold → 契約テスト・logic テスト red → green）
- **Step 2** `feat(elements): add rd-data-table (experimental, tier A)`（dom / element / css / stories / tests。exports・size-limit・examples・react test も）
- **Step 3** `test(e2e): cover rd-data-table with and without JS and in the four frameworks`
- **Step 4** `test(vrt): baselines for data-table`
- **Step 5** `docs(proposals): record the rd-data-table decision and add a changeset`

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0、`wc -l …/data-table.element.ts` ≤ 150、`grep -c '\bif\b' …/data-table.element.ts` ≤ 5
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に既存画像が無い。`git diff --name-only main...HEAD -- system/` が空
- React の props に `column` / `direction` / `manual` がある。`.size-limit.json` の `data-table/define` が通る

## STOP する条件

- 既存 VRT 画像が変わる。size-limit 超過。element が 150 行 / `if` 5 に収まらない。stylelint が `content: '↑'` を落とす
- markuplint が見出しの中の `<button>` を落とす（`th > button` は許される内容だが、落ちたら報告）
- `.rd-table` の atoms を変えないと見た目が成立しない
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする

## スコープ外

- 複数列ソート、ページ送り、行選択、列の表示切替、仮想スクロール、絞り込み（既存部品を外で組み合わせる）。`.rd-table` の変更

## 保守メモ

- 行を DOM で動かすので、利用側がフレームワークで `<tr>` を再描画すると順が戻る → `manual` を使ってデータ側で並べ替えるのが正しい（proposal に書く）
- `wire` は再接続で二重に包まないよう `[part="sort"]` の有無で判定している。`disconnectedCallback` で包みを**戻さない**（戻すとフォーカスが飛ぶ）
