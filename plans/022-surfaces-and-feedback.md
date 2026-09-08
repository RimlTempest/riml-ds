# 022: 面と待ちの部品 — `.rd-card` / `.rd-empty` / `.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-scroll-area` / `.rd-aspect`、`rd-dialog` の `alert` と `placement`（Sheet / Drawer）

**優先度**: P1　**規模**: L　**依存**: 018（マージ済み。`system/css/src/atoms.css` が在ること）、017（`rd-dialog` が窓の帯を持つこと）
**レーン**: `feat/surfaces`　**計画時の main**: `9cfed6d`（019 マージ後。020・021 とは並行 — それらのファイルには触らない）

> **Drift check（最初に実行）**:
> `grep -c 'rd-card\|rd-empty\|rd-spinner\|rd-accordion\|rd-carousel\|rd-scroll-area' system/css/src/atoms.css` が 0 であること。
> `grep -c 'rd-aspect' system/css/src/utilities.css` が 0 であること。
> `grep -c 'placement\|alert' library/elements/src/dialog/dialog.element.ts` が 0 であること。出たら STOP。
> `wc -l library/elements/src/dialog/dialog.element.ts` が **150**（上限ちょうど）であること。これより大きければ STOP。
> `library/elements/src/dialog/dialog.element.ts` と `dialog.styles.ts` を読み、「現状のコード」の抜粋と見比べる。違っていたら STOP。

## なぜ

基礎の部品が少ない、というオーナーの指摘（shadcn/ui の一覧を基準にする）。shadcn にあって riml-ds に無い「面・待ち・フィードバック」系は
**Card / Empty / Spinner / Accordion / Carousel / Scroll Area / Aspect Ratio / Alert Dialog / Sheet・Drawer**。このうち

- Card / Empty / Spinner / Accordion / Carousel / Scroll Area / Aspect Ratio は **JS が要らない**ので部品にしない（ADR-0012 §6）。
  `@rimltempest/riml-ds-css` の **`atoms.css`（静的な飾り）** と **`utilities.css`（1 目的のクラス）** に足す。
  Accordion は 009 の `rd-disclosure`（`<details name>`）を並べる**入れ物**、Carousel は **CSS scroll snap**、Scroll Area は
  `scrollbar-width` / `scrollbar-color`（Baseline 2024）で、どれもブラウザが素で動く
- Alert Dialog と Sheet / Drawer は **`rd-dialog` の属性**（`alert` と `placement`）にする。別部品にすると帯・フォーカス戻し・
  `rd-dismiss` を二重に持つことになる（ADR-0014 決定 4 の「帯は 1 か所」と同じ判断）
- Progress は既に **`rd-meter` が `<progress>` を包める**（`indeterminate` 状態あり）ので足さない

参考画面（Phase E の指示画像）から持ち込むのは **クリーム色の面に硬い影の窓・点線の区切り・積み重なる窓** という構図だけ。
絵・アイコン・文言・ロゴは写さない（brand.md §9）。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ（`--rd-color-palette-*` は stylelint が落とす）
- **`outline: none` / `outline-width: 0` を書かない**。強制配色で選択・活性を示すのは `outline: … solid Highlight`
- **グラデーションを描かない**（`linear-gradient` / `radial-gradient` は brand.md §9 が禁じる。spinner も罫線で描く）
- 動きは `prefers-reduced-motion: no-preference` の中だけ（spinner の回転・carousel の `scroll-behavior: smooth`・sheet の滑り込み）
- `.size-limit.json` の予算内（`rd-dialog` の `define` は既存の上限。超えたら 1 KB 単位で上げ、理由を changeset に書く）
- `rd-dialog` の既存 API（`open` / `persistent` / `show()` / `close()` / `rd-dismiss`）と既存 story の**見た目を変えない**（既存 VRT 画像が変わったら STOP）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`system/css/src/atoms.css` の `.rd-alert` / `.rd-list-row` / `.rd-skeleton`**（静的な飾りの書き方。コメントに使い方の HTML を書く）と
  **`library/elements/src/dialog/**`**（ティア B）
- `any` / `as` / `!` / `enum` を書かない。リアクティブな prop は `static properties` + `declare` + constructor 初期化
- **失敗するテストを先に書く**（CSS は `system/css/test/atoms.test.ts` の `CLASSES` 配列と個別の `describe`、dialog は logic / browser / sr / story）
- `*.element.ts` を変えたら `bun run gen`（CEM・registry・ラッパー・argTypes。guard 検査 15）
- CSS の単位: `px` は罫線・アウトラインだけ。それ以外は `rem` か `--rd-*`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/surfaces`）: `system/css/src/atoms.css`、`system/css/src/utilities.css`、`system/css/README.md`（表に行を足すだけ）、
  `system/css/test/**`、`library/elements/src/dialog/**`、`library/elements/custom-elements.json`、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、
  `library/react/test/**`、`e2e/**`、`.size-limit.json`、`docs/proposals/dialog-variants.md`（新設）、`docs/baseline.md`（**表に 1 行足すだけ**）、`.changeset/`
  **触らない**: `system/tokens/**`（値が要るなら STOP）、`system/css/src/` の他ファイル（`patterns.css` は 021 が触る。`build.ts` は 020 が触る）、
  `library/elements/src/` の dialog 以外、`library/elements/src/_shared/**`、`library/elements/package.json`（新しい export は無い）、
  `apps/storybook/**`、`docs/*.md`（baseline.md の 1 行を除く）、`plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`、`scripts/**`、`.github/**`
- コミットは段階ごと（下の Step の粒度）。Conventional Commits
- **並行レーン 020 / 021 が同時に進んでいる。** `custom-elements.json` / `registry.json` / `tools/mcp/src/examples.ts` / `e2e/pe/build-pages.ts` /
  `.size-limit.json` は複数レーンが追記する。**自分の追記はアルファベット順の位置に入れる**。`git merge main` はしてよいが、コンフリクトが出たら**自分で解決せず STOP**

## 現状のコード（抜粋。読んでから触る）

`system/css/src/atoms.css`（`@layer rd.components`）。各クラスの上に**使い方の HTML をコメントで書く**流儀:

```css
  /* 注意書き。トーストと同じ左の帯（brand.md §7.7）。
     **role は利用側が付ける** — …
     <div class="rd-alert" data-tone="warning" role="status">…</div> */
  .rd-alert {
    --rd-alert-tone: var(--rd-color-status-info-default);
    display: grid;
    …
  }
```

`system/css/test/atoms.test.ts`: `CLASSES` 配列（`.rd-badge` … `.rd-legend-item`）を `selectorsOf(css)` と突き合わせる。**新クラスはここに足す**（red の起点）。

`library/elements/src/dialog/dialog.element.ts`（**150 行ちょうど**。属性を足すには行を減らす必要がある）:

```ts
  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    persistent: { type: Boolean, reflect: true },
  }
  …
  override render(): TemplateResult {
    return html`<dialog part="control" aria-labelledby="rd-dialog-label" @cancel=${this.#onCancel} @click=${this.#onClick} @close=${this.#onClose}>
      ${dialogBar(this.persistent, windowControlLabels(this).close, this.#closeByButton)}
      <div part="body"><slot></slot><slot name="actions"></slot></div>
    </dialog>`
  }
  …
  #onCancel = (event: Event): void => {
    const decision = decideClose({ persistent: this.persistent, reason: 'esc' })
    if (decision.kind === 'blocked') { event.preventDefault(); return }
    this.#reason = decision.reason
  }
  #onClick = (event: Event): void => {
    const decision = decideClose({ persistent: this.persistent, reason: 'backdrop' })
    const dialog = this.#dialog()
    if (decision.kind === 'close' && event.target === dialog) { this.#reason = decision.reason; dialog?.close() }
  }
```

`dialog.logic.ts`: `decideClose({ persistent, reason })`（`persistent` かつ `esc` / `backdrop` → `blocked`）、`computeStates({ open, malformed })`、
`focusReturnTarget`、`decideDialogAction({ wanted, actual })`。**すべて純関数**。

`dialog.styles.ts`: `[part='control']` が `max-inline-size: min(90vi, 60ch); border-radius: var(--rd-radius-lg); background: var(--rd-color-surface-raised); box-shadow: var(--rd-shadow-overlay)`、
`::backdrop` が `--rd-color-overlay-default`、`${windowChrome}`（帯）、`@media (prefers-reduced-motion: no-preference)` で `opacity` + `display allow-discrete` の遷移と `@starting-style`。

`dialog.contract.ts`: `attrs: { open: '$open', persistent: '$persistent' }`。`DialogMarkupProps` に `open?` / `persistent?`。

`e2e/pe/build-pages.ts` の `PAGES`: `'dialog.html': page(…)`。`e2e/frameworks/shared.ts` は部品ごとの suite を export。

## 設計（決めてある。変えるなら STOP）

### `atoms.css` に足す 6 つ

| クラス | 構造 | 決め |
| --- | --- | --- |
| `.rd-card` | `<article class="rd-card"><img class="rd-card-media"><div class="rd-card-body"><h3 class="rd-card-title">…</h3><p>…</p></div><div class="rd-card-footer">…</div></article>` | `display: grid; overflow: clip; border: var(--rd-border-width-default) solid var(--rd-color-border-default); border-radius: var(--rd-radius-lg); background: var(--rd-color-surface-raised); box-shadow: var(--rd-shadow-raised)`。`.rd-card-media` は `inline-size: 100%; aspect-ratio: 16 / 9; object-fit: cover`、`.rd-card-body` は `padding: var(--rd-space-4); display: grid; gap: var(--rd-space-2)`、`.rd-card-title` は `margin: 0; font: var(--rd-type-heading-3)`、`.rd-card-footer` は `padding: var(--rd-space-3) var(--rd-space-4); border-block-start: var(--rd-border-width-default) dashed var(--rd-color-border-default)`（点線の区切り = brand.md §7.6）。`.rd-card:has(> a.rd-card-link)` は `:hover` で `background: var(--rd-color-surface-hover)`、`:has(> a.rd-card-link:focus-visible)` で ring（リンクカード。`a.rd-card-link::after { content: ''; position: absolute; inset: 0 }` でカード全面を押せるようにし、`.rd-card` に `position: relative`）。forced-colors: `border-color: CanvasText` |
| `.rd-empty` | `<div class="rd-empty"><span class="rd-empty-icon" aria-hidden="true">…</span><p class="rd-empty-title">まだありません</p><p>…</p><div class="rd-empty-actions">…</div></div>` | `display: grid; justify-items: center; gap: var(--rd-space-2); padding: var(--rd-space-8) var(--rd-space-4); text-align: center; color: var(--rd-color-text-muted)`。`.rd-empty-icon > :is(svg, img)` は `inline-size: var(--rd-space-12); block-size: var(--rd-space-12)`、`.rd-empty-icon:empty { display: none }`、`.rd-empty-title { margin: 0; color: var(--rd-color-text-default); font: var(--rd-type-heading-3) }`、`.rd-empty-actions { display: flex; gap: var(--rd-space-2); margin-block-start: var(--rd-space-2) }` |
| `.rd-spinner` | `<span class="rd-spinner" role="status"><span class="rd-visually-hidden">読み込み中</span></span>` | 罫線で描く輪: `display: inline-block; inline-size: var(--rd-spinner-size, var(--rd-space-6)); block-size: var(--rd-spinner-size, var(--rd-space-6)); border: var(--rd-space-1) solid var(--rd-color-border-default); border-block-start-color: var(--rd-color-accent-default); border-radius: var(--rd-radius-full)`。回転は `@media (prefers-reduced-motion: no-preference)` の中だけ（`animation: rd-spin 1s linear infinite`、`@keyframes rd-spin { to { rotate: 1turn } }`）。reduce のときは**止まった輪**のまま（文字が「読み込み中」を伝える）。**文言は利用側が `rd-visually-hidden` で書く**（コメントに明記）。forced-colors: `border-color: CanvasText; border-block-start-color: Highlight` |
| `.rd-accordion` | `<div class="rd-accordion"><rd-disclosure><details name="faq"><summary>…</summary>…</details></rd-disclosure>…</div>` | 入れ物だけ: `display: grid; border-block: var(--rd-border-width-default) solid var(--rd-color-border-default)`。`.rd-accordion > rd-disclosure + rd-disclosure` に `border-block-start: var(--rd-border-width-default) dashed var(--rd-color-border-default)`。`rd-disclosure` の中身のスタイルは**触らない**（disclosure.css の持ち物）。排他は `<details name>` で利用側が付ける（コメント） |
| `.rd-carousel` | `<div class="rd-carousel" role="region" aria-roledescription="carousel" aria-label="新着" tabindex="0"><ul class="rd-carousel-track"><li class="rd-carousel-item">…</li>…</ul></div>` | `.rd-carousel { overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: var(--rd-color-border-strong) transparent; padding-block-end: var(--rd-space-2) }`、`:focus-visible` は ring、`.rd-carousel-track { display: flex; gap: var(--rd-space-4); margin: 0; padding: 0; list-style: none }`、`.rd-carousel-item { flex: 0 0 var(--rd-carousel-item, min(100%, 20rem)); scroll-snap-align: start }`。`@media (prefers-reduced-motion: no-preference) { .rd-carousel { scroll-behavior: smooth } }`。**前後ボタンは付けない**（JS が要る。利用側が `rd-button` + `scrollBy` で足す。コメントに書く）。`role` / `aria-roledescription` / `aria-label` / `tabindex="0"` は利用側が付ける（キーボードで横スクロールできるようにするため。コメントに明記） |
| `.rd-scroll-area` | `<div class="rd-scroll-area" tabindex="0" role="region" aria-label="ログ">…</div>` | `overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--rd-color-border-strong) transparent; scrollbar-gutter: stable; max-block-size: var(--rd-scroll-area-max, 20rem)`。`:focus-visible` は ring。`[data-axis='x']` で `overflow: auto hidden`（横だけ）。forced-colors では `scrollbar-color` を書かない（既定に戻す。`scrollbar-color: auto`） |

### `utilities.css` に足す 1 つ

- `.rd-aspect { aspect-ratio: var(--rd-aspect, 16 / 9); overflow: clip }`、`.rd-aspect > :is(img, video, iframe) { inline-size: 100%; block-size: 100%; object-fit: cover }`。
  `.rd-aspect[data-ratio='1'] { --rd-aspect: 1 }`、`[data-ratio='4-3'] { --rd-aspect: 4 / 3 }`（`data-ratio` は 2 種だけ。他は `style="--rd-aspect: 21 / 9"`）

### `rd-dialog` の `alert` と `placement`

- 属性 `alert`（Boolean reflect）: `<dialog role="alertdialog">` にする（無いときは `role` を付けない = 既定の `dialog`）。
  **`alert` は背面クリックを止める**（WAI-APG の Alert Dialog は外側クリックで閉じない。Esc は閉じる）。
  `decideClose({ persistent, alert, reason })` に `alert && reason === 'backdrop'` → `blocked` を足す（`persistent` の規則はそのまま）
- 属性 `placement`（`'center' | 'start' | 'end' | 'bottom'`、既定 `'center'`、reflect）: `DialogPlacement` 型は `dialog.logic.ts` に置く。
  `computeStates` に `placement` を渡し、`center` 以外は state 名にそのまま（`:state(end)` など）を足す（`open` / `malformed` と共存）。
  見た目は `dialog.styles.ts` の `:host([placement='end']) [part='control']` 等で当てる（**JS は属性を反映するだけ**）:
  - `start` / `end`: `margin: 0; margin-inline-start: auto`（`end`）/ `margin-inline-end: auto`（`start`）、`block-size: 100dvb; max-block-size: none; inline-size: min(90vi, 40ch); max-inline-size: none`、
    角は面している側だけ落とす（`end`: `border-start-end-radius: 0; border-end-end-radius: 0`、`start` はその逆。論理プロパティで RTL に追随）
  - `bottom`: `margin: auto 0 0; inline-size: 100%; max-inline-size: none; max-block-size: 90dvb; border-end-start-radius: 0; border-end-end-radius: 0`
  - `[part='body']` は `overflow: auto`（sheet は縦に長くなる）
  - 動き: `@media (prefers-reduced-motion: no-preference)` の中で、`end` は `translate: 100% 0` から、`start` は `-100% 0` から、`bottom` は `0 100%` から
    `translate: 0 0` へ（既存の `opacity` と同じ `transition` に `translate` を足す。`@starting-style` で開始値）。**既存の center の遷移は変えない**
  - forced-colors は既存のまま（罫線 `CanvasText`）
- **150 行に収める**ために: `#onCancel` と `#onClick` の共通部分を `#dismiss(reason: DismissReason, event: Event): void` にまとめる
  （`decideClose` → `blocked` なら `preventDefault`、`close` なら `#reason` を書く。`#onClick` は `event.target === dialog` を先に見てから `#dismiss('backdrop', …)` を呼び `dialog.close()`）。
  それでも超えるなら `#applyOpen` の `switch` を `{ open: () => dialog?.showModal(), close: () => dialog?.close(), none: () => undefined }[action]()` の表引きにする。
  **`if` ≤ 5 も守る**
- 契約: `attrs: { open: '$open', persistent: '$persistent', alert: '$alert', placement: '$placement' }`、`DialogMarkupProps` に `alert?: boolean` / `placement?: DialogPlacement`
- `dialog.css`（`:not(:defined)`）は変えない（未定義時は inline のセクションのまま）
- JSDoc: `@state start|end|bottom - placement`、`@summary` は変えない。`@status stable` のまま（属性の追加は後方互換）
- story: `Alert`（`alert` + 「削除しますか」+ actions に danger ボタン）、`SheetEnd`、`SheetStart`、`SheetBottom`（各 `open: true`、`play: settled`）。
  既存の story は**変えない**
- 読み上げ（`dialog.sr.test.ts`）: `alert` のとき `alertdialog` 役割で名前が label
- browser（`dialog.test.ts`）: `alert` で背面クリックしても閉じない・Esc で閉じる、`placement="end"` で `:state(end)` と `dialog[open]` の `getBoundingClientRect().right` が viewport 右端に接する

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

```bash
bun install --frozen-lockfile && bun run build && bun run gen && bun run check && bun run test
```

全部 exit 0 を確認してから始める（落ちるなら STOP。あなたの変更ではない）。

### Step 1 — `atoms.css` の 6 クラス（`feat(css): add card, empty, spinner, accordion, carousel and scroll area atoms`）

red: `atoms.test.ts` の `CLASSES` に `.rd-card` / `.rd-card-media` / `.rd-card-body` / `.rd-card-title` / `.rd-card-footer` / `.rd-empty` / `.rd-empty-title` / `.rd-empty-icon` / `.rd-empty-actions` /
`.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-carousel-track` / `.rd-carousel-item` / `.rd-scroll-area` を足す。個別の `describe`:
「spinner の回転は reduced-motion の外に無い」（`@media (prefers-reduced-motion: no-preference)` の中にだけ `animation` がある）、「gradient を含まない」、
「carousel は `scroll-snap-type` を持つ」、「scroll-area は `scrollbar-width: thin` を持ち forced-colors で `auto` に戻す」。
green: `atoms.css` に追記（各クラスの上に使い方 HTML のコメント）。`bun run check`（stylelint）。`system/css/README.md` の表に 6 行。

### Step 2 — `.rd-aspect`（`feat(css): add the aspect ratio utility`）

red: `system/css/test` に utilities のテストが無ければ `utilities.test.ts` を新設（`.rd-aspect` と `[data-ratio='1']` / `[data-ratio='4-3']` が在る）。green。

### Step 3 — `rd-dialog` の logic（`feat(elements): decide alert dialog dismissal and placement states`）

red: `dialog.logic.test.ts` に `decideClose({ alert: true, reason: 'backdrop' })` → `blocked`、`{ alert: true, reason: 'esc' }` → `close`、
`computeStates({ open: true, placement: 'end', malformed: false })` → `Set(['open', 'end'])`、`placement: 'center'` は state を足さない。green。

### Step 4 — `rd-dialog` の element / styles / contract / story（`feat(elements): add alert and placement to rd-dialog`）

red: `dialog.contract.test.ts`（`markup({ alert: true, placement: 'end' })` が属性を出す）、`dialog.test.ts`、`dialog.sr.test.ts`（上記）。
green: element（≤ 150 行、`if` ≤ 5）、styles、contract、story 4 種。`bun run gen`。
`bun run test -- --project node --project browser --project storybook library/elements/src/dialog`。

### Step 5 — 検証面（`test(e2e): cover surfaces atoms and dialog variants without JS`）

- `e2e/pe/build-pages.ts` に `'card.html'`（card + empty + spinner + accordion + carousel + scroll-area + aspect を 1 ページに）と `'dialog-sheet.html'`（`placement="end"`、`alert`）。
  `e2e/pe/*.spec.ts` の既存の流儀で「JS 無しで内容が読める」（tier B）と axe を通す
- `e2e/frameworks/shared.ts` の既存 dialog の比較に `alert` / `placement` を足す（suite を新設せず、既存の `dialog` の `compareMarkup` の props に加える。4 フレームワークとも）
- `tools/mcp/src/examples.ts` の dialog の例に `placement="end"` の例を 1 つ足す → `tools/mcp/test` green
- `docs/proposals/dialog-variants.md`（目的 / API / a11y / 代替案。「別部品にしなかった理由」を書く）
- `docs/baseline.md` の表に 1 行: `| \`scrollbar-width\` / \`scrollbar-color\` | Newly | .rd-scroll-area / .rd-carousel の細いスクロールバー。無ければ既定の見た目 |`（`scrollbar-gutter` の行の直後）

```bash
bun run build && bun run gen && bun run pe && bun run e2e:frameworks
```

### Step 6 — VRT（`test(vrt): baselines for dialog variants`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'Dialog'
bash scripts/vrt.sh
bun run a11y
bun run render && bun run lint:html
```

**既存の Dialog 画像が 1 枚も変わらないこと**（`git status e2e/__screenshots__` で新規だけが増える）。変わったら STOP。

### Step 7 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD
```

changeset（minor、`@rimltempest/riml-ds-css`: 「atoms に card / empty / spinner / accordion / carousel / scroll-area、utilities に aspect」、
`@rimltempest/riml-ds-elements`: 「rd-dialog に `alert` と `placement`」）。

## 完了条件（機械で検査できるもの）

- `grep -c '\.rd-card\b' system/css/src/atoms.css` ≥ 1、`grep -c 'rd-aspect' system/css/src/utilities.css` ≥ 1
- `grep -c 'linear-gradient\|radial-gradient\|outline: none\|outline-width: 0' system/css/src/atoms.css system/css/src/utilities.css library/elements/src/dialog/dialog.styles.ts` = 0
- `bun run gen` 後 `custom-elements.json` の `rd-dialog` に `alert` / `placement` の attribute と `start` / `end` / `bottom` の state がある
- `wc -l library/elements/src/dialog/dialog.element.ts` ≤ 150
- `bun run pe` exit 0、`bun run e2e:frameworks` exit 0、`bun run test` exit 0、`bash scripts/vrt.sh` exit 0、`bun run a11y` exit 0、`bun run render && bun run lint:html` exit 0
- `git diff --stat main...HEAD -- e2e/__screenshots__` が**追加だけ**（既存画像の変更 0）
- `bun run release:check` exit 0、`bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- 必要なトークンが無い（例: `--rd-space-10`）→ 名前と用途を書いて STOP
- `dialog.element.ts` が上記の削り方でも 150 行に収まらない → STOP（`_shared` に逃がさない）
- 既存の Dialog の VRT 画像が変わる → STOP（差分の画像パスを報告）
- `<dialog>` の `translate` 遷移が `display allow-discrete` と干渉して閉じるときに残像が出る → `translate` の遷移を**開くときだけ**（`@starting-style` のみ）にして報告
- `git merge main` でコンフリクト → STOP
- ラッパー生成器が `placement` の union 型を扱えず落ちる → STOP

## スコープ外

- Resizable（`resize: inline` で足りる。要望が出たら utilities）、Data Table（`.rd-table` + 利用側のロジック）、Chart
- Carousel の前後ボタン・ドット（JS。`::scroll-button()` / `::scroll-marker` が Baseline に入ったら CSS だけで足す）
- Hover Card・Combobox・Command（020 マージ後の wave）
- `rd-toast` の位置指定（別 plan）

## 保守メモ

- `.rd-card` のリンクカード（`a.rd-card-link::after` で全面化）は、カード内に他のリンク・ボタンを置くと `::after` の下に隠れる。
  その場合は他の操作要素に `position: relative; z-index: 1` を利用側が付ける（コメントに書く）
- `.rd-spinner` は文言を持たない。`role="status"` と `rd-visually-hidden` の文言は利用側の責任
- `rd-dialog` の `placement` は `<dialog>` の `margin` で位置を決めている（`position: fixed` の top layer は `inset` を無視するため `margin` が唯一の手）
- `alert` は `role` だけでなく背面クリックの挙動も変える。`persistent` と重ねると Esc も止まる
