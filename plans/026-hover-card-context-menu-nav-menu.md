# 026: Hover Card（`rd-popover hover`）、Context Menu（`rd-menu context`）、Navigation Menu（`.rd-nav-menu` + Patterns/Navigation story）

**優先度**: P1　**規模**: M　**依存**: 024（マージ済み `fb0c2c2`。`rd-menu` の閉じたメニューの `display` 修正）
**レーン**: `feat/hover-context-nav`　**計画時の main**: `7684d09`（024 マージ後。**025（`feat/combobox`）と並行** — `library/elements/src/combobox` には触らない）

> **Drift check（最初に実行）**:
> `wc -l library/elements/src/menu/menu.element.ts library/elements/src/popover/popover.element.ts` が **148 / 116** であること。
> `grep -c 'hover\|context' library/elements/src/popover/popover.element.ts library/elements/src/menu/menu.element.ts` がどちらも **0** であること。
> `grep -c 'rd-nav-menu' system/css/src/navigation.css` = **0**、`test -f apps/storybook/stories/Patterns/navigation.stories.ts && echo EXISTS` が何も出ないこと。
> `grep -B2 'display: grid' library/elements/src/menu/menu.css | grep -c popover-open` = **1**（024 が入っている）。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Hover Card** / **Context Menu** / **Navigation Menu** に当たるものが無い。3 つとも**新しい部品にせず**、既にある `rd-popover` / `rd-menu` / `navigation.css` に足す
（部品の数を増やすほど保守が重い。ADR-0012 §6「JS が要らないものは部品にしない」）。

1. **Hover Card = `rd-popover` に `hover` 属性**。トリガーに乗せる / フォーカスすると少し遅れて開き、離れると少し遅れて閉じる。**押して開く経路（`popovertarget`）は残す**——
   ホバーは近道で、キーボード・タッチ・JS 無しでは今までどおり押して開く。中身はリンクや文章（プロフィールの下見など）。**`hover` のときも `role="dialog"`** のまま
   （tooltip ではない: 中に押せるものが入る）
2. **Context Menu = `rd-menu` に `context` 属性**。`rd-menu` の**中の面（`[slot="trigger"]` の領域）で右クリック**（`contextmenu` イベント: 右クリック・長押し・Shift+F10 / Menu キー）すると
   **ポインタの位置に**メニューが開く。**トリガーの `<button popovertarget>` は必ず残す**——右クリックは近道で、目に見えるボタンが唯一の保証された入口
   （APG: コンテキストメニューには常に見える代替を用意する）。JS 無しではボタンだけが働く（右クリックはブラウザ既定）
3. **Navigation Menu = `.rd-nav-menu`（CSS だけ）**。横一列のリンクの帯で、項目の一部が `rd-menu` の落ちるメニューになる（`.rd-menubar` は窓の帯用で色が chrome。`.rd-nav-menu` はページの主要ナビ用で面が
   surface）。現在地は `aria-current="page"` を太字 + 下の縦罫で示す。**部品にしない**（開閉は `rd-menu` が持つ）。
   合わせて **`Patterns/Navigation` story** を新設し、`.rd-breadcrumb` / `.rd-pagination` / `.rd-nav-rail` / `.rd-menubar` / `.rd-sidebar` / `.rd-nav-menu` の見本を 1 か所に置く（今まで Storybook に無かった。VRT と a11y の面になる）

守る不変条件:

- **既存の挙動を変えない**: `hover` / `context` を付けないときの `rd-popover` / `rd-menu` は 1 バイトも動きが変わらない。**既存の VRT 画像に差分が出たら STOP**
- **AAA**。色は semantic トークンだけ。**`outline: none` / `0` を書かない**。**グラデーションを描かない**
- `*.element.ts` ≤ 150 行、`if` ≤ 5 → **`menu.element.ts` は 148 行**なので、**先に `#wire` の購読と `#onSelect` の解決を `menu.dom.ts` に出して行数を空ける**（挙動を変えない refactor を独立コミットにする）。`popover.element.ts` は 116 行なので余地がある
- `.size-limit.json` の既存予算（menu / popover 12 KB）を**上げない**（超えたら STOP）
- `_shared/**` を変えない

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/tooltip/tooltip.element.ts`**（`pointerenter` / `pointerleave` / `focusin` / `focusout` と `setTimeout` の持ち方・`disconnectedCallback` の `clearTimeout`）、
  **`apps/storybook/stories/Patterns/atoms.stories.ts`**（Patterns story の形。自作の幾何アイコン、a11y の除外なし、空要素に HTML コメント）
- `any` / `as` / `!` / `class` / `enum` を書かない。**失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**（`hover` / `context` は `static properties` に足すので CEM と 4 ラッパーの props が変わる）
- CSS の単位: `px` は罫線・アウトラインだけ。`@layer rd.components`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/hover-context-nav`）: `library/elements/src/menu/**`、`library/elements/src/popover/**`、`library/elements/custom-elements.json`、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`tools/cem/registry.json`、`system/css/src/navigation.css`、`system/css/test/**`、`system/css/README.md`（`.rd-nav-menu` の 1 節）、
  `apps/storybook/stories/Patterns/navigation.stories.ts`（新設）、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`docs/proposals/{hover-card,context-menu}.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/` の menu / popover 以外、`library/elements/package.json`、`system/css/src/` の navigation.css 以外、`system/tokens/**`、
  `tools/cem/src/**`、`tools/mcp/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 025** が `library/elements/src/combobox/**`、`library/elements/package.json`、`tools/mcp/**`、`e2e/**` を触る。`e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `axe.spec.ts` / `e2e/frameworks/**` /
  `e2e/*/src/**` は**両レーンが足す**ので、`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。生成物のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/popover/popover.element.ts`（116 行）の購読と開閉:

```ts
  static override properties: PropertyDeclarations = { placement: { reflect: true } }
  …
  #wire = (): void => {
    …
    panel.id = panel.id === '' ? this.#name : panel.id
    trigger.setAttribute('popovertarget', trigger.getAttribute('popovertarget') ?? panel.id)
    panel.addEventListener('toggle', this.#onToggle)
  }
  …
  /** 開いたら中の最初の行き先へ、閉じたらトリガーへ（Esc はネイティブが閉じる） */
  #onToggle = (event: Event): void => {
    this.#open = opened(event)
    this.requestUpdate()
    ;(this.#open ? entryPoint(this.#panel()) : this.#trigger())?.focus()
    …
  }
```

`library/elements/src/menu/menu.element.ts`（148 行）: `static properties = { placement: { reflect: true }, label: {} }`、`#wire` が `list.id` / `trigger.id` / `popovertarget` を結び
`toggle` / `keydown` / `click` を購読、`updated()` が `anchorPopover(trigger, list, this.#name, { placement })` を毎回呼ぶ、`#onSelect` が `closest(CLICKABLE)` で項目を解決する。
`menu.dom.ts` には `applyAttrs` / `opened` / `asElement` だけ。

`_shared/popover-anchor.ts` の `anchorPopover`: 同じ木で anchor positioning が使えるとトリガーに `anchor-name`、重ね物に `position-anchor` を書く。**使えないときだけ** `top` / `left` を書く。
`menu.css` の `@supports (position-area: block-end)` ブロックが `rd-menu [popover] { position-area: …; position-try-fallbacks: flip-block }` を書いている。
→ **ポインタ位置に出すには `position-anchor` を外し `top` / `left` を書く**必要がある（`position-anchor` が無ければ `position-area` は効かず inline の `top` / `left` が生きる）。

`tooltip.element.ts` の遅延の持ち方（写す）:

```ts
  #timer: ReturnType<typeof setTimeout> | undefined = undefined
  …
  override disconnectedCallback(): void { super.disconnectedCallback(); …; clearTimeout(this.#timer) }
  …
    target.addEventListener('pointerenter', this.#delayedShow)
    target.addEventListener('pointerleave', this.#hide)
    target.addEventListener('focusin', this.#show)
    target.addEventListener('focusout', this.#hide)
```

`system/css/src/navigation.css` の `.rd-menubar`（行 156〜190。`--rd-color-chrome-*` の帯。`.rd-nav-menu` はこれを**写して色を surface に**する）。
`.rd-nav-rail [aria-current]` は「点の色 + 左の縦罫 + 面」の 3 つで現在地を示す（`.rd-nav-menu` は「太字 + 下の縦罫」）。

## 設計（決めてある。変えるなら STOP）

### 1. `rd-popover hover`

- `static properties = { placement: { reflect: true }, hover: { type: Boolean, reflect: true } }`、`declare hover: boolean`、constructor `false`
- `popover.logic.ts` に純関数 `hoverTimings = { open: 300, close: 200 } as const`（ms。`--rd-motion-duration-*` はトークンにあるが JS からは読まない。**数字はここ 1 か所**）と
  `shouldCloseOnLeave(next: EventTarget | null, panel: Element | undefined, trigger: Element | undefined): boolean`（`relatedTarget` がトリガーか中身の中なら閉じない）
- `firstUpdated` の `#wire` の後、`this.hover` なら **トリガーと `[popover]` の両方**に `pointerenter` → `#delayedOpen`、`pointerleave` → `#delayedClose`、
  トリガーに `focusin` → `#openNow`、`[popover]` と トリガーに `focusout` → `shouldCloseOnLeave` なら `#delayedClose`。`hover` が後から変わる場合は扱わない（JSDoc に「初期化時だけ」と書く）
- `#delayedOpen`: `clearTimeout` → `setTimeout(() => panel.showPopover(), hoverTimings.open)`（`matches(':popover-open')` なら何もしない）。`#delayedClose` は `hidePopover()` を `close` ms 後
- **開いた先へフォーカスを移さない**（`hover` で開いたときは `#onToggle` の `entryPoint().focus()` を**しない**——読み中の人のフォーカスを奪わない。`popovertarget` で押して開いたときは今までどおり移す）。
  区別は `#openedByHover` フラグ（`#delayedOpen` が立て、`#onToggle` が読んで消す）
- `Escape` はネイティブ（`popover="auto"` の light dismiss）が閉じる。`hover` でも `popover` の値は変えない
- `@media (hover: none)`（タッチ）では `pointerenter` が発火しないか押下と同時に来る——**何もしない**（押して開く経路がある）。テストでは `hover` 属性があっても `click` で開くことを見る
- 状態は増やさない。JSDoc に `@attr hover - トリガーに乗せる / フォーカスすると遅れて開く（Hover Card）。押して開く経路は残る`
- CSS: `popover.css` は**変えない**（見た目は同じ）
- story: `Hover`（`play`: `userEvent.hover(trigger)` → 350ms 待つ → 開いている）。**既存 story は変えない**

### 2. `rd-menu context`

- 先に refactor（挙動不変）: `menu.dom.ts` に `wireIds(list, trigger, name)`（id と `popovertarget` を結ぶ）と `resolveItem(event, items)`（`closest(CLICKABLE)` → index）を出し、`menu.element.ts` を **≤ 135 行**に
- `static properties` に `context: { type: Boolean, reflect: true }`、`declare context: boolean`、constructor `false`
- `menu.logic.ts` に `contextPosition(point: { x: number; y: number }, popover: SizeLike, viewport: SizeLike): { top: number; left: number }`
  （ポインタの右下に出す。入らなければ左 / 上に倒す。`_shared/popover-anchor.ts` の `computeAnchorStyle` を**幅 0 高 0 のトリガー矩形**で呼ぶだけ——新しい算術を書かない）
- `firstUpdated`: `this.context` なら `this.addEventListener('contextmenu', this.#onContextMenu)`（**host に付ける**: `[slot="trigger"]` の領域＝light DOM の子全体が対象）
- `#onContextMenu(event: MouseEvent)`: `event.preventDefault()` → `#pointer = { x: event.clientX, y: event.clientY }`（キーボード発火は `clientX === 0 && clientY === 0` → `undefined` にしてトリガーに anchor）→ `list.showPopover()`
- `updated()` の位置決め: `#pointer !== undefined` なら `list.style.removeProperty('position-anchor')` + `top` / `left` を `contextPosition` から書く（**`anchorPopover` を呼ばない**）、
  `undefined` なら今までどおり `anchorPopover`。閉じたら（`#onToggle` の `open === false`）`#pointer = undefined` と `top` / `left` を消す
- Esc / 項目選択で閉じる・矢印移動・`rd-select` は今までどおり（**触らない**）
- JSDoc に `@attr context - 中の面で右クリック（contextmenu）するとポインタの位置に開く（Context Menu）。トリガーのボタンは残す`
- CSS: `menu.css` に `rd-menu[context] > [slot='trigger'] { display: block }`（領域が inline のボタンだけだと右クリックの面が無い。既定の見え方は変えない）
- story: `Context`（`[slot="trigger"]` を `.rd-card` の面 + 右上に `rd-icon-button`「⋯」（`popovertarget`）にし、`play`: `userEvent.pointer({ keys: '[MouseRight]', target: card })` → 開く）。**既存 story は変えない**

### 3. `.rd-nav-menu`（`navigation.css`）

```css
  /* 主要ナビの帯。横一列のリンクで、落ちるメニューが要る項目は `rd-menu` を入れる。
     現在地は太字 + 下の縦罫（色だけに頼らない）。窓の帯（.rd-menubar）とは色が違う（面は surface）。
     <nav class="rd-nav-menu" aria-label="主要">
       <ul>
         <li><a href="/" aria-current="page">ホーム</a></li>
         <li><rd-menu label="作る"><rd-button slot="trigger" variant="ghost"><button …>作る</button></rd-button><div popover>…</div></rd-menu></li>
       </ul>
     </nav> */
  .rd-nav-menu { background: var(--rd-color-surface-default); color: var(--rd-color-text-default); border-block-end: var(--rd-border-width-default) solid var(--rd-color-border-subtle); }
  .rd-nav-menu > ul { display: flex; flex-wrap: wrap; gap: var(--rd-space-1); margin: 0; padding-inline: var(--rd-space-2); list-style: none; font: var(--rd-type-body); }
  .rd-nav-menu a { display: flex; align-items: center; min-block-size: var(--rd-sizing-target-min); padding-inline: var(--rd-space-3); border-radius: var(--rd-radius-md); color: inherit; text-decoration: none; }
  .rd-nav-menu a:hover  → background: var(--rd-color-surface-hover)（@media (hover: hover)）
  .rd-nav-menu a:focus-visible → outline（focus-ring）
  .rd-nav-menu [aria-current] { font-weight: var(--rd-font-weight-bold); box-shadow: inset 0 calc(-1 * var(--rd-space-1)) 0 var(--rd-color-accent-default); }
  @media (width < 48rem) → `ul` は横スクロール（`overflow-x: auto; flex-wrap: nowrap; scroll-snap-type: x proximity`）
  forced-colors → [aria-current] は `text-decoration: underline`（縦罫は消える）
```

`system/css/test/**` に既存の「クラス一覧」テストがあれば `.rd-nav-menu` を足す。`system/css/README.md` に 1 節。

### 4. `Patterns/Navigation` story（`apps/storybook/stories/Patterns/navigation.stories.ts`）

`title: 'Patterns/Navigation'`。story: `Breadcrumb` / `Pagination` / `NavRail` / `Menubar` / `NavMenu`（`rd-menu` 入り。`play` 無し＝閉じたまま）/ `Sidebar`（`.rd-sidebar` + `.rd-nav-rail`）/ `Dark`（NavMenu）/ `ForcedColors`（NavMenu）/ `RTL`（Breadcrumb + NavMenu）。
`rd-menu` / `rd-button` の define を import する（`library/elements/src/menu/menu.stories.ts` が何を import しているか見て揃える）。a11y の除外なし。

### 5. 露出と検証

- `e2e/pe/build-pages.ts` に `'hover-card.html'`（`rd-popover hover`）と `'context-menu.html'`（`rd-menu context`）、`'nav-menu.html'`（`.rd-nav-menu` + `rd-menu`）。
  `tier-a.spec.ts`（既存の menu / popover のテストの隣。JS 無しで `popovertarget` で開く、JS 有りで hover → 開く / 右クリック → 開く）、`axe.spec.ts` に載せる
- `e2e/frameworks/shared.ts` の既存 `navigationSuite` に **足さない**（ラッパーの Boolean 属性が出ることは `bun run gen` の型で見える）。代わりに `library/react/test/**` は触らない（025 が触る）
- VRT: 新画像だけ（`Popover/Hover`、`Menu/Context`、`Patterns/Navigation` の全 story）。**既存に `M` が出たら STOP**

### 6. proposal と changeset

`docs/proposals/hover-card.md`（なぜ `rd-popover` の属性か / 遅延の値 / フォーカスを奪わない理由 / タッチでの振る舞い）、`docs/proposals/context-menu.md`（なぜ `rd-menu` の属性か / 見えるボタンを残す理由 / キーボード発火時の位置）。
changeset: `@rimltempest/riml-ds-elements` **minor**（`hover` / `context`）、`@rimltempest/riml-ds-css` **minor**（`.rd-nav-menu`）。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/hover-context-nav`。`bun install --frozen-lockfile` → `git checkout bun.lock`。**`bun run build`**。Drift check。`bun run test` 緑。

### Step 1 — `rd-menu` の refactor（`refactor(elements): move rd-menu wiring and item resolution into menu.dom.ts`）

`menu.dom.ts` に `wireIds` / `resolveItem` の node テストを先に（`menu.dom.test.ts`。jsdom ではなく browser project でよい）→ 移す → `bun run test -- library/elements/src/menu` 全緑、`wc -l menu.element.ts` ≤ 135。VRT は不要（見た目不変）。

### Step 2 — `rd-popover hover`（`feat(elements): open rd-popover on hover and focus with the hover attribute`）

red: `popover.logic.test.ts`（`shouldCloseOnLeave`）、`popover.test.ts`（`hover` で `pointerenter` → 350ms 後に `:state(open)`、`pointerleave` → 250ms 後に閉じる、`focusin` で即開く、開いてもフォーカスはトリガーに残る、
`hover` 無しでは `pointerenter` で開かない、`hover` でも `click` で開く）。green: element。story `Hover`。`bun run build && bun run gen`。

### Step 3 — `rd-menu context`（`feat(elements): open rd-menu at the pointer with the context attribute`）

red: `menu.logic.test.ts`（`contextPosition` が右下に出し、端では倒れる）、`menu.test.ts`（`context` で `contextmenu` → 開く + `top` / `left` が書かれ `position-anchor` が無い、閉じると消える、
`clientX/Y = 0` はトリガーに anchor、`context` 無しでは `contextmenu` で開かない、既存のボタンで開く経路は変わらない）。green: element + `menu.css` 1 ルール。story `Context`。`bun run build && bun run gen`。

### Step 4 — `.rd-nav-menu` と Patterns story（`feat(css): add .rd-nav-menu and a Patterns/Navigation story`）

`system/css/test` に red（クラス一覧 / stylelint）→ CSS → story → `bun run test -- --project storybook apps/storybook`（a11y）→ `bun run render && bun run lint:html`。

### Step 5 — 露出・VRT・仕上げ（`test(e2e): cover hover card, context menu and nav menu` / `test(vrt): baselines …` / `docs(proposals): …`）

§5 → `bun run pe`。`bun run storybook:build && bash scripts/vrt.sh --update-snapshots --grep 'Popover|Menu|Navigation'` → **`git status --short e2e/__screenshots__` に `M` が無い**ことを確認。§6。
`bun run check`、`bun run test`、`bun run pe`、`bun run e2e:frameworks`、`bun run a11y`、`bash scripts/vrt.sh`、`bun run release:check`、`bash scripts/guard.sh`。

## 完了条件（機械で検査できるもの）

- `wc -l library/elements/src/menu/menu.element.ts` ≤ 150（refactor 後 ≤ 135 + 追加）、`popover.element.ts` ≤ 150
- `grep -c '"name": "hover"' library/elements/custom-elements.json` ≥ 1、`grep -c '"name": "context"' …` ≥ 1（attributes として出ている）、生成ラッパー（react の `popover.tsx` / `menu.tsx`）に `hover?: boolean` / `context?: boolean`
- `grep -c 'rd-nav-menu' system/css/src/navigation.css` ≥ 6、`grep -c 'linear-gradient\|outline: none\|outline-width: 0' system/css/src/navigation.css library/elements/src/menu/menu.css library/elements/src/popover/popover.css` = 0
- `test -f apps/storybook/stories/Patterns/navigation.stories.ts`、story 9 種
- `git diff --diff-filter=M --name-only main -- e2e/__screenshots__ | wc -l` = **0**
- `bun run test` / `bun run pe` / `bun run e2e:frameworks` / `bun run a11y` / `bash scripts/vrt.sh` / `bun run render && bun run lint:html` / `bun run release:check` / `bash scripts/guard.sh` すべて exit 0
- size-limit の menu / popover の行を変えていない（`git diff main -- .size-limit.json` が空）

## STOP する条件（改善せず報告する）

- refactor で `menu.element.ts` が 135 行に収まらない、または既存テストが落ちる
- `position-anchor` を外しても `position-area` が inline の `top` / `left` を上書きする（Chromium で確認）
- `hover` の `showPopover()` がフォーカスを動かす（読み中のフォーカスが奪われる）
- 既存 VRT 画像に差分
- size-limit を超える
- `git merge main` で e2e / 生成物以外がコンフリクト

## スコープ外

- Hover Card の内容の遅延読み込み、Context Menu のサブメニュー、Navigation Menu の巨大パネル（mega menu）
- `.rd-menubar` に `rd-menu` を入れた APG メニューバー（キーボードで隣のメニューへ移る）
- `rd-tooltip` との統合

## 保守メモ

- `hover` / `context` は**初期化時にだけ**読む（後から属性を切り替えても購読は変わらない）。動的に変えたいなら再マウントする
- ポインタ位置の `top` / `left` は `#pointer` がある間だけ。閉じると消して `anchorPopover` に戻る——`resize` / `scroll` には追随しない（`_shared/popover-anchor.ts` と同じ判断）
- `.rd-nav-menu` の中の `rd-menu` は `placement="start"` のまま（帯の左端に揃う）。右端の項目は利用側が `placement="end"` を付ける
