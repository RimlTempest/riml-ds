# 020: ナビと重ね物 — `rd-tabs`、`rd-menu`、`rd-tooltip`、`rd-popover` と `navigation.css`（breadcrumb / pagination / nav-rail / menubar）

**優先度**: P1　**規模**: L　**依存**: 017・018（マージ済み）。019 と**並行**できる（レーンが重ならない）
**レーン**: `feat/nav-overlays`　**計画時の main**: 017 / 018 のマージ後に advisor が `plans/README.md` の Planned at に記す

> **Drift check（最初に実行）**:
> `test -d library/elements/src/tabs -o -d library/elements/src/menu -o -d library/elements/src/tooltip -o -d library/elements/src/popover && echo EXISTS` が何も出ないこと。出たら STOP。
> `test -f system/css/src/navigation.css && echo EXISTS` が何も出ないこと。
> `grep -c "'atoms'" system/css/scripts/build.ts` が 1 であること（018 が入っている前提）。
> `grep -n 'popover' library/elements/src/toast/toast.element.ts | head -3` で `popoverMode()` の形（`'popover' in HTMLElement.prototype ? 'manual' : undefined`）を確かめる。無ければ「現状のコード」を疑って読み直す。

## なぜ

shadcn/ui の一覧のうち「移動」と「重ねて出す」ものが riml-ds に無い: Tabs / Dropdown Menu / Tooltip / Popover / Breadcrumb / Pagination / Navigation Menu / Menubar / Sidebar。
参考画面（Phase E の指示画像）にも **ブラウザ風のタブ**、**メニューバー**、**点を並べたアイコンのナビレール** がある。

作り分け（ADR-0012 のティア表と plan 009 バックログ #6〜#8 を踏襲）:

| もの | 形 | 理由 |
| --- | --- | --- |
| `rd-tabs` | **ティア B** 部品 | JS 無しでは `<a href="#panel">` のページ内リンクとして動き、内容が見える。JS が ARIA tabs とキー操作を足す |
| `rd-menu` | **ティア B** 部品 | `<button popovertarget>` + `<div popover>` は **HTML だけで開閉する**（Popover API、Newly）。JS は `role=menu` と矢印キーと位置決めだけ |
| `rd-popover` | **ティア B** 部品 | menu と同じ骨格で、中身が自由（見出し・本文・フォーム）。`role=dialog`（非モーダル） |
| `rd-tooltip` | **ティア C** 部品 | 無くても害が無い。JS 無しでは `title` 属性が代替 |
| breadcrumb / pagination / nav-rail / menubar / sidebar | **CSS のみ**（`navigation.css`） | JS が要らない。`<nav aria-label>` + リスト + リンクの形を決めるだけ |

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ
- **Newly の機能は囲む**（`docs/baseline.md`）: `popover` / anchor positioning / `:state()` / `@starting-style`。無いときの見え方を必ず決める
- **ホバーだけに頼らない**（tooltip はフォーカスでも出る。WCAG 1.4.13: Esc で消える・ポインタを乗せても消えない・消えるまで留まる）
- **参考画面の絵・アイコン・ロゴ・文言を写さない**。持ち込むのは「タブが帯から生える」「点を縦に並べる」という構図だけ
- `.size-limit.json` の予算内（新部品 1 つ = `define` 12 KB）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/dialog/**`**（ティア B: 枠だけ shadow、内容は slot、`:not(:defined)` の見え方を `.css` に）、
  **`library/elements/src/toast/**`**（`popover` の使い方、`popoverMode()`）、**`library/elements/src/live-region/**`**（ティア C）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ。リアクティブな prop は `static properties` + `declare` + constructor 初期化
- **失敗するテストを先に書く**。`*.element.ts` / `*.contract.ts` を変えたら `bun run gen`
- 新部品は `bun run scaffold:element <name> --pe B|C` で骨格を作る。`library/elements/package.json` の `exports` に `./experimental/<name>{,/contract,/define,/style.css}`（C は `style.css` 無し。`live-region` の exports を手本に）
- story は 8 種 + 部品ごとの追加。a11y の除外には `reason:` を付ける
- 触ってよいパス（`scripts/lanes.tsv` の `feat/nav-overlays`）: `library/elements/src/{tabs,menu,tooltip,popover}/**`（新規）、`library/elements/src/experimental/{tabs,menu,tooltip,popover}/**`（新規）、
  `library/elements/src/_shared/popover-anchor.ts`（新規。menu / popover / tooltip が共有する位置決め）、`library/elements/src/_shared/roving-focus.ts`（新規。tabs / menu が共有）、
  `library/elements/package.json`（exports のみ）、`system/css/src/navigation.css`（新規）、`system/css/scripts/build.ts`（ORDER に `'navigation'` を `'atoms'` の直後に足すだけ）、
  `system/css/package.json`（exports に `./navigation.css` を足すだけ。018 が `./atoms.css` を足していればその行を手本に）、`system/css/README.md`（一覧 1 行）、`system/css/test/**`、
  `library/{react,vue,svelte,astro}/src/generated/**`、`tools/cem/registry.json`、`library/elements/custom-elements.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、
  `e2e/**`、`.size-limit.json`、`docs/proposals/{tabs,menu,tooltip,popover}.md`（新設）、`docs/baseline.md`（**`popover` 行の「plan 009」を「plan 020」に直す 1 行のみ**）、`.changeset/`
  **触らない**: `system/tokens/**`、`system/css/src/` の他ファイル（`patterns.css` は 019 のレーン）、既存部品のディレクトリ、`apps/storybook/**`、`docs/*.md`（baseline の 1 行以外）、
  `plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`
- 隣のレーン `feat/form-wave3`（019）が `patterns.css` と `radio-group` / `slider` / `text-field.stories.ts` / `_shared/field.ts` を触る。**あなたは触らない**。
  `e2e/pe/build-pages.ts` / `e2e/frameworks/shared.ts` / `.size-limit.json` / `library/elements/package.json` は両レーンが**追記**する → 自分の追記だけを行い、マージ時の衝突は advisor が解く
- コミットは段階ごと。Conventional Commits

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/dialog/dialog.contract.ts`（ティア B の契約。**見出しは slot、本文は raw**）:

```ts
export const contract = {
  pe: 'B',
  roles: { label: ':scope > [slot="label"]' },
  required: ['label'],
  tree: {
    tag: 'rd-dialog',
    attrs: { open: '$open', persistent: '$persistent' },
    children: [
      { tag: 'h2', slot: 'label', children: [{ prop: 'label' }] },
      { raw: '$children' },
    ],
  },
} as const satisfies Contract
```

`library/elements/src/toast/toast.element.ts`:

```ts
/** popover は Baseline Newly（docs/baseline.md）。無ければ shadow 内の固定配置に落ちる */
const popoverMode = (): string | undefined =>
  'popover' in HTMLElement.prototype ? 'manual' : undefined
// render(): html`<div part="control" popover=${popoverMode() ?? nothing} …>`
// 開閉の判定: box.matches(':popover-open')
```

`library/elements/src/dialog/dialog.styles.ts`: `[part='control']` の `transition: opacity …, display … allow-discrete` と `@starting-style` は
`@media (prefers-reduced-motion: no-preference)` の中、`@supports (transition-behavior: allow-discrete)` で囲む。**menu / popover / tooltip の入場も同じ書き方**。

`system/css/scripts/build.ts` の `ORDER`（018 後）: `['layers','reset','base','typography','atoms','patterns','utilities','print','forced-colors']`。
`navigation` は `atoms` の直後に入れる（patterns より前。patterns の `.rd-window` の中にナビが入るとき patterns が勝つ）。

`e2e/pe/tier-b.spec.ts`: JS を切って `dialog.html` / `disclosure.html` を開き「内容が見える」ことを見る。`tabs.html` / `menu.html` / `popover.html` も同じ形で足す。

## 設計（決めてある。変えるなら STOP）

### `rd-tabs`（ティア B、experimental）

契約:

```ts
export const contract = {
  pe: 'B',
  roles: {
    list: ':scope > [slot="tabs"]',                // <ul slot="tabs"> または <nav slot="tabs">
    tabs: ':scope > [slot="tabs"] a[href^="#"]',   // 1 個以上
    panels: ':scope > [id]',                       // href と同じ id を持つ子（section など）
  },
  required: ['list', 'tabs'],
  tree: {
    tag: 'rd-tabs',
    attrs: { variant: '$variant', label: '$label' },
    children: [
      { tag: 'ul', slot: 'tabs', children: [{ raw: '$tabs' }] },   // 利用側が tabMarkup() で <li><a href="#id">…</a></li> を並べる
      { raw: '$panels' },                                          // <section id="id" …>…</section> を並べる
    ],
  },
} as const satisfies Contract
export const tabMarkup = (props: { readonly href: string; readonly label: string }): string  // `<li><a href="#…">…</a></li>`
export const panelMarkup = (props: { readonly id: string; readonly children: string }): string // `<section id="…">…</section>`
```

- JS 無し: すべてのパネルが見え、`<a href="#id">` はページ内リンク（**ティア B の「内容が見える」**）。`.css` の `rd-tabs:not(:defined)` は
  タブの列をただのリンクの列として整える（`display: flex; gap; flex-wrap: wrap`）
- JS あり（`firstUpdated`）: `<ul>` に `role="tablist"` と `aria-label`（`label` 属性。無ければ `console.error` + `unlabeled`）、
  各 `<a>` に `role="tab"` / `id`（無ければ `rd-tab-<n>`）/ `aria-controls` / `aria-selected` / `tabindex`（選択中 0、他 -1）、
  各パネルに `role="tabpanel"` / `aria-labelledby` / `tabindex="0"` / 非選択に `hidden`。`<li>` には `role="presentation"`
- 選択: `click`（`preventDefault` して URL を汚さない）、矢印（←→。`orientation="vertical"` なら ↑↓）、Home / End で **roving tabindex**（`_shared/roving-focus.ts`: `nextIndex(current, count, key, orientation)` の純関数）。
  **自動活性化**（フォーカス移動で切り替え。WAI-ARIA APG の既定）。`rd-change` `{ id }` を出す
- 初期選択: `location.hash` が一致する tab → なければ `selected` 属性（`selected="#id"`）→ なければ最初
- `variant`: `'line'`（既定。下線 = `border-block-end: var(--rd-border-width-thick, 2px) solid var(--rd-color-accent-default)`）と
  `'browser'`（参考画面の構図。選択タブが **帯の面から生えて本体と同じ面色**になる: `background: var(--rd-color-surface-raised)`、上 2 角だけ `--rd-radius-md`、
  非選択は `--rd-color-chrome-default` の帯の上に `--rd-color-chrome-text`）。**選択は面と位置で示す**（色だけに頼らない）
- shadow: `<div part="control"><slot name="tabs"></slot><div part="panels"><slot></slot></div></div>`。`delegatesFocus` は付けない（tab 自体がリンク）
- `:state()`: `vertical` / `unlabeled` / `malformed`

### `rd-menu`（ティア B、experimental）

契約:

```ts
export const contract = {
  pe: 'B',
  roles: {
    trigger: ':scope > [slot="trigger"]',                 // <button popovertarget="id"> か、それを包む rd-button
    list: ':scope > [popover]',                           // <div popover id="id"><ul>…</ul></div>
    items: ':scope > [popover] :is(a[href], button)',     // 1 個以上
  },
  required: ['trigger', 'list', 'items'],
  tree: {
    tag: 'rd-menu',
    attrs: { placement: '$placement', label: '$label' },
    children: [
      { tag: 'rd-button', slot: 'trigger', children: [{ tag: 'button', attrs: { type: 'button', popovertarget: '$id' }, children: [{ prop: 'label' }] }] },
      { tag: 'div', attrs: { popover: '', id: '$id' }, children: [{ tag: 'ul', children: [{ raw: '$items' }] }] },
    ],
  },
} as const satisfies Contract
export const menuItemMarkup = (props: { readonly label: string; readonly href?: string; readonly disabled?: boolean }): string
// href あり → `<li><a href>…</a></li>`、無し → `<li><button type="button">…</button></li>`
```

- JS 無し: `popovertarget` で開閉し、項目はリンク / ボタンとしてそのまま動く（Popover API が無い古いブラウザでは `[popover]` が常に見える →
  `.css` の `rd-menu:not(:defined) [popover]` は `display: block` のリストにする。**隠さない**。ティア B の約束は「内容が見える」）
- JS あり: `<ul>` に `role="menu"` / `aria-labelledby`（トリガーの id）、`<li>` は `role="presentation"`、項目に `role="menuitem"` / `tabindex="-1"`（`disabled` は `aria-disabled="true"` で**フォーカス可能のまま**）。
  トリガーに `aria-haspopup="menu"` / `aria-expanded`。`toggle` イベント（popover の open）で最初の項目にフォーカス、↑↓ / Home / End は roving（`_shared/roving-focus.ts`）、
  Esc は popover が閉じる（ネイティブ）→ トリガーへフォーカスを戻す。項目の `click` で `hidePopover()` して `rd-select` `{ index, href }` を出す
  （`rd-select` はタグ名と同じ文字列だがイベント名。**衝突しないことをテストで示す**: `rd-select` 要素の `change` は透過、menu は `CustomEvent('rd-select')`）
- 位置決め（`_shared/popover-anchor.ts`）: anchor positioning が使えるなら（`CSS.supports('anchor-name: --x')`）トリガーに `anchor-name: --rd-menu-<n>`、
  `[popover]` に `position-anchor` + `position-area: block-end span-inline-end`（`placement="end"` なら `span-inline-start`）+ `position-try-fallbacks: flip-block`。
  使えないなら **`getBoundingClientRect` で `top` / `left` を書く**（1 関数、`resize` / `scroll` は追随しない。`docs/baseline.md`「Floating UI ではなく下固定」）。
  純関数 `computeAnchorStyle({ trigger: DOMRectLike, popover: DOMRectLike, viewport, placement })` → `{ top, left }`
- `placement`: `'start' | 'end'`（既定 start。トリガーの下、インライン方向の揃え）
- 見た目: 窓の面（`--rd-color-surface-raised`、`--rd-radius-lg`、`--rd-elevation-2` の硬い影、`--rd-border-width-default` の罫）。項目は `min-block-size: var(--rd-sizing-target-min)`、
  `:hover` / `:focus-visible` は `--rd-color-surface-hover`（無ければ STOP）+ 左の太い縦罫（色だけに頼らない）。区切りは `<li role="separator">` = `2px dotted border.default`（brand.md §7.6）
- `:state()`: `open` / `unlabeled` / `malformed`

### `rd-popover`（ティア B、experimental）

- `rd-menu` と同じ契約の骨格（`trigger` + `[popover]`）だが、中身は自由（`raw: '$children'`）。`label` 必須（`<h3 slot="label">` を `[popover]` の先頭に置く契約）
- JS あり: `[popover]` に `role="dialog"` / `aria-labelledby`（label の id）。開いたら最初のフォーカス可能要素へ、閉じたらトリガーへ。Esc はネイティブ。**モーダルにしない**（モーダルは `rd-dialog`）
- 位置決め・見た目は menu と同じ `_shared/popover-anchor.ts` と `--rd-*` を共有。帯（`.rd-window-bar` 相当）は付けない（軽い重ね物）。「窓」の骨格が要る場合は `rd-dialog` か `rd-window`（017）
- `:state()`: `open` / `unlabeled` / `malformed`
- `rd-toggle` `{ open }` イベント（popover の `toggle` を写す。名前はネイティブと衝突しないよう `rd-` 接頭）

### `rd-tooltip`（ティア C、experimental）

- 使い方: `<rd-tooltip for="save-button">保存（⌘S）</rd-tooltip>`。`for` = 対象要素の id（同じ shadow scope 内。light DOM 前提）
- JS 無し: 何も出ない。**代替は利用側が `title` を書く**ことだが、部品が `firstUpdated` で対象に `title` が無ければ `console.warn`（error にはしない）。
  `.styles.ts` だけ（shadow 完結）。`:not(:defined)` で `display: none`（テキストが素で流れないように。ティア C の「無くても害が無い」）
- JS あり: 対象に `aria-describedby`（既存があれば追記）、`pointerenter` / `focusin` で開き、`pointerleave` / `focusout` / **Esc**（`document` の `keydown`）で閉じる。
  開くまで `--rd-tooltip-delay`（既定 `var(--rd-motion-duration-slow)`）待つ。**ツールチップ自体にポインタが乗っても閉じない**（1.4.13）。
  `popover="manual"`（あれば）で top layer、位置は `_shared/popover-anchor.ts`（`placement="block-start"` 既定、入らなければ `block-end`）
- 見た目: `--rd-color-text-default` の面（ink）に `--rd-color-text-inverse` の文字（**7:1 を検査**。無ければ `surface.raised` + 罫線に落とす）、`--rd-radius-md`、`font: var(--rd-type-small)`
- `role="tooltip"`。読み上げは `aria-describedby` に任せ、`aria-live` を書かない（ADR-0008 §6）
- `:state()`: `open` / `orphan`（`for` の対象が無い）

### `navigation.css`（CSS のみ）

すべて `@layer rd.components`。ARIA は**利用側の HTML**で書く（クラスは見た目だけ）。

| クラス | マークアップの約束 | 見た目 |
| --- | --- | --- |
| `.rd-breadcrumb` | `<nav class="rd-breadcrumb" aria-label="現在地"><ol><li><a href>…</a></li>…<li><a aria-current="page">…</a></li></ol></nav>` | 区切りは `li + li::before { content: '/' }`（`aria-hidden` 不要 — 生成コンテンツは読まれないことが多いが、保険で `speak: never` は使わない。**`content: '/' / ''`（代替テキスト構文）で空の代替**）。`[aria-current="page"]` は太字・下線なし |
| `.rd-pagination` | `<nav class="rd-pagination" aria-label="ページ"><ul><li><a href aria-label="前へ">‹</a></li><li><a href aria-current="page">1</a></li>…</ul></nav>` | ピルの並び（`gap: var(--rd-space-1)`）。各 `a` は `min-inline-size` / `min-block-size: var(--rd-sizing-target-min)`、`[aria-current="page"]` は `surface.raised` + 影 + 太字（radio-group の segmented と同じ見せ方） |
| `.rd-nav-rail` | `<nav class="rd-nav-rail" aria-label="主要"><ul><li><a href aria-current="page"><svg aria-hidden="true">…</svg><span>ホーム</span></a></li>…</ul></nav>` | 縦 1 列（`inline-size: var(--rd-space-16)`）、各項目は正方形の標的、文言は `.rd-visually-hidden` 相当（`span` を `clip-path` で隠す。**消さない**）、`[aria-current]` の**左に太い縦罫**と面色。参考画面の「点」は `li::before` の `--rd-space-1` の丸 + `[aria-current]` で `accent.default`（**位置と縦罫で示す**ので色だけではない） |
| `.rd-menubar` | `<nav class="rd-menubar" aria-label="メニュー"><ul><li><a href>ファイル</a></li>…</ul></nav>` または `<li><rd-menu>…</rd-menu></li>` | 帯（`chrome.default` の面、`chrome.text` の文字）。`.rd-window-bar` の直下に置くことを想定（`.rd-window > .rd-menubar` で上の角丸を 0）。`role="menubar"` は**付けない**（リンクの列で足りる） |
| `.rd-sidebar` | `<aside class="rd-sidebar">` + 中に `.rd-nav-rail` か縦のリスト | `inline-size: var(--rd-sidebar-inline-size, 16rem)`、`background: var(--rd-color-surface-sunken)`、`@container (inline-size < 40rem)` の親で `inline-size: var(--rd-space-16)`（文言を隠しレールに縮む）。**レイアウトの器**、開閉の JS は持たない |

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

```bash
bun install --frozen-lockfile && bun run build && bun run gen && bun run check && bun run test
```

全部 exit 0 を確認してから始める（落ちるなら STOP）。

### Step 1 — 共有の純関数（`feat(elements): add roving focus and anchor helpers`）

red: `_shared/roving-focus.test.ts`（`nextIndex(2, 5, 'ArrowRight', 'horizontal')` → 3、末尾で折り返す、`Home` → 0、`End` → 4、縦向きは ↑↓、関係ないキーは `undefined`）、
`_shared/popover-anchor.test.ts`（`computeAnchorStyle`: 下に入るなら `top = trigger.bottom`、入らなければ `trigger.top - popover.height`、`placement: 'end'` で右端を揃える、`viewport` からはみ出す `left` は 0 に丸める）。
green: 2 ファイル。`bun run test -- --project node library/elements/src/_shared`。

### Step 2 — `rd-tabs`（`feat(elements): add rd-tabs (experimental, tier B)`）

```bash
bun run scaffold:element tabs --pe B
```

red: contract test（`tabMarkup` / `panelMarkup` / `markup` の木、`label` 無しで `unlabeled`）、logic test（`computeTabsView`: 選択 index の決定順 hash → selected → 0、`aria-selected` / `tabindex` の配列、`variant` → states）、
browser test（`role` が付く、→ で次へ移りパネルが切り替わる、`click` で `location.hash` が変わらない、`rd-change` が出る、`variant="browser"` で `:state()` ではなく `[variant]` 属性で CSS が当たる）、
sr test（tablist / tab 1 of 3, selected / tabpanel が読まれる）。green: element（≤ 150 行）、`tabs.styles.ts`（枠）、`tabs.css`（`:not(:defined)` と `variant` の見た目は **light DOM の子に当たる**ので `.css` 側）、story 8 種 + `Browser` + `Vertical`。`bun run gen`。

### Step 3 — `rd-menu`（`feat(elements): add rd-menu (experimental, tier B)`）

red: contract test（`menuItemMarkup` の a / button 分岐、`popovertarget` と `id` が一致）、logic test（`computeMenuView`: 開閉 → `aria-expanded`、items → `role` / `tabindex`、disabled → `aria-disabled`）、
browser test（`popovertarget` で開く、開いたら最初の項目にフォーカス、↓ で次へ、Esc で閉じてトリガーへ戻る、項目 click で閉じて `rd-select` が出る、**`rd-select` 要素の `change` イベントと名前が衝突しない**ことを 1 ケース）、
sr test（`menu` / `menuitem` が読まれる）。green: element、`menu.styles.ts`、`menu.css`（`:not(:defined) [popover] { display: block }` と光の当て方）、story 8 種 + `Placement` + `WithSeparator`。`bun run gen`。

### Step 4 — `rd-popover`（`feat(elements): add rd-popover (experimental, tier B)`）

red / green は menu と同じ粒度。browser test に「開いたら最初のフォーカス可能要素へ」「`role="dialog"` と `aria-labelledby`」「`rd-toggle` が出る」。story 8 種 + `WithForm`（中に `rd-text-field` を置く）。`bun run gen`。

### Step 5 — `rd-tooltip`（`feat(elements): add rd-tooltip (experimental, tier C)`）

```bash
bun run scaffold:element tooltip --pe C
```

red: logic test（`computeTooltipView`: `open` / `orphan`、delay の決定）、browser test（`focusin` で開く、`pointerenter` → delay 後に開く（fake timers）、Esc で閉じる、対象に `aria-describedby` が付く、
ツールチップ自体に `pointerenter` しても閉じない、`for` の対象が無いと `:state(orphan)` と `console.warn`）、sr test（対象にフォーカスすると説明として読まれる）。
green: element、`tooltip.styles.ts`、story 8 種 + `OnIconButton`（`.rd-icon-button` に付ける）。`bun run gen`。

### Step 6 — `navigation.css`（`feat(css): add navigation patterns (breadcrumb, pagination, nav-rail, menubar, sidebar)`）

red: `system/css/test/navigation.test.ts`（5 クラスが在る、`build.ts` の ORDER に `navigation` が `atoms` の直後に在る、`dist/index.css` に `.rd-breadcrumb` が在る、`linear-gradient` を含まない、`forced-colors` ブロックに `Highlight` が在る、`--rd-color-palette-` を含まない）。
green: ファイル、ORDER、`package.json` exports、README の 1 行。`bun run check`（stylelint）。

### Step 7 — 露出と検証面（`feat(elements): export tabs, menu, popover and tooltip from experimental` / `test(e2e): cover navigation and overlays`）

- `exports`（B は 4 ブロック × 3、C は 3 ブロック）、`src/experimental/*/index.ts`
- `e2e/pe/build-pages.ts` に `tabs.html` / `menu.html` / `popover.html` / `navigation.html`（5 クラスを 1 ページに）。`tier-b.spec.ts` に「JS 無しで内容が見える（すべてのパネル・メニュー項目）」、
  `tier-c.spec.ts` に「`rd-tooltip` は JS 無しで何も描かない」。`axe.spec.ts` が全ページを回ることを確認
- `e2e/frameworks/shared.ts` に `tabsMarkup` / `menuMarkup`（tooltip は属性だけなので不要）
- `.size-limit.json` に 4 部品の `define`（各 12 KB）
- `tools/mcp/src/examples.ts` に 4 部品と `navigation.css` の例
- `docs/proposals/{tabs,menu,popover,tooltip}.md`（`docs/proposals/meter.md` と同じ見出し）
- `docs/baseline.md` の `popover` 行を「rd-menu / rd-popover / rd-tooltip（plan 020）」に

```bash
bun run build && bun run gen && bun run pe && bun run e2e:frameworks
```

### Step 8 — VRT（`test(vrt): baselines for tabs, menu, popover, tooltip and navigation`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'Tabs|Menu|Popover|Tooltip'
bash scripts/vrt.sh
bun run a11y
```

新規の画像だけが増えること。`navigation.css` の story は `apps/storybook` を触れないので **無し**（advisor が後で `Patterns/Navigation` を足す）。

### Step 9 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD
```

changeset（minor、`@rimltempest/riml-ds-elements`: 「experimental に rd-tabs / rd-menu / rd-popover / rd-tooltip」、`@rimltempest/riml-ds-css`: 「navigation.css」）。

## 完了条件（機械で検査できるもの）

- `bun run gen` 後 `grep -c '"rd-tabs"\|"rd-menu"\|"rd-popover"\|"rd-tooltip"' tools/cem/registry.json` ≥ 4。tabs / menu / popover は `"pe": "B"`、tooltip は `"pe": "C"`、全部 `"status": "experimental"`
- `bun run pe` exit 0（`tabs.html` / `menu.html` / `popover.html` で JS 無しに内容が見える。`navigation.html` が axe AAA を通る）
- `bun run e2e:frameworks` exit 0
- `bun run test` exit 0（新規 story 全部で AAA の axe が通る。tooltip の `Default` は開いた状態で撮る story を 1 つ含む）
- `bash scripts/vrt.sh` exit 0
- `wc -l library/elements/src/{tabs,menu,popover,tooltip}/*.element.ts` それぞれ ≤ 150
- `grep -c 'aria-live' library/elements/src/{tabs,menu,popover,tooltip}/*.ts` = 0
- `grep -c 'linear-gradient\|radial-gradient' system/css/src/navigation.css library/elements/src/{tabs,menu,popover}/*.css library/elements/src/{tabs,menu,popover,tooltip}/*.styles.ts` = 0
- `system/css/dist/index.css` に `.rd-breadcrumb` `.rd-pagination` `.rd-nav-rail` `.rd-menubar` `.rd-sidebar` がすべて在る
- `bun run release:check` exit 0、`bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- 必要なトークンが無い（`--rd-color-surface-hover` / `--rd-color-text-inverse` / `--rd-elevation-2` / `--rd-border-width-thick` / `--rd-space-16`）→ 名前と用途を書いて STOP。
  `--rd-border-width-thick` だけは `calc(var(--rd-border-width-default) * 2)` で代用してよい
- tooltip の ink 面の文字が 7:1 に届かない → `surface.raised` + 罫線に落として報告（STOP ではない）
- `checkContract` が `items`（複数一致）を扱えない → 019 と同じ扱い（`required` から外して element 側で `querySelectorAll`）。無理なら STOP
- ラッパー生成器が `popovertarget` 属性や `slot` 付きの `rd-button` 入れ子を扱えない → STOP（`tools/cem/src` は触らない）
- Vitest browser（Chromium）で `popover` の `toggle` イベントが取れない → `beforetoggle` で代用して報告
- `rd-select` イベント名が既存のテストや registry と衝突する → イベント名を `rd-pick` に変えて報告（契約は変えない）
- size-limit を 2 KB 以上超える → STOP

## スコープ外

- Navigation Menu（メガメニュー）、Command palette、Context Menu（右クリック。`rd-menu` を `contextmenu` で開くのは次の wave）、Drawer / Sheet（`rd-dialog` の `placement` として 021）、Alert Dialog（`rd-dialog` の `role="alertdialog"` として 021）、Hover Card（tooltip の富文言版。要るまで作らない）
- Storybook の Patterns story（advisor）
- モバイルのボトムナビ（`.rd-nav-rail` を横に倒す `@container` は 021 で判断）

## 保守メモ

- `popover` と anchor positioning は Newly。**両方無い**ブラウザでは menu / popover は「常に見えるリスト」（B の約束）、tooltip は出ない（C の約束）。テストは Chromium なので Firefox / Safari の縮退は VRT に無い
- `rd-menu` の項目は light DOM のリンク / ボタン。フレームワークのルーターがリンクを横取りする場合（React Router 等）、`click` を `preventDefault` しないこと（menu は `hidePopover()` だけする）
- `rd-tabs` は `location.hash` を**読むだけ**で書かない（履歴を汚さない）。ディープリンクで開くには利用側が `selected` を書く
- `navigation.css` の ARIA は利用側の責務。`e2e/pe/pages/navigation.html` が「正しいマークアップの見本」なので、`docs/` に転記するときはこのファイルから
