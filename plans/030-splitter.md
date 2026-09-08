# 030: `rd-splitter` — つまみを動かして 2 つの面の割合を変える（ティア B の Resizable）

**優先度**: P2　**規模**: M　**依存**: 020（`rd-popover` / `rd-tabs` の shadow の骨格。マージ済み）
**レーン**: `feat/splitter`　**計画時の main**: `fa1835c`（025・026 マージ後。**028（`feat/command`）・029（`feat/table-sort`）と並行** — `system/**` / `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/splitter && echo EXISTS` が何も出ないこと。出たら STOP。
> `wc -l library/elements/src/popover/popover.element.ts` が **146**、`library/elements/src/popover/popover.styles.ts` が **21**（shadow ティア B の手本の形が変わっていない）。
> `grep -c 'export const syncStates' library/elements/src/_shared/internals.ts` = 1、`grep -c 'export const checkContract' library/elements/src/_shared/contract.ts` = 1。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Resizable** に当たるものが無い。noter の「一覧 | エディタ | プレビュー」、qrcc の「設定 | プレビュー」は割合を変えたい 2 面で、
いまは固定の grid。APG「Window Splitter」の通り **`role="separator"` のつまみ 1 つ**を持つ部品を作る。

**JS が無いときは 2 つの面が縦に積まれて読める**（ティア B、ADR-0012。`:not(:defined)` の CSS）。定義されると横（既定）または縦に並び、つまみで割合が動く。

決めていること:

- **構造**: `<rd-splitter label="…"><div slot="start">…</div><div slot="end">…</div></rd-splitter>`。shadow は
  `<div part="start"><slot name="start"></slot></div><div part="handle" role="separator" tabindex="0" aria-orientation aria-valuenow aria-valuemin aria-valuemax aria-label></div><div part="end"><slot name="end"></slot></div>`
- **`direction` 属性**（`horizontal` 既定 = 面が横に並ぶ / `vertical` = 縦に積まれる。shadcn と同じ語）。**`aria-orientation` は逆になる**
  （横に並ぶ面の間の仕切りは**縦線** → `aria-orientation="vertical"`。APG の separator の定義。proposal に明記する）
- **`position`（%。既定 50）・`min`（既定 20）・`max`（既定 80）**。整数 %。`position` は反映される属性（JS からも読み書き）。値は `min`〜`max` に丸める
- **`label` 属性は必須**（separator の `aria-label`。「サイドバーの幅」）。空なら `malformed`
- **レイアウトは grid**。host に `--rd-splitter-position: <position>%` をインラインで書き（`style.setProperty`。`menu.dom.ts` が `top` / `left` を書くのと同じ考え）、
  shadow の `:host { display: grid; grid-template-columns: minmax(0, var(--rd-splitter-position)) auto minmax(0, 1fr) }`（`vertical` は rows）
- **ポインタ**: つまみの `pointerdown` で `setPointerCapture` → `pointermove` で host の `getBoundingClientRect()` から % を計算（**RTL では反転**: `matches(':dir(rtl)')`）→ `pointerup` / `pointercancel` で離す。
  ドラッグ中は `:state(dragging)`（`user-select: none` を host に）。`touch-action: none` をつまみに
- **キーボード**（APG）: 横並びは ← →、縦並びは ↑ ↓ で **1%**、Shift で **10%**、Home → `min`、End → `max`。RTL の横並びは ← → を反転。
  Enter（折り畳み）は**やらない**（スコープ外）。他のキーは横取りしない
- **イベント `rd-resize`**（`detail: { position: number }`。**利用者の操作で変わったときだけ**。JS からの `position` 書き換えでは出さない。`pointermove` ごとに出る——間引かない。利用側が要るなら間引く）
- **つまみの標的は 44px**（WCAG 2.5.5 AAA）: 見える太さは `--rd-splitter-size`（既定 `var(--rd-space-2)`）で、`::before` の透明な当たり領域を `2.75rem` に広げる（`position: relative` + 絶対配置）
- 状態: `dragging` / `vertical`（`direction="vertical"`）/ `malformed`（`slot="start"` か `slot="end"` か `label` が無い）
- 面の中身は溢れたら**面ごと転がす**（`[part='start'], [part='end'] { min-inline-size: 0; overflow: auto }`）

守る不変条件:

- **AAA**。つまみの色は `--rd-color-border-default`（非文字 3:1 は面との差で満たす。`base.css` の値が既に AAA）。hover / focus-visible / dragging で `--rd-color-accent-default`。**色だけに頼らない**（`:focus-visible` は `base.css` のフォーカス環。`outline` を書かない）
- **グラデーションを描かない**。`transition` は `background-color` だけ（`prefers-reduced-motion: reduce` で消す）
- `*.element.ts` ≤ 150 行、`if` ≤ 5 → ポインタとキーの処理は `splitter.dom.ts`、計算は `splitter.logic.ts`
- `.size-limit.json` に `splitter/define` **12 KB**
- `_shared/**` / `system/**` を変えない

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/popover/**`**（shadow ティア B。`shadowRootOptions` の `serializable: true`、`#internals`、`firstUpdated` の配線、`*.styles.ts` と `*.css` の分担、`*.dom.ts` のコントローラ）と
  **`library/elements/src/slider/**`**（値の丸め・キーボードの刻み・`aria-valuenow` の扱い）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ
- **失敗するテストを先に書く**
- ラッパー（React / Vue / Svelte / Astro）の props は**文字列**で生成される（`rd-slider` の `min?: string` と同じ）。`position="40"` と書く。数値型にする改修はこの計画の外（STOP せず、proposal に 1 行書く）
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。**ラッパーの props は契約の `tree.attrs` から作られる**——`direction` / `position` / `min` / `max` / `label` を `attrs` に入れる
- `bun run scaffold:element splitter --pe B` で骨格を作る
- `library/elements/package.json` の `exports` に `./experimental/splitter{,/contract,/define,/style.css}` を **`./experimental/combobox/style.css` の直後**に
- story は 8 種（Default / Variants（`vertical`）/ Disabled → **Narrow**（`min="30" max="50"`）に読み替える / Invalid → **Nested**（横の中に縦）に読み替える / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Dragged`（`play` でつまみに → を 10 回）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/splitter`）: `library/elements/src/splitter/**`（新規）、`library/elements/src/experimental/splitter/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/splitter.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/` の splitter 以外、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 028 / 029** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `tier-b.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。
  生成物のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/popover/popover.styles.ts`（shadow は枠だけ。この部品は **grid とつまみ**を shadow に持つので、ここより多くなる）:

```ts
export const styles: CSSResult = css`
  @layer rd.components {
    :host { display: inline-block; }
    :host([hidden]) { display: none; }
    [part='control'] { display: contents; }
  }
`
```

`library/elements/src/popover/popover.element.ts`: `static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }`、`#internals = this.attachInternals()`、`firstUpdated()` で配線、`disconnectedCallback` で `dispose`。

`library/elements/src/_shared/internals.ts`: `syncStates(internals, next: ReadonlySet<string>)`。`library/elements/src/_shared/contract.ts`: `checkContract(host, contract)` → `{ kind: 'ok', found } | { kind: 'missing', roles }`。

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`splitter.contract.ts`）

```ts
export const contract = {
  pe: 'B',
  roles: {
    start: ':scope > [slot="start"]',
    end: ':scope > [slot="end"]',
  },
  required: ['start', 'end'],
  tree: {
    tag: 'rd-splitter',
    attrs: { label: '$label', direction: '$direction', position: '$position', min: '$min', max: '$max' },
    children: [
      { tag: 'div', slot: 'start', children: [{ raw: '$start' }] },
      { tag: 'div', slot: 'end', children: [{ raw: '$end' }] },
    ],
  },
} as const satisfies Contract
```

`SplitterMarkupProps = { label; start: string; end: string; direction?: SplitterDirection; position?: number; min?: number; max?: number }`、`SplitterDirection = 'horizontal' | 'vertical'`。
`start` / `end` は生 HTML（エスケープしない。JSDoc に書く）。

### 2. 純関数（`splitter.logic.ts`）

```ts
export const parseDirection = (raw: string | null): SplitterDirection             // 'vertical' 以外 → 'horizontal'
export const clampPosition = (value: number, min: number, max: number): number    // 整数に丸め、min..max（min > max なら min）
export type Bounds = { readonly min: number; readonly max: number }
export const positionFromPointer = (
  point: number,                    // clientX（横）/ clientY（縦）
  rect: { readonly start: number; readonly size: number },   // host の left|top と width|height
  rtl: boolean,                     // 横並びで RTL なら反転。縦は false を渡す
  bounds: Bounds,
): number
export const decideKey = (
  key: string, shift: boolean, direction: SplitterDirection, rtl: boolean, current: number, bounds: Bounds,
): number | undefined            // 新しい position。扱わないキーは undefined（呼び側は preventDefault しない）
export const ariaOrientation = (direction: SplitterDirection): 'horizontal' | 'vertical'   // 逆にする
export const computeStates = (input: { dragging: boolean; direction: SplitterDirection; malformed: boolean }): ReadonlySet<string>
```

`decideKey` はテーブル駆動（`{ horizontal: { ArrowRight: +1, ArrowLeft: -1 }, vertical: { ArrowDown: +1, ArrowUp: -1 } }`、RTL の横は符号反転、Shift で ×10、Home / End は `min` / `max`）。

### 3. DOM 層（`splitter.dom.ts`）

- `DragController { wire(handle: HTMLElement): void; dispose(): void }` — `pointerdown`（`button === 0` のみ。`setPointerCapture`、`onStart()`）、`pointermove`（`positionFromPointer` → `onMove(position)`）、`pointerup` / `pointercancel`（`releasePointerCapture`、`onEnd()`）
- `isRtl(host)`: `host.matches(':dir(rtl)')`
- `hostRect(host, direction)`: `{ start, size }` を `getBoundingClientRect()` から
- `applyPosition(host, position)`: `host.style.setProperty('--rd-splitter-position', `${position}%`)`

### 4. element（`splitter.element.ts` ≤ 150 行）

- properties: `label: { reflect: true }`、`direction: { reflect: true }`、`position: { type: Number, reflect: true }`（既定 50）、`min: { type: Number }`（20）、`max: { type: Number }`（80）
- `render()`: 上の shadow 構造。つまみに `role="separator"` `tabindex="0"` `aria-orientation` `aria-valuenow=${position}` `aria-valuemin` `aria-valuemax` `aria-label=${label}` `@keydown`
- `firstUpdated`: `checkContract` → `malformed`、`DragController.wire(handle)`。`updated`: `position` を `clampPosition` で正規化（違えば書き戻す）→ `applyPosition` → `syncStates`
- `#setPosition(next, byUser)`: 変わったときだけ `position` を更新し、`byUser` なら `rd-resize` を発火（`bubbles: true, composed: true`）
- JSDoc: `@summary` / `@status experimental` / `@pe B` / `@slot start|end` / `@csspart start|handle|end` / `@cssprop --rd-splitter-size` / `@event rd-resize` / `@state dragging|vertical|malformed` / `@attr label|direction|position|min|max`

### 5. CSS

`splitter.styles.ts`（shadow）:

- `:host { display: grid; grid-template-columns: minmax(0, var(--rd-splitter-position, 50%)) auto minmax(0, 1fr); block-size: 100% }`、`:host([direction='vertical']) { grid-template-columns: none; grid-template-rows: minmax(0, var(--rd-splitter-position, 50%)) auto minmax(0, 1fr) }`
- `:host(:state(dragging)) { user-select: none }`、`:host([hidden]) { display: none }`
- `[part='start'], [part='end'] { min-inline-size: 0; min-block-size: 0; overflow: auto }`
- `[part='handle'] { position: relative; inline-size: var(--rd-splitter-size, var(--rd-space-2)); background: var(--rd-color-border-default); cursor: col-resize; touch-action: none; transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard) }`（`vertical` は `block-size` と `row-resize`。トークン名は `system/tokens` の現物に合わせる——無ければ `transition` を書かない）
- `[part='handle']::before { content: ''; position: absolute; inset-block: 0; inset-inline: calc((2.75rem - var(--rd-splitter-size, var(--rd-space-2))) / -2) }`（当たり領域。`vertical` は inset-inline / inset-block を入れ替える）
- `[part='handle']:hover, [part='handle']:focus-visible, :host(:state(dragging)) [part='handle'] { background: var(--rd-color-accent-default) }`
- `@media (forced-colors: active) { [part='handle'] { background: CanvasText } [part='handle']:focus-visible { background: Highlight } }`
- `@media (prefers-reduced-motion: reduce) { [part='handle'] { transition: none } }`

`splitter.css`（light。JS 無し）: `rd-splitter:not(:defined) { display: grid; gap: var(--rd-space-3) }`、`rd-splitter:not(:defined) > [slot] { display: block }`（2 面が縦に積まれて読める）。定義後は `rd-splitter { display: grid }` だけ（shadow が持つ）。

### 6. 露出・検証面・VRT・proposal

- `experimental/splitter/index.ts`、exports、`.size-limit.json`（12 KB）、`tools/mcp/src/examples.ts`、`tools/mcp/test`、`library/react/test`
- e2e: `build-pages.ts` に `splitter.html`、`tier-b.spec.ts` に JS 無し 2 本（2 面の文字が両方見える／`role="separator"` が**無い**）、`axe.spec.ts` 1 本、
  `e2e/a11y/keyboard.spec.ts` に JS あり 3 本（Tab でつまみに届き → で `aria-valuenow` が 51／Shift+→ で 61／End で 80、Home で 20）、`e2e/frameworks/shared.ts` に `splitterSuite` + 4 spec・app
- VRT 新規画像のみ
- `docs/proposals/splitter.md`（「`direction` と `aria-orientation` が逆な理由」「% にした理由（px は面のサイズに依存する）」「Enter の折り畳みを外した理由」）、`.changeset/splitter.md`（elements minor）

## 手順（red → green。各 Step の終わりにコミット）

- **Step 0** 準備（`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check）
- **Step 1** `feat(elements): add the rd-splitter contract and position logic`
- **Step 2** `feat(elements): add rd-splitter (experimental, tier B)`
- **Step 3** `test(e2e): cover rd-splitter with and without JS and in the four frameworks`
- **Step 4** `test(vrt): baselines for splitter`
- **Step 5** `docs(proposals): record the rd-splitter decision and add a changeset`

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0、`wc -l …/splitter.element.ts` ≤ 150、`grep -c '\bif\b' …/splitter.element.ts` ≤ 5
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に既存画像が無い。`-- system/ library/elements/src/_shared/` が空
- React の props に `direction` / `position` / `min` / `max` / `label` がある。`.size-limit.json` の `splitter/define` が通る
- `splitter.test.ts` に「`pointerdown` → `pointermove` で `position` と `--rd-splitter-position` が変わり `rd-resize` が出る」「JS から `position` を書いても `rd-resize` は出ない」「RTL では → で減る」がある

## STOP する条件

- 既存 VRT 画像が変わる。size-limit 超過。element が 150 行 / `if` 5 に収まらない
- `setPointerCapture` が vitest の browser 環境で使えない（`pointermove` を `window` で聞く代替に**変えず**、報告する）
- axe / markuplint が `role="separator"` + `tabindex="0"` + `aria-valuenow` を落とす
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする

## スコープ外

- 3 面以上、Enter の折り畳み・復元、px 指定、サイズの保存（`localStorage`）、`min-content` 制約

## 保守メモ

- `direction`（面の並び）と `aria-orientation`（仕切り線の向き）が逆であることは混乱の元。`ariaOrientation()` の 1 か所に閉じ、テストで固定する
- `rd-resize` は `pointermove` ごとに出る。利用側で `requestAnimationFrame` などで間引く前提（proposal に書く）
