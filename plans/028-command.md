# 028: `rd-command` — 打って絞って選ぶコマンドパレット（light DOM の `<input type="search">` + リンク／ボタンの一覧を包むティア A）

**優先度**: P1　**規模**: M　**依存**: 025（マージ済み `fa1835c` 以前。`filterCandidates` / `normalize` の出どころ）
**レーン**: `feat/command`　**計画時の main**: `fa1835c`（025・026 マージ後。**029（`feat/table-sort`）・030（`feat/splitter`）と並行** — `system/**` / `_shared/**` の**新規ファイル以外**には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/command && echo EXISTS` が何も出ないこと。出たら STOP。
> `test -f library/elements/src/_shared/text-filter.ts && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'export const filterCandidates' library/elements/src/combobox/combobox.logic.ts` = 1、`grep -c 'export const normalize' library/elements/src/combobox/combobox.logic.ts` = 1。
> `wc -l library/elements/src/combobox/combobox.element.ts` が **146**、`library/elements/src/combobox/combobox.dom.ts` が **277**（手本の形が変わっていない）。
> `grep -c 'export const nextIndex' library/elements/src/_shared/roving-focus.ts` = 1、`grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Command**（cmdk）に当たる部品が無い。「⌘K で窓を開き、打って絞って Enter で飛ぶ」入り口は noter（ノートの検索・操作）と
qrcc（保存したコードの検索）の両方が要る。`rd-combobox`（025）は**値を入力欄に確定する**部品で、リンクへ飛ぶ／操作を実行する用途には合わない。

`rd-command` は**リンクとボタンの一覧を絞り込む**部品。**JS が無くても一覧はそのまま辿れる**（ティア A、ADR-0012）——
入力欄は飾りになるが、全項目が見えていて押せる。JS があれば打った文字で項目を隠し、↓ で項目へ移り、Enter で 1 件目を押す。

決めていること:

- **包むのは `<label for>` + `<input type="search" autocomplete="off">` + 1 つ以上の `<ul>`**。項目は `<ul> > <li> > :is(a[href], button)`。
  部品は項目を生成しない（利用側が書く。`rd-menu` と同じ）。**グループ**は `<ul>` を分けるだけ（`aria-label="ページ"` を付けると読み上げで区切りが分かる。任意）
- **`aria-activedescendant` は使わない。項目は本物のリンク／ボタンのまま、フォーカスを移す**（roving）。項目の役割を `option` に書き換えない
  （リンクの「Enter で飛ぶ」「⌘クリックで新しいタブ」をネイティブに残す。cmdk と違う所で、意図的）。入力欄には `role` を載せない
  （`type="search"` のまま。`aria-controls` で一覧を指す。`aria-expanded` も載せない——常に見えている）
- **絞り込みは `filter` 属性**: `contains`（既定）/ `prefix` / `none`（利用側が絞る。サーバー側検索）。比較は **025 の `normalize` / `filterCandidates` を使う**
  ——これを **`_shared/text-filter.ts` に移し、`combobox.logic.ts` はそこから再エクスポートする**（025 の保守メモ「2 つ目の利用者が出たら移す」）。
  項目の検索文字列は `textContent` + `data-keywords` 属性（空白区切りの別名。「設定 preferences config」）
- **隠すのは `<li hidden>`**。`<ul>` の `<li>` が全部隠れたらその `<ul>` も `hidden`（`aria-label` の見出しだけ残さない）。0 件なら **`[part="empty"]`**
  （`<p part="empty" role="status">`。文言は `empty-text` 属性。既定は `_shared/lang.ts` の `usesJapaneseCopy` で「見つかりません」/ "No results"）を見せる
- **件数は読み上げない**（`rd-live-region` を使わない。ADR-0008 §6。025 と同じ判断。0 件だけ `role="status"` が伝える）
- **キーボード**（APG「Listbox」ではなく、素直な移動）:
  - 入力欄で ↓ → **見えている**最初の項目へフォーカス。↑ → 最後の項目へ。Enter → 見えている 1 件目を `click()`（無ければ何もしない）。Esc → 入力欄が空でなければ**空にする**（`input` を発火）。空なら何もしない（外側の `rd-dialog` が閉じる）
  - 項目で ↓ / ↑ → 見えている項目の中を移動（`nextIndex(current, count, key, 'vertical')`。端で折り返す）。Home / End → 先頭 / 末尾。
    **印字できるキー（`key.length === 1` で修飾無し）** → 入力欄にフォーカスを戻し、その 1 文字を末尾に足して `input` を発火（打ち続けられる）。
    Backspace → 入力欄に戻して末尾 1 文字を消す。Enter / Space はネイティブ（横取りしない）
  - Tab は横取りしない
- **`rd-select` イベント**（`detail: { value: string; label: string }`）: 項目が押されたとき（`click` を親で拾う）。`value` は
  `data-value` → `value` 属性 → `href` → `textContent` の順で最初にあるもの、`label` は `textContent.trim()`。**押した項目の既定動作は妨げない**
  （リンクは飛ぶ。ボタンは利用側の `click` が動く）
- **ショートカット（⌘K）は部品に持たせない**。利用側が `keydown` を拾って `rd-dialog` を開く（story `InDialog` で示す）
- 状態（`:state()`）: `filtering`（入力欄が空でない）/ `empty`（0 件）/ `malformed`（契約違反）
- **`rd-dialog` の中で使えること**を story と e2e で確かめる（`rd-dialog` の `delegatesFocus` が入力欄にフォーカスを置く）

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ。フォーカス中の項目は `--rd-color-surface-hover` + 左の縦罫（`border-inline-start`。`combobox.css` の `[aria-selected="true"]` と同じ見せ方。**`box-shadow: inset` は stylelint が落とす**）
- **`outline: none` / `0` を書かない**。**グラデーションを描かない**
- `*.element.ts` ≤ 150 行、`if` ≤ 5 → **DOM の読み書きは `command.dom.ts`**（`combobox.dom.ts` と同じ置き方）
- `.size-limit.json` に `command/define` **12 KB**（超えたら STOP）
- `_shared/**` は **`text-filter.ts` の新設だけ**。既存ファイルを変えない
- `combobox.logic.ts` は **再エクスポートに置き換えるだけ**（`export { filterCandidates, normalize } from '../_shared/text-filter.js'` と `Candidate` 型）。挙動を変えない。`combobox.logic.test.ts` は**そのまま通る**こと

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/combobox/**`**（light DOM のティア A。`createRenderRoot` が `this`、`willUpdate` で契約検査と `bindListeners`、`*.dom.ts` の分け方、`combobox.css` の候補行）と
  **`library/elements/src/menu/**`**（`nextIndex` でのフォーカス移動、項目の `ITEM_SELECTOR`）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- **ラッパーの props は契約の `tree.attrs` から作られる**（`static properties` ではない）。`filter` / `empty-text` は `attrs` に入れる
- `bun run scaffold:element command --pe A` で骨格を作る（`command.contract.test.ts` も生成される。雛形の期待値は自分の契約に合わせて直す）
- `library/elements/package.json` の `exports` に `./experimental/command{,/contract,/define,/style.css}` の 4 ブロックを **`./experimental/combobox/style.css` の直後**に
- story は 8 種（Default / Variants / Disabled / Invalid → **Grouped / Empty** に読み替える / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Filtered`（`play` で「せ」と打つ）+ `InDialog`（`rd-dialog` の中。`play` でボタンを押して開く）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/command`）: `library/elements/src/command/**`（新規）、`library/elements/src/experimental/command/**`（新規）、
  `library/elements/src/_shared/text-filter.ts`（新規）と `text-filter.test.ts`（新規）、`library/elements/src/combobox/combobox.logic.ts`（再エクスポートのみ）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/command.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/` の既存ファイル、`library/elements/src/` の command / combobox.logic.ts 以外、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 029 / 030** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `tier-b.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。
  生成物（`custom-elements.json` / `registry.json` / generated）のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/combobox/combobox.logic.ts`（移す対象。26 行目と 44–53 行目）:

```ts
export const normalize = (text: string): string => text.normalize('NFKC').toLocaleLowerCase().trim()
…
export const filterCandidates = (
  all: readonly Candidate[],
  query: string,
  mode: FilterMode,
): readonly Candidate[] => {
  const needle = normalize(query)
  return mode === 'none' || needle === ''
    ? all
    : all.filter((candidate) => hit(candidate, needle, mode))
}
```

`Candidate` は `{ readonly value: string; readonly label: string }`、`FilterMode` は契約の `ComboboxFilter`（`'contains' | 'prefix' | 'none'`）。
`hit` は `label` と `value` を `normalize` して `prefix` なら `startsWith`、それ以外は `includes`。

`library/elements/src/_shared/roving-focus.ts`:

```ts
export const nextIndex = (
  current: number,
  count: number,
  key: string,
  orientation: Orientation,
): number | undefined
```

`Home` → 0、`End` → count − 1、向きの矢印で ±1（端で折り返す）、それ以外は `undefined`（呼び側は `preventDefault()` しない）。

`library/elements/src/_shared/lang.ts`: `usesJapaneseCopy(host)` — 最も近い `[lang]` が無い / `ja-*` なら true。

`library/elements/src/combobox/combobox.element.ts` の骨格（手本。この形をなぞる）:

- `static override properties: PropertyDeclarations = { hint: {}, error: {}, filter: {} }` + `declare` + constructor で既定値
- `protected override createRenderRoot(): HTMLElement { return this }`（light DOM）
- `willUpdate` の初回で `dom.wire(this, name)` → 契約検査、`bindListeners(control, listeners)`、`MutationObserver`
- `updated` で `dom.applyUpdate(...)`、`render` で `dom.renderField(...)`（末尾に `<p part="hint">` などを描く）
- `disconnectedCallback` で listener と observer を外す

## 設計（決めてある。変えるなら STOP）

### 1. `_shared/text-filter.ts`（新規。`combobox.logic.ts` から移す）

```ts
export type Candidate = { readonly value: string; readonly label: string }
export type FilterMode = 'contains' | 'prefix' | 'none'
export const normalize: (text: string) => string
export const parseFilterMode: (raw: string | null | undefined) => FilterMode   // combobox の parseFilter と同じ中身
export const filterCandidates: (all: readonly Candidate[], query: string, mode: FilterMode) => readonly Candidate[]
```

`combobox.logic.ts` は `export { filterCandidates, normalize, type Candidate } from '../_shared/text-filter.js'` に置き換え、`parseFilter` は
`parseFilterMode` を呼ぶ 1 行にする（`ComboboxFilter` 型は契約に残す。`FilterMode = ComboboxFilter` もそのまま）。
`text-filter.test.ts` は `combobox.logic.test.ts` の `normalize` / `filterCandidates` のテストを**写して**置く（combobox 側のテストは消さない——再エクスポート経由で二重に守る）。

### 2. 契約（`command.contract.ts`）

```ts
export const ITEM_SELECTOR = ':scope > ul > li > :is(a[href], button)'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="search"]',
    list: ':scope > ul',
  },
  required: ['label', 'control', 'list'],
  tree: {
    tag: 'rd-command',
    attrs: { filter: '$filter', 'empty-text': '$emptyText' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      { tag: 'input', attrs: { id: '$id', type: 'search', autocomplete: 'off', placeholder: '$placeholder' } },
      // 項目は生 HTML。利用側が commandGroupMarkup() / commandItemMarkup() で組み立てる
      { raw: '$groups' },
    ],
  },
} as const satisfies Contract
```

- `CommandMarkupProps = { id; label; groups: string; placeholder?; filter?: CommandFilter; emptyText? }`、`CommandFilter = 'contains' | 'prefix' | 'none'`
- `commandGroupMarkup({ label?, items })` → `<ul aria-label="…">items</ul>`（`label` 無しなら `aria-label` を出さない）
- `commandItemMarkup({ label, href?, value?, keywords?, shortcut? })` → `<li><a href="…" data-value data-keywords>label <kbd class="rd-kbd">⌘N</kbd></a></li>`
  （`href` 無しなら `<button type="button" value="…">`。`shortcut` 無しなら `<kbd>` を出さない。全部 `escapeHtml`）
- 契約テスト: `markup()` の出力と `checkContract` の ok / missing（`select/select.contract.test.ts` の形）

### 3. 純関数（`command.logic.ts`。DOM を触らない）

```ts
export type Item = { readonly text: string; readonly keywords: string }   // 検索文字列の材料
export const matches = (item: Item, query: string, mode: FilterMode): boolean
  // filterCandidates([{ value: item.keywords, label: item.text }], query, mode).length === 1
export const visibleIndexes = (items: readonly Item[], query: string, mode: FilterMode): readonly number[]
export const groupHidden = (visible: readonly number[], groupItemIndexes: readonly number[]): boolean
export type CommandKeyAction =
  | { kind: 'focus-item'; index: number }        // 入力欄で ↓ / ↑、項目で ↓ ↑ Home End
  | { kind: 'activate-first' }                   // 入力欄で Enter
  | { kind: 'clear' }                            // 入力欄で Esc（値があるとき）
  | { kind: 'type'; char: string }               // 項目で印字キー
  | { kind: 'backspace' }                        // 項目で Backspace
  | { kind: 'none' }
export const decideKey = (input: { key: string; modified: boolean; onInput: boolean; current: number; count: number; hasQuery: boolean }): CommandKeyAction
export const itemValue = (attrs: { dataValue: string | null; value: string | null; href: string | null; text: string }): string
export const emptyCopy = (japanese: boolean, override: string | undefined): string  // override ?? (japanese ? '見つかりません' : 'No results')
```

`decideKey` はテーブル駆動で `if` を増やさない（`combobox.logic.ts` の `decideKey` を手本に）。`modified` は `ctrlKey || metaKey || altKey`。

### 4. DOM 層（`command.dom.ts`）

- `wire(host, name)`: `checkContract` → ok なら `control.setAttribute('aria-controls', listIds)`（各 `<ul>` に `id` が無ければ `${name}-list-${i}` を振る）、`labelId`。missing なら `NO_WIRING`
- `readItems(host)`: `ITEM_SELECTOR` の `querySelectorAll` → `{ element, li, ul, text: textContent.trim(), keywords: dataset.keywords ?? '' }[]`
- `applyFilter(items, query, mode)`: `li.hidden` / `ul.hidden` を書く。返り値 `{ visible: HTMLElement[]; count: number }`
- `observeItems(host, onChange)`: `MutationObserver({ childList: true, subtree: true, characterData: true })`（項目の増減に追随。`hidden` の書き換えは `attributes` を見ないので無限ループしない）
- `focusVisible(visible, index)`、`typeInto(control, char | undefined)`（`setControlValue` + `input` 発火 + `focus()`）
- `renderEmpty(copy, show)`: `<p part="empty" role="status" ?hidden=${!show}>${copy}</p>`（**常に描いて `hidden` で切る**。`role="status"` の領域は最初から DOM にあるべき）
- `commitItem(host, element)`: `rd-select` を `bubbles: true, composed: true` で発火（`preventDefault` しない）

### 5. element（`command.element.ts` ≤ 150 行）

- properties: `filter`（既定 `'contains'`）、`emptyText`（attribute `empty-text`）
- light DOM（`createRenderRoot` → `this`）。`willUpdate` 初回で `wire` + `bindListeners(control, { input, keydown })` + host への `keydown`（項目分。`event.target` が `ITEM_SELECTOR` に一致するときだけ）と `click`（`commitItem`）+ observer
- `#query` を state に持ち、`updated` で `applyFilter` → `syncStates(internals, {filtering, empty, malformed})` → `renderEmpty`
- `render()` は `renderEmpty` の結果だけ（項目は light DOM のまま）
- `disconnectedCallback` で全部外す
- JSDoc: `@summary` / `@status experimental` / `@pe A` / `@event rd-select` / `@state filtering|empty|malformed` / `@csspart empty` / `@attr filter` / `@attr empty-text`

### 6. CSS（`command.css`。`@layer rd.components`）

- `rd-command { display: block }`。`rd-command > label` は `combobox.css` のラベルと同じ（太字・`--rd-space-1`）
- `rd-command > input` は `combobox.css` の `input` と同じ枡（`min-block-size: var(--rd-sizing-target-min)`、`border-radius: var(--rd-radius-md)`、`background: var(--rd-color-surface-raised)`）
- `rd-command > ul { list-style: none; margin: 0; padding-block: var(--rd-space-1); padding-inline: 0 }`、`rd-command > ul[aria-label]::before { content: attr(aria-label); display: block; padding: var(--rd-space-1) var(--rd-space-3); color: var(--rd-color-text-muted); font: var(--rd-type-small) }`（見出しは `aria-label` から描く——DOM に二重の文字を置かない）
- `rd-command > ul > li > :is(a, button)`: `display: flex; align-items: center; justify-content: space-between; gap: var(--rd-space-2); inline-size: 100%; min-block-size: var(--rd-sizing-target-min); padding: var(--rd-space-2) var(--rd-space-3); border-inline-start: calc(var(--rd-border-width-default) * 2) solid transparent; border-radius: var(--rd-radius-md); background: none; color: var(--rd-color-text-default); font: inherit; text-align: start; text-decoration: none; cursor: pointer`
- `:hover` / `:focus-visible` → `background: var(--rd-color-surface-hover); border-inline-start-color: var(--rd-color-accent-default)`（**`outline` は書かない**。`base.css` のフォーカス環に任せる）
- `rd-command > [part="empty"] { padding: var(--rd-space-3); color: var(--rd-color-text-muted); font: var(--rd-type-small); text-align: center }`
- `rd-command:not(:defined) > [part="empty"]` は存在しない（JS が無ければ描かれない）ので何も要らない。`rd-command:not(:defined) > input` は同じ枡で見える
- `@media (forced-colors: active)`: 項目の `:focus-visible` を `border-inline-start-color: Highlight`、`[aria-label]::before` を `color: GrayText`
- `kbd.rd-kbd` は `system/css` の atoms が当てる（部品側は `margin-inline-start: auto` だけ）

### 7. 露出

- `src/experimental/command/index.ts`（`combobox` のものを写す）、`package.json` exports 4 ブロック、`.size-limit.json`（12 KB）
- `tools/mcp/src/examples.ts` に `rd-command` の例（`commandGroupMarkup` 2 グループ、リンク 2 + ボタン 1）、`tools/mcp/test/core/elements.test.ts` の件数、`library/react/test/markup.test.tsx` に 1 ケース
- e2e: `e2e/pe/build-pages.ts` に `command.html`（`<rd-command>` + 2 グループ 5 項目。`<a href="/echo.html?item=home">` を 1 つ含める）、`tier-a.spec.ts` に **JS 無し** 2 本（リンクが辿れる／入力欄と一覧がどちらも見える）、`axe.spec.ts` に 1 本、
  `e2e/a11y/keyboard.spec.ts` に **JS あり** 3 本（打つと隠れる・0 件で status が出る／入力欄で ↓ → 1 件目にフォーカス、印字キーで入力欄に戻る／Enter で 1 件目が押される）、
  `e2e/frameworks/shared.ts` に `commandSuite` + 4 フレームワークの spec・app（`comboboxSuite` の形）
- VRT: 新規画像のみ。既存画像が 1 枚でも変わったら STOP

### 8. proposal と changeset

- `docs/proposals/command.md`（`docs/proposals/combobox.md` の形。「なぜ `aria-activedescendant` ではなく roving か」「なぜ件数を読み上げないか」「⌘K は利用側」を書く）
- `.changeset/command.md`: `@rimltempest/riml-ds-elements` minor（`rd-command` 追加。`combobox.logic` の再エクスポートは挙動不変なので触れなくてよい）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`（全部通ることを確認）。Drift check を通す。

### Step 1 — `_shared/text-filter.ts`（`refactor(elements): move the text filter shared by combobox and command to _shared`）

`text-filter.test.ts`（写し）→ red → 実装 → `combobox.logic.ts` を再エクスポートに → `bun run test`（combobox のテストが**そのまま**通る）。`wc -l combobox.logic.ts` が減っていること。

### Step 2 — 契約と純関数（`feat(elements): add the rd-command contract and filtering logic`）

`bun run scaffold:element command --pe A` → 契約と `command.logic.ts` のテストを先に書く → green。

### Step 3 — element と CSS（`feat(elements): add rd-command (experimental, tier A)`）

`command.dom.ts` / `command.element.ts` / `command.css` / stories / `command.test.ts` / `command.sr.test.ts`。`bun run build && bun run gen`。
`wc -l command.element.ts` ≤ 150。exports・size-limit・examples・react test もこの Step で。

### Step 4 — 検証面（`test(e2e): cover rd-command with and without JS and in the four frameworks`）

### Step 5 — VRT（`test(vrt): baselines for command`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（新規画像だけ増えること。`git status` で既存画像の変更が無いこと）。

### Step 6 — 仕上げ（`docs(proposals): record the rd-command decision and add a changeset`）

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`text-filter.test.ts` / `command.*.test.ts` を含む）
- `wc -l library/elements/src/command/command.element.ts` ≤ 150、`grep -c '\bif\b' …/command.element.ts` ≤ 5
- `grep -c 'export const filterCandidates' library/elements/src/_shared/text-filter.ts` = 1、`grep -c "from '../_shared/text-filter.js'" library/elements/src/combobox/combobox.logic.ts` = 1
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に **既存**画像が 1 枚も無い
- `grep -c 'rd-command' library/react/src/generated/index.ts` ≥ 1（ラッパーが出ている）、React の props に `filter` / `emptyText` がある
- `.size-limit.json` の `command/define` が通る（12 KB）

## STOP する条件（改善せず報告する）

- 既存 VRT 画像が変わる。size-limit 超過。`command.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `combobox.logic.test.ts` を変えないと通らない（再エクスポートで挙動が変わっている）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- markuplint が `<ul aria-label>` や `<p role="status">` を落とす（規則を緩めない。報告する）
- `_shared/` の既存ファイルを変えないと実装できない

## スコープ外

- ⌘K のグローバルショートカット（利用側）。非同期ロード（`aria-busy`）。項目の入れ子・サブコマンド。最近使った項目の記憶。`rd-dialog` 側の変更

## 保守メモ

- `text-filter.ts` は combobox / command の 2 部品が使う。比較規則（NFKC + `toLocaleLowerCase`）を変えると両方の絞り込みが変わる
- 項目の `hidden` は MutationObserver の `attributes` を見ないことで無限ループを避けている。observer の options を変えるときはここを思い出す
- 将来 `aria-activedescendant` 方式に変えたくなったら proposal を先に書く（リンクの既定動作を失う判断なので）
