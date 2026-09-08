# 032: `rd-carousel` — scroll-snap の列に前へ／次へと「n / N」を足す（`<ul><li>` を包むティア A）

**優先度**: P2　**規模**: M　**依存**: 020（`.rd-carousel` の CSS atom — 見た目の出どころ）、023（raw slot 付きラッパーの生成）
**レーン**: `feat/carousel`　**計画時の main**: `__MAIN_SHA__`（028・029・030 マージ後。**031（`feat/toggle-group`）・033（`feat/calendar`）と並行** — `system/**` / `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/carousel && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c '\.rd-carousel {' system/css/src/atoms.css` = 1、`grep -c 'scroll-snap-type: x mandatory' system/css/src/atoms.css` ≥ 1。
> `grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1、`grep -c 'export const usesJapaneseCopy' library/elements/src/_shared/lang.ts` = 1。
> `grep -c "{ raw: '\$children' }" library/elements/src/window/window.contract.ts` = 1（raw の既定 slot が生成器で動いている手本）。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Carousel** に当たる部品が CSS atom（`.rd-carousel` — 横スクロール + scroll-snap）だけで、前へ／次へのボタン・
「いま何枚目か」・スライドの読み上げ（`aria-roledescription="slide"` と「2 / 5」）が無い。利用側はスクロールバーを
つかむか横スクロールするしかなく、ポインタが無い環境・スクリーンリーダーでは枚数も位置も分からない。

`rd-carousel` は既存の atom と同じ HTML（`<ul><li>`）を包み、JS があるときだけ

1. 前へ／次へのボタン（`[part='prev']` / `[part='next']`）と「n / N」（`<output part="counter">`）を**末尾に足す**
2. 各 `<li>` に `role="group"` `aria-roledescription="slide"` `aria-label="n / N"` を付ける
3. 見えているスライドを `IntersectionObserver` で追い、`rd-change { index }` を投げる

をする。JS が無いときは**今までどおり横スクロールできる列**（ティア A: 動く ≠ 同じ見た目）。
**自動再生は作らない**（WCAG 2.2.2 / AAA 2.3.3。proposal に書く）。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/slider/**`**（ティア A で強化ノード（`<div part="track">`）を `render()` が末尾に足す形、`OBSERVED` の `MutationObserver`）、
  **`library/elements/src/tabs/**`**（`label` 属性が無いときの `unlabeled`）、**`library/elements/src/combobox/combobox.dom.ts`**（DOM 操作を `*.dom.ts` に出す形）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- **ラッパーの props は契約の `tree.attrs` から作られる**。`label` / `loop` は `attrs` に入れる（`loop` は `{ type: Boolean }` にすると React で `boolean` 型になる — `rd-window` の `closable` と同じ）
- `bun run scaffold:element carousel --pe A` で骨格を作る（`carousel.contract.test.ts` も生成される。雛形の期待値は自分の契約に合わせて直す）
- `library/elements/package.json` の `exports` に `./experimental/carousel{,/contract,/define,/style.css}` の 4 ブロックを **`./experimental/button/style.css` … の並びの中でアルファベット順**（`./experimental/checkbox` の直前）に
- story は 8 種（Default（5 枚の `.rd-card`）/ Variants → **Loop**（`loop` あり）に読み替える / Disabled → **Single**（1 枚。ボタンと counter が隠れる）に読み替える / Invalid → **Wide**（`--rd-carousel-item: 100%` で 1 枚ずつ）に読み替える / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Next`（`play` で「次へ」を押し、counter が「2 / 5」になる）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/carousel`）: `library/elements/src/carousel/**`（新規）、`library/elements/src/experimental/carousel/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/carousel.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`system/**`（`.rd-carousel` atom はそのまま残す）、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 031 / 033** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `tier-b.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。
  生成物（`custom-elements.json` / `registry.json` / generated）のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`system/css/src/atoms.css`（見た目の出どころ。**この値を `carousel.css` に写す**。atom は残す）:

```css
  .rd-carousel {
    overflow-x: auto;
    padding-block-end: var(--rd-space-2);
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
  }

  .rd-carousel-track {
    display: flex;
    gap: var(--rd-space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* 1 枚の幅は --rd-carousel-item。画面より広くならない */
  .rd-carousel-item {
    flex: 0 0 var(--rd-carousel-item, min(100%, 20rem));
    scroll-snap-align: start;
  }
```

`library/elements/src/slider/slider.element.ts`（強化ノードを `render()` で末尾に足すティア A の形。`@csspart` の書き方も倣う）:

```ts
 * @csspart track - 塗りのトラック（装飾。aria-hidden）
 * @csspart fill - トラックの塗り
 …
export class RdSlider extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    unit: {},
    orientation: { reflect: true },
  }
```

`library/elements/src/window/window.contract.ts`（raw の既定 slot。ラッパーは `children` を受ける）:

```ts
    children: [
      { tag: 'h2', slot: 'title', children: [{ prop: 'title' }] },
      // children は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す（renderMarkup はエスケープしない）
      { raw: '$children' },
    ],
```

`library/elements/src/_shared/lang.ts` の `usesJapaneseCopy(host)`（`lang` を辿り、日本語なら `true`。ボタンの文言「前へ」/「次へ」と "Previous" / "Next" の切替に使う）。

**ブラウザ対応の事実（設計の根拠）**: `scrollend` は Safari 26.2 以降だけ、`scrollsnapchange` は Chromium だけ。**どちらも使わず `IntersectionObserver`**（全エンジン）で見えている枚を決める。

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`carousel.contract.ts`）

```ts
export const ITEM_SELECTOR = ':scope > ul > li'

export const contract = {
  pe: 'A',
  roles: {
    track: ':scope > ul',
    // 1 枚以上。`checkContract` は最初の 1 個で判定する
    item: ITEM_SELECTOR,
  },
  required: ['track', 'item'],
  tree: {
    tag: 'rd-carousel',
    attrs: { label: '$label', loop: '$loop' },
    children: [
      // スライドは生 HTML。利用側が `<li>…</li>` を並べて渡す（`carouselItemMarkup` で組める）
      { tag: 'ul', children: [{ raw: '$children' }] },
    ],
  },
} as const satisfies Contract
```

- `carouselItemMarkup({ children })` → `<li>…</li>`（`children` はエスケープされない。`.rd-card` などを入れる）。
- `label`（**必須**）: 列のアクセシブル名。element が `ElementInternals` に `role = 'group'`、`ariaRoleDescription = 'carousel'`、`ariaLabel = label` を書く
  （`internals.role` / `ariaLabel` / `ariaRoleDescription` は全エンジンにある。無ければ `unlabeled` + `console.error('[rd-carousel] label が必要')`）。
- `loop`（boolean）: 末尾で「次へ」を押すと先頭へ、先頭で「前へ」を押すと末尾へ。無ければ端でボタンが `aria-disabled="true"`（フォーカス可能のまま。skill §4）。
- 契約が満たされないときは `malformed`。強化ノードは足さない。

### 2. 純関数（`carousel.logic.ts`）

```ts
export type Direction = -1 | 1
/** 端の判断。loop なら折り返す。count ≤ 0 なら undefined */
export const targetIndex = (current: number, count: number, direction: Direction, loop: boolean): number | undefined
/** 「n / N」。index は 0 始まり、表示は 1 始まり */
export const counterText = (index: number, count: number): string   // `${index + 1} / ${count}`
/** IntersectionObserver の結果から「いま見えている枚」を 1 つ決める。交差比が最大の要素（同率なら先頭） */
export const pickVisible = (entries: readonly { readonly index: number; readonly ratio: number }[], fallback: number): number
export const buttonCopy = (japanese: boolean): { readonly prev: string; readonly next: string }   // 「前へ」「次へ」 / "Previous" "Next"
export const computeStates = (input: { count: number; index: number; loop: boolean; unlabeled: boolean; malformed: boolean }): ReadonlySet<string>
// malformed → {'malformed'}。それ以外 → unlabeled? + (count <= 1 ? 'single') + (!loop && index === 0 ? 'at-start') + (!loop && index === count - 1 ? 'at-end')
```

### 3. DOM 層（`carousel.dom.ts`）

- `readItems(host): HTMLLIElement[]`（`ITEM_SELECTOR`）
- `labelSlides(items)`: 各 `<li>` に `role="group"` `aria-roledescription="slide"` `aria-label="n / N"`（`counterText`）。**`<li>` の中身は触らない**
- `scrollTo(items, index)`: `items[index]?.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'auto' })` — **`behavior: 'auto'`** にして CSS の `scroll-behavior`（`prefers-reduced-motion` で切替）に従わせる。JS で `smooth` を書かない
- `watchVisible(track, items, onVisible: (index) => void): () => void` — `IntersectionObserver({ root: track, threshold: [0.5, 1] })`。エントリから `pickVisible` → `onVisible`。戻り値は `disconnect`
- `syncButtons(prev, next, states)`: `at-start` / `at-end` を `aria-disabled` に写す（`loop` なら常に無し）

### 4. element（`carousel.element.ts`、≤ 150 行、`if` ≤ 5）

- `createRenderRoot() { return this }`。`static override properties = { label: {}, loop: { type: Boolean, reflect: true } }`
- `firstUpdated`: `checkContract` → `malformed` → `labelSlides` → `watchVisible`（`#index` を更新して `requestUpdate()`。**ユーザーのスクロールで変わったときだけ `rd-change`**。`#index` が同じなら出さない）
- `updated`: `internals.role` / `ariaLabel` / `ariaRoleDescription` を書く → `syncStates` → `syncButtons`
- `render()`（強化ノード。`malformed` なら `nothing`）:
  ```html
  <div part="controls">
    <button type="button" part="prev" aria-label=${prev} @click=${#prev}>‹</button>
    <output part="counter">${counterText(index, count)}</output>
    <button type="button" part="next" aria-label=${next} @click=${#next}>›</button>
  </div>
  ```
  `<output>` は暗黙の live region（`aria-live` を**書かない**。ネイティブに任せる — skill §4）。‹ › は `aria-hidden` 不要（`aria-label` が勝つ）。
- `#step(direction)`: `targetIndex(...)` が `undefined` か現在と同じなら何もしない → `scrollTo` → `#index = next` → `rd-change { index }` → `requestUpdate()`
- `get index(): number`、`set index(next)`（`scrollTo` だけ。イベントは出さない）
- `disconnectedCallback` で observer を切る

### 5. CSS（`carousel.css`。light DOM なので `rd-carousel > …`）

- `rd-carousel { display: block }`、`rd-carousel > ul { display: flex; gap: var(--rd-space-4); margin: 0; padding: 0 0 var(--rd-space-2); list-style: none; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: thin }`
  （atom と同じ値。**スクロールバーは隠さない** — 位置の手がかり。`scroll-padding-inline` は `--rd-carousel-padding`（既定 0））
- `rd-carousel > ul > li { flex: 0 0 var(--rd-carousel-item, min(100%, 20rem)); scroll-snap-align: start }`
- `@media (prefers-reduced-motion: no-preference) { rd-carousel > ul { scroll-behavior: smooth } }`（ここだけ。JS は `auto`）
- `[part='controls'] { display: flex; align-items: center; justify-content: end; gap: var(--rd-space-2); margin-block-start: var(--rd-space-2) }`
- `[part='prev'], [part='next']`: `.rd-icon-button` と同じ寸法（`inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); border-radius: var(--rd-radius-full); border: var(--rd-border-width-default) solid var(--rd-color-border-default); background: var(--rd-color-surface-raised)`）。`[aria-disabled='true'] { color: var(--rd-color-text-muted); cursor: not-allowed }`
- `[part='counter'] { font: var(--rd-type-small); font-variant-numeric: tabular-nums; color: var(--rd-color-text-muted) }`
- `rd-carousel:state(single) [part='controls'] { display: none }`（1 枚なら操作は要らない）
- 強制配色: ボタンの境界 `ButtonText`、`aria-disabled` は `GrayText`
- `:not(:defined)` は何も書かない（JS 無しは atom と同じ横スクロールの列）。**`box-shadow: inset` は書かない**

### 6. イベント・状態・JSDoc

- `@event {CustomEvent<{ index: number }>} rd-change - 見えているスライドが変わったときに発火（ボタン・スクロールの両方。プログラムからの `index` 代入では出さない）`
- `@state at-start` / `@state at-end`（`loop` 無しで端にいる）/ `@state single`（1 枚以下）/ `@state unlabeled` / `@state malformed`
- `@csspart controls` / `@csspart prev` / `@csspart next` / `@csspart counter`、`@cssprop --rd-carousel-item - 1 枚の幅。既定 min(100%, 20rem)`、`@cssprop --rd-carousel-padding - 端の scroll-padding。既定 0`
- `@summary 横に並ぶ枚の列。前へ／次へと「n / N」を足す。<ul><li> は利用側が書く`、`@status experimental`、`@pe A`

### 7. 検証面

- `carousel.contract.test.ts`、`carousel.logic.test.ts`（`targetIndex` の端・loop、`counterText`、`pickVisible` の同率、`computeStates`）
- `carousel.test.ts`（実 DOM。vitest browser は実レイアウトなので `IntersectionObserver` が動く）: 契約欠落で `malformed`、`label` 無しで `unlabeled` + `console.error`、`<li>` に `aria-roledescription="slide"` と `aria-label="1 / 5"`、「次へ」で `rd-change { index: 1 }` と counter「2 / 5」、端で `aria-disabled`、`loop` で折り返す、1 枚で `single`、`index` setter で `rd-change` が**出ない**、ボタン ≥ 44px、`prefers-reduced-motion: reduce` で `getComputedStyle(ul).scrollBehavior === 'auto'`
- `carousel.sr.test.ts`: 仮想 SR が「group carousel おすすめ」→「group slide 1 / 3」の順で読む
- `e2e/pe/build-pages.ts` に `carousel.html`、`tier-a.spec.ts` に **JS 無し 2 本**（`<ul>` が `overflow-x: auto`（横スクロールできる）／ボタンが**無い**）、`e2e/a11y/keyboard.spec.ts` に **JS あり 2 本**（Tab で「前へ」「次へ」に届き Enter で counter が変わる／`aria-disabled` の端でも Tab で止まる）、`axe.spec.ts` に 1 ページ
- `e2e/frameworks/shared.ts` に `carouselSuite`（4 フレームワークで描画・「次へ」で counter）、4 アプリに 1 例ずつ
- `tools/mcp/src/examples.ts` に `'rd-carousel'`、`library/react/test/**` に 1 本
- `.size-limit.json` に `carousel/define`（lit 込み）**12 KB**

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check を通す。

### Step 1 — 契約と純関数（`feat(elements): add the rd-carousel contract and navigation logic`）

### Step 2 — element・DOM 層・CSS（`feat(elements): add rd-carousel (experimental, tier A)`）

`carousel.dom.ts` / `carousel.element.ts` / `carousel.css` / stories / `carousel.test.ts` / `carousel.sr.test.ts`。`bun run build && bun run gen`。exports・size-limit・examples・react test もこの Step で。

### Step 3 — 検証面（`test(e2e): cover rd-carousel with and without JS and in the four frameworks`）

### Step 4 — VRT（`test(vrt): baselines for carousel`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`。**VRT の story は `scroll-behavior` に依らず初期位置（index 0）で撮る**（`Next` story だけ `play` 後の位置）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-carousel decision and add a changeset`）

`docs/proposals/carousel.md`（なぜ自動再生を作らないか／なぜ `IntersectionObserver` か（`scrollend` と `scrollsnapchange` の対応状況）／`<output>` を counter にした理由／atom を残す理由）、`.changeset/carousel.md`（minor）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`carousel.*.test.ts` を含む）
- `wc -l library/elements/src/carousel/carousel.element.ts` ≤ 150、`grep -c '\bif\b' …/carousel.element.ts` ≤ 5
- `grep -c "behavior: 'smooth'" library/elements/src/carousel/*.ts` = 0（JS で smooth を書いていない）
- `grep -c 'aria-live' library/elements/src/carousel/*.ts` = 0
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-carousel' library/react/src/generated/index.ts` ≥ 1、React の props に `label` と `loop?: boolean` がある
- `.size-limit.json` の `carousel/define` が通る（12 KB）

## STOP する条件（改善せず報告する）

- 既存 VRT 画像が変わる。size-limit 超過。`carousel.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- vitest browser で `IntersectionObserver` が交差を返さない（`root` 付きで動かない）— 報告する。`scroll` イベントでの代替を勝手に入れない
- VRT の Docker 環境で初期スクロール位置が安定しない（同じ story で画像が揺れる）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- `_shared/**` / `system/**` を変えないと実装できない

## スコープ外

- 自動再生・一時停止。ドット（インジケータ）のタブ化。縦向き。無限ループ（DOM の複製）。`.rd-carousel` atom の削除（次のメジャーで `rd-carousel` に寄せるか判断）

## 保守メモ

- `carousel.css` の寸法は `atoms.css` の `.rd-carousel*` と**二重**になっている。どちらかを変えるときはもう片方も（`system/css/test` にはこの一致を見るテストは無い。proposal の保守メモに書く）
- `IntersectionObserver` の `threshold: [0.5, 1]` は「半分以上見えている枚」を現在位置にする判断。幅が画面の半分未満の枚（`--rd-carousel-item` が小さい）では複数が同時に該当するので `pickVisible` が先頭を選ぶ
- `rd-change` はボタンとユーザーのスクロールで出る。`index` setter では出さない（`rd-toggle-group` / `rd-sort` と同じ方針）
