# 038: `rd-tree` — 木の一覧（`<ul>` の入れ子と `<details>` を包むティア A。`role="tree"` と矢印キーの移動）

**優先度**: P1　**規模**: L　**依存**: 003（`rd-disclosure`。`<details>` で JS 無しでも開閉する形）、013（`rd-menu` の roving tabindex）、031（`rd-toggle-group`。利用側が書いた要素の列を包むティア A）
**レーン**: `feat/tree`　**計画時の main**: `4c4910f`（034・036 マージ後。**037（`feat/file-drop`）と並行** — `system/**` / `_shared/**` / `disclosure/**` / `menu/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/tree && echo EXISTS` が何も出ないこと（出たら STOP。自分の `scaffold:element` の出力なら続行）。
> `grep -c 'export const nextIndex' library/elements/src/_shared/roving-focus.ts` = 1、`grep -c 'export const syncStates' library/elements/src/_shared/internals.ts` = 1、
> `grep -c 'export const checkContract' library/elements/src/_shared/contract.ts` = 1、`grep -c 'export { usesJapaneseCopy }' library/elements/src/_shared/field.ts` = 1。
> `grep -c "':scope > details'" library/elements/src/disclosure/disclosure.contract.ts` = 1（`<details>` を包むティア A の手本がある）。
> `wc -l library/elements/src/toggle-group/toggle-group.element.ts` と `…/toggle-group.dom.ts` を見て、**列を包むティア A の形**を掴む。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

noter は「文書の入れ子」（フォルダ → ノート）を左に出す。qrcc も「保存したコードの分類」を畳んで見せたい。
いまあるのは `.rd-sidebar` / `.rd-nav-rail`（平らな一覧）と `rd-disclosure`（1 段の開閉）だけで、
**入れ子の一覧を矢印キーで辿る**手段が無い。

shadcn には Tree に当たるものが無い（Sidebar の入れ子で済ませている）。これは shadcn の外の追加。

`rd-tree` は**利用側が書いた `<ul>` / `<li>` / `<details>` の入れ子をそのまま包む**（ティア A）。
JS が無ければ `<details>` が素で開閉する**普通の入れ子リスト**で、リンクも押せる。
JS が来たら `role="tree"` / `role="treeitem"` と roving tabindex（↑↓ で行送り、← → で閉じる／開く、Home / End、文字で先頭一致）が足される。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/toggle-group/**`**（利用側が書いた要素の列を包み、`tabindex` を JS が付けるティア A）、
  **`library/elements/src/disclosure/**`**（`<details>` の契約）、**`library/elements/src/menu/menu.logic.ts`**（`nextIndex` と文字での先頭一致の使い方）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ
- **`*.logic.ts` で `throw` しない**。**失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。生成物は同じコミットへ（guard 規則 15）
- `bun run scaffold:element tree --pe A`（**`tree.styles.ts` は作らない**）
- `library/elements/package.json` の `exports` に `./experimental/tree{,/contract,/define,/style.css}` をアルファベット順の位置に（`toggle-group` < `tree` < `window` の並びを実際に見て入れる）
- **`bun run check` に `lint:html` は入っていない。** マージ前に `bun run render && bun run lint:html` を回す。
  **`role` を書くときは「暗黙の役割ではないか」を確かめる**（`<td role="gridcell">` で落ちた前例あり）。`<ul role="tree">` / `<li role="treeitem">` は
  暗黙の役割（`list` / `listitem`）と**違う**ので明示が要る——ただし markuplint が `aria-allowed-role` で落とすなら STOP して報告する
- **色**: accent の面に載る文字は `--rd-color-text-on-accent`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/tree`）: `library/elements/src/tree/**`（新規）、`library/elements/src/experimental/tree/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、`docs/proposals/tree.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/disclosure/**`、`library/elements/src/menu/**`、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 037** も e2e 系と `.size-limit.json` / `package.json` / `examples.ts` に追記する。自分の追記は最後の既存エントリの直後（`build-pages.ts` は `echo.html` の前）。
  コンフリクトしたら STOP（生成物は `bun run build && bun run gen` で作り直してよい）

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/disclosure/disclosure.contract.ts`（`<details>` を包むティア A）:

```ts
export const contract = {
  pe: 'A',
  roles: { details: ':scope > details', summary: ':scope > details > summary' },
  required: ['details', 'summary'],
  tree: { tag: 'rd-disclosure', children: [ { tag: 'details', attrs: { name: '$group', open: '$open' }, … } ] },
} as const satisfies Contract
```

`library/elements/src/_shared/roving-focus.ts`（そのまま使う。**触らない**）:

```ts
export const nextIndex = (current: number, count: number, key: string, orientation: Orientation): number | undefined
```

（`ArrowDown` / `ArrowUp` / `Home` / `End` を扱い、端で折り返す。扱わないキーは `undefined`。
**木の ← → は「閉じる／開く／親へ／子へ」なので `nextIndex` では決められない**——`tree.logic.ts` が自分で決める）

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`tree.contract.ts`）

**部品は木を作らない**。利用側が書くのはこの形だけ:

```html
<rd-tree label="ノート">
  <ul>
    <li><a href="/n/1">はじめに</a></li>
    <li>
      <details>
        <summary>2026 年</summary>
        <ul>
          <li><a href="/n/2">1 月の記録</a></li>
        </ul>
      </details>
    </li>
  </ul>
</rd-tree>
```

```ts
export const contract = {
  pe: 'A',
  roles: { list: ':scope > ul' },
  required: ['list'],
  tree: {
    tag: 'rd-tree',
    attrs: { label: '$label' },
    children: [{ tag: 'ul', children: [{ raw: '$children' }] }],
  },
} as const satisfies Contract
```

- `TreeMarkupProps` = `{ label: string; children: string }`（`children` は**エスケープしない**生 HTML。`rd-disclosure` と同じ約束）
- 補助の markup 関数を 2 つ出す（利用側と e2e・story が同じ正を使うため）:
  - `treeLeafMarkup({ href?, label, current? })` → `<li><a href>…</a></li>`（`href` が無ければ `<span>`）
  - `treeBranchMarkup({ label, children, open? })` → `<li><details open><summary>…</summary><ul>…</ul></details></li>`
- **`label` は必須**（`role="tree"` に名前が要る）。無ければ `:state(unlabeled)` + `console.error`

### 2. 純関数（`tree.logic.ts`）

- `type TreeRow = { readonly level: number; readonly kind: 'leaf' | 'branch'; readonly open: boolean; readonly disabled: boolean; readonly text: string }`
  — 見えている行だけを上から並べた表（**DOM を持たない**）
- `visibleRows(rows: readonly TreeRow[]): readonly number[]` は要らない——`dom.ts` が**閉じた枝の中を最初から集めない**ので、`rows` は常に「見えている行」
- `decideKey(input: { key: string; shift: boolean; index: number; rows: readonly TreeRow[]; typed: string })`
  → `{ kind: 'none' } | { kind: 'move'; index: number } | { kind: 'toggle'; index: number; open: boolean } | { kind: 'activate'; index: number }`
  - `ArrowDown` / `ArrowUp` / `Home` / `End`: `nextIndex`（`_shared/roving-focus.ts`、`vertical`）——**端で折り返す**
  - `ArrowRight`: 枝が閉じていれば `toggle(open: true)`、開いていれば**最初の子へ `move`**（次の行が「自分より深い」ならそこ）、葉なら `none`
  - `ArrowLeft`: 枝が開いていれば `toggle(open: false)`、閉じているか葉なら**親へ `move`**（上に遡って `level` が 1 小さい最初の行。無ければ `none`）
  - `Enter` / `' '`: `activate`（葉ならリンクを踏む、枝なら開閉）
  - `*`（アスタリスク）: **同じ深さの枝を全部開く** → `{ kind: 'toggle', index, open: true }` を**呼び側が繰り返す**ため、
    `siblingBranches(rows, index): readonly number[]` を別に出す
  - 1 文字のキー（英数・かな）: `typed` に足して**先頭一致**（`text-filter.ts` は使わない——あれは「絞り込み」で、ここは「移動」）。
    `firstMatch(rows, typed, from): number | undefined`
  - 扱わないキーは `none`（呼び側は `preventDefault()` しない）
- `computeStates(input: { unlabeled: boolean; malformed: boolean; empty: boolean }): ReadonlySet<string>`
- 文言: `treeCopy(japanese)` → `{ expand: '開く', collapse: '閉じる' }`（`aria-label` には使わない。**`<summary>` の文字が名前**。
  将来 `[part='twisty']` を別ボタンにするときのために持っておく——**今回は描かない**）

### 3. element（`tree.element.ts`、≤ 150 行、`if` ≤ 5）と `tree.dom.ts`

**light DOM を書き換えるだけで、木は描かない**（利用側の HTML が唯一の正）。

`tree.dom.ts`:

- `attach(host, listeners, onRedraw)` — `checkContract` → `<ul>` を掴む。`keydown` / `click` / `focusin` / `toggle`（`<details>` の開閉。**capture で聞く**——`toggle` はバブルしない）を配る。
  `MutationObserver`（`childList: true, subtree: true`）で行の増減に追随
- `readRows(list: HTMLElement): { readonly rows: readonly TreeRow[]; readonly nodes: readonly HTMLElement[] }`
  — 深さ優先で **見えている行だけ**集める。`<li>` ごとに「枝（`> details`）か葉か」を見て、閉じた枝の `<ul>` には降りない。
  `nodes[i]` は**焦点を持つ要素**（枝なら `<summary>`、葉なら `<a>` か `<li>`）
- `applyRoles(list, rows, nodes, activeIndex)` — `<ul>` に `role="tree"` と `aria-labelledby`（無ければ `aria-label`）、
  入れ子の `<ul>` に `role="group"`、各行の**焦点要素**に `role="treeitem"` / `aria-level` / `aria-expanded`（枝だけ）/ `tabindex`（roving。1 つだけ 0）。
  葉の `<a>` はそのまま（`role="treeitem"` を載せてもリンクの活性化は残る）
- `focusRow(nodes, index)` — `nodes[index]?.focus()`
- `toggleBranch(node, open)` — `<summary>` の親 `<details>` の `open` を書き換える（`click()` しない——`toggle` が二重に出る）
- **`<summary>` の既定の三角は消さない**（`list-style: none` にしない）。JS 無しでも「開ける」と分かる印なので残す

`tree.element.ts`: `label` プロパティ、`#internals`、`#attached`、`#index`（roving の現在地）、`#typed` と `#typedAt`（先頭一致の入力。
**タイマーを使わず**「前回のキーから 1 秒以上経っていたら捨てる」を `event.timeStamp` で判断する——時計を注入しない）、
`createRenderRoot`（`return this`）、`willUpdate` で `attach`、`updated` で `applyRoles` + `syncStates`、`render()` は `nothing`（**強化ノードを描かない**）。
公開 API: `get activeIndex(): number`、`expandAll(): void` / `collapseAll(): void`（`<details>` を全部開く／閉じる。**イベントは出さない**）。

**イベント**: 選択（`rd-change`）は**出さない**。木の「選択」はリンクの遷移か、利用側が `aria-current` を書くこと。
`<details>` の `toggle` はネイティブがそのまま出す。**独自イベントは 0 個**。

### 4. CSS（`tree.css`）

- `rd-tree` は `display: block`。`ul` は `list-style: none` / `padding-inline-start: 0`、入れ子の `ul` だけ `padding-inline-start: var(--rd-space-4)`（RTL でも効く論理プロパティ）
- 行（`[role='treeitem']`）は `min-block-size: var(--rd-sizing-target-min)`、`display: flex` / `align-items: center` / `gap: var(--rd-space-2)`、`border-radius: var(--rd-radius-md)`
- `:hover` は `background: var(--rd-color-surface-hover)`、`:focus-visible` は焦点環（`--rd-focus-ring-*`）
- `[aria-current]` は `background: var(--rd-color-accent-default)` / `color: var(--rd-color-text-on-accent)`（**`--rd-color-accent-text` は使わない**）
- 縦の案内線: 入れ子の `ul` に `border-inline-start: var(--rd-border-width-default) solid var(--rd-color-border-default)`（`.rd-nav-rail` と同じ色）
- `summary` は `cursor: pointer`。`list-style` を消さない（§3）
- `@media (prefers-reduced-motion: no-preference)` のときだけ `background-color` に `transition`
- `@media (forced-colors: active)`: `[aria-current]` は `forced-color-adjust: none` + `SelectedItem` / `SelectedItemText`、案内線は `CanvasText`
- 詳細度は `:where()` で `0,3,0` 以内

### 5. 状態・JSDoc

- `:state()`: `unlabeled` / `empty`（`<li>` が 1 つも無い）/ `malformed`（`<ul>` が無い）
- `@attr label`（必須）、`@csspart` は**無し**（部品はノードを作らない）、`@cssprop --rd-tree-indent`（入れ子の字下げ。既定 `var(--rd-space-4)`）
- `@slot - <ul> の入れ子（<li> と <details>）。省略不可`

### 6. 検証面

- `tree.logic.test.ts`: `decideKey` の全分岐（↓↑ の折り返し・Home/End・→ で開く／子へ・← で閉じる／親へ・葉での → ←・Enter/Space・
  扱わないキー・`*` の `siblingBranches`・`firstMatch` の巡回と大文字小文字）
- `tree.test.ts`（vitest browser）:
  1. 契約どおりなら `malformed` にならない。`<ul>` が無ければ `console.error` して `malformed`、役割も付けない
  2. ティア A なので `shadowRoot` が `null`
  3. `role="tree"` / `role="group"` / `role="treeitem"` / `aria-level` / `aria-expanded` が付き、`tabindex="0"` は 1 つだけ
  4. ↓ で次の行へ、↑ で前へ、末尾から ↓ で先頭へ折り返す
  5. → で閉じた枝が開き（`aria-expanded="true"`、`<details open>`）、もう一度 → で最初の子へ焦点が移る
  6. ← で開いた枝が閉じ、閉じた子から ← で親へ焦点が移る
  7. 文字キーで先頭一致の行へ飛ぶ（同じ文字を続けて押すと次の候補へ）
  8. `<details>` を**マウスで**開いても行の並びが追随する（`toggle` を聞いている）
  9. `expandAll()` / `collapseAll()`
  10. 44px: `[role='treeitem']` の `min-block-size` が `44px`
  11. `label` が無ければ `:state(unlabeled)` と `console.error`
- `tree.sr.test.ts`: 「tree, ノート」→「treeitem, はじめに, level 1」→ 枝が「treeitem, 2026 年, collapsed, level 1」の順で読まれる
- **stories 11 種**: `Default` / `Nested`（3 階層）/ `Expanded`（`play` で → を押して開く）/ `Current`（`aria-current` の行）/ `Empty` /
  `Dark` / `Dense` / `RTL` / `ForcedColors` / `ReducedMotion` / `Sidebar`（`.rd-sidebar` の中に置いた実寸の姿）
- e2e:
  - `build-pages.ts` に `tree.html`（`echo.html` の前）。`tier-a.spec.ts` に 2 テスト（JS 無しで `<details>` が開閉する／`role="tree"` が 0 個）。`axe.spec.ts` に `'/tree.html'`
  - `e2e/a11y/keyboard.spec.ts` に 3 テスト（Tab で木に 1 回だけ入る／↓→ の移動／`aria-expanded` の変化）
  - `e2e/frameworks/shared.ts` に `treeSuite`（4 FW）: JS 無しの `compareMarkup`、JS ありで `role="tree"` が付く、→ で開く
- `.size-limit.json` に `tree/define` を **12 KB**
- `tools/mcp/src/examples.ts` / `tools/mcp/test` / `library/react/test/markup.test.tsx`（**名前付き import**、`experimental` のキー一覧も）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備
`bun install --frozen-lockfile && git checkout bun.lock && bun run build && bun run gen && bun run test` が緑。Drift check。

### Step 1 — 契約と純関数（`feat(elements): add the rd-tree contract and keyboard logic`）
§1・§2。テストを先に赤く。`bun run build && bun run gen`。

### Step 2 — element と CSS（`feat(elements): add rd-tree (experimental, tier A)`）
§3・§4・§5 と `tree.test.ts` / `sr.test.ts` / stories。

### Step 3 — 検証面（`test(e2e): cover rd-tree with and without JS and in the four frameworks`）
§6 の e2e / examples / react test。`bun run pe` → `bun run e2e:frameworks` → `bun run a11y`。

### Step 4 — VRT（`test(vrt): baselines for tree`）
`bun run storybook:build && bash scripts/vrt.sh`（background）。**既存の画像が変わったら STOP**。

### Step 5 — 仕上げ（`docs(proposals): record the rd-tree decision and add a changeset`）
`docs/proposals/tree.md`（なぜ部品が木を描かず利用側の `<ul>` を包むのか／なぜ `<details>` を土台にするのか（JS 無しで開閉する唯一の手）／
なぜ選択イベントを出さないのか／なぜ `<summary>` の三角を消さないのか／`aria-level` を自前で数える理由／`*` と先頭一致を入れた理由（APG Tree View）／
`.rd-sidebar` との使い分け）、`.changeset/tree.md`。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0
- `wc -l …/tree.element.ts` ≤ 150、`grep -c '\bif\b' …/tree.element.ts` ≤ 5
- ティア A: `grep -c '@pe A'` = 1、`grep -cE 'static (override )?styles|shadowRootOptions|attachShadow'` = 0、`test ! -e …/tree.styles.ts`、`grep -c 'createRenderRoot'` = 1
- `grep -c 'CustomEvent' library/elements/src/tree/*.ts` = 0、`grep -c 'throw' …/tree.logic.ts` = 0
- `grep -c 'list-style: none' …/tree.css` = 1（`ul` の 1 箇所だけ。`summary` に書いていない）
- `grep -c 'setTimeout' library/elements/src/tree/*.ts` = 0（先頭一致は `event.timeStamp` で判断する）
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0、
  **`bun run render && bun run lint:html` = 0**
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-tree' library/react/src/generated/jsx.ts` ≥ 1、`grep -c 'RdTree' library/react/src/generated/experimental.ts` ≥ 1
- `.size-limit.json` の `tree/define` が 12 KB で通る

## STOP する条件（改善せず報告する）

- markuplint / axe が `<ul role="tree">` / `<li>` の中の `<a role="treeitem">` / `role="group"` を落とす（**規則を緩めない**。報告する）
- `<details>` の `toggle` が capture でも拾えない、または `<summary>` に `role="treeitem"` を載せると開閉が壊れる
- `bash scripts/guard.sh` が落ちる。既存 VRT 画像が変わる。size-limit 超過。`element.ts` が 150 行 / `if` 5 に収まらない
- `_shared/**` / `system/**` / `disclosure/**` / `menu/**` を変えないと実装できない
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする

## スコープ外

- 複数選択・チェックボックス付きの木、ドラッグでの並べ替え、遅延読み込み（`aria-busy`）、仮想スクロール、
  インライン改名、右クリックメニュー（`rd-menu context` を利用側が重ねる）

## 保守メモ

- **木の正は利用側の HTML**。部品は役割と `tabindex` を書き足すだけなので、行が増減したら `MutationObserver` が拾って `applyRoles` をやり直す
- 閉じた枝の中は `readRows` が最初から集めない。「見えている行」＝ `rows` という不変条件が、`decideKey` の ← → の判断を単純にしている
- `<details>` を土台にしたので、**JS が無くても開閉する**。ここを `<button aria-expanded>` に変えると縮退が壊れる（ADR-0012）
- 先頭一致の入力は `event.timeStamp` の差で捨てる。タイマーを入れるとテストが時計に依存する
