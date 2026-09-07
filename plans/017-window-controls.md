# 017: 窓の左端の丸を本物のボタンにする — `rd-window`（ティア B）、`.rd-window-bar`、ダイアログの ×

**優先度**: P1　**規模**: L　**依存**: 016（マージ済み。`apps/storybook/stories/Foundations/mado.stories.ts` が在ること）
**レーン**: `feat/window-controls`　**計画時の main**: `b501378`

> **Drift check（最初に実行）**:
> `grep -c 'radial-gradient' system/css/src/patterns.css library/elements/src/dialog/dialog.styles.ts` がそれぞれ 3 以上であること
> （丸 3 つが `::before` で描かれている = このプランの前提）。0 なら誰かが先に直している → STOP。
> `test -f library/elements/src/window/window.element.ts && echo EXISTS` が何も出ないこと。出たら STOP。
> `git diff --stat b501378..HEAD -- library/elements system/css/src/patterns.css` に差分があれば読む。

## なぜ

plan 015 は窓（`.rd-window`）とダイアログの帯の左端に丸 3 つを **装飾の `::before`** で描いた。オーナーの訂正:
**参考画面の丸は操作ボタン（閉じる / 広げる / たたむ）であり、柄ではない**。押せそうに見えて押せない丸は見た目の約束を破る。
また brand.md はダイアログに閉じるボタンがあると書いていたが、実装には無い（Esc と背面クリックだけ）。

決定は **ADR-0014**、見た目の仕様は **`docs/brand.md` §7.1 / §7.7**（両方を先に読む。ここには手順と検査だけを書く）。

このプランでやること:

1. `patterns.css` の帯を **帯 ⊃ 見出し** の構造にし、`.rd-window-controls` / `.rd-window-control[data-action]` を出す。`::before` の丸を消す
2. `rd-window` 部品（ティア B、experimental）を新設する。帯・ボタン・たたむ / 広げるの状態と ARIA を持つ
3. `rd-dialog` の帯の左端に × を出す（`persistent` では出さない）。`rd-dismiss` の `reason` に `'button'` を足す
4. Foundations/Mado の story を新しいマークアップに直し、VRT を撮り直す
5. 015 の積み残し: ダイアログの帯の `column-gap`、`rd-meter` の塗りの端を丸くする、`e2e/frameworks` に meter を足す

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ（`--rd-color-palette-*` は stylelint が落とす）
- **`brand.primary` / `brand.signature` の上に文字・記号を置かない**（brand.md §9）。丸は `chrome.text` 塗り + `chrome.default` の記号
- 動きは `prefers-reduced-motion: no-preference` の中だけ
- PE ティアを変えない。`rd-window` は **B**（枠だけ shadow、見出しと本文は slot）
- `.size-limit.json` の予算内（超えたら 1 KB 単位で上げ、理由を changeset に書く）
- **参考画面の絵・アイコン・ロゴ・文言を写さない**。記号は × / □ / − の幾何だけ

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`（部品規約・story 8 種・完了条件）、`.claude/skills/riml-ds-css/SKILL.md`、
  `.claude/skills/riml-ds-tdd/SKILL.md` を読む。既存部品の手本は **`library/elements/src/dialog/**`**（同じティア B）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ。リアクティブな prop は
  `static properties` + `declare` + constructor 初期化（デコレータ禁止、ADR-0005 §4）
- **失敗するテストを先に書く**（logic は Vitest node、DOM は Vitest browser `*.test.ts`、読み上げは `*.sr.test.ts`、見た目は VRT）
- `*.element.ts` / `*.contract.ts` を変えたら `bun run gen`（CEM・registry・ラッパー・argTypes。guard 検査 15）
- 新部品は `bun run scaffold:element window --pe B` で骨格を作る（11 ファイル + `src/experimental/window/index.ts`。上書きしない）。
  `library/elements/package.json` の `exports` に `./experimental/window{,/contract,/define,/style.css}` を足す（`meter` の 4 行を手本に）
- story は 8 種（`Default` / `Variants` / `Disabled` or `Persistent` / `Dark` / `ForcedColors` / `ReducedMotion` / `RTL` / `Dense`）。a11y の除外には `reason:` を付ける
- CSS の単位: `px` は罫線・アウトラインだけ。それ以外は `rem` か `--rd-*`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/window-controls`）: `library/elements/**`、`system/css/src/patterns.css`、`system/css/test/**`、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、
  `e2e/**`、`.size-limit.json`、`docs/proposals/**`（新設可）、`docs/migration.md`（1 節追記のみ）、
  `apps/storybook/stories/Foundations/mado.stories.ts`、`apps/storybook/stories/Foundations/mado.css`、`.changeset/`。
  **触らない**: `system/tokens/**`（値が要るなら STOP）、`system/css/src/` の他ファイル・`system/css/package.json`・`scripts/build.ts`（018 のレーン）、
  `apps/storybook/stories/Foundations/` の他ファイル、`docs/*.md`（migration 以外）、`plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`
- 隣のレーン `feat/typography-atoms`（018）が同時に走る。`system/css/src/typography.css` / `atoms.css` を作り、`build.ts` の ORDER と
  `system/css/package.json` を触る。**あなたはそれらに触らない**。`e2e/__screenshots__` は両レーンが別ファイルを足すので衝突しない
- コミットは段階ごとに（下の Step の粒度）。Conventional Commits

## 現状のコード（抜粋。読んでから触る）

`system/css/src/patterns.css`（`@layer rd.components`。帯 = 見出し要素、丸は `::before`）:

```css
  .rd-window-title {
    display: grid;
    grid-template-columns: var(--rd-space-12) 1fr var(--rd-space-12);
    place-items: center;
    min-block-size: var(--rd-sizing-target-min);
    ...
    background: var(--rd-color-chrome-default);
    color: var(--rd-color-chrome-text);
    font: var(--rd-type-heading-2);
  }
  .rd-window-title::before { /* radial-gradient × 3 — 消す */ }
  .rd-window-title[data-tone='accent'] { background: var(--rd-color-accent-default); color: var(--rd-color-text-on-accent); }
  .rd-window-title[data-tone='warning'] { ... }  .rd-window-title[data-tone='danger'] { ... }
  .rd-window-body { padding: var(--rd-space-4); }
  @media (forced-colors: active) { ... }
```

`library/elements/src/dialog/dialog.element.ts` の `render()`:

```ts
<dialog part="control" aria-labelledby="rd-dialog-label" ...>
  <div id="rd-dialog-label" part="label"><slot name="label"></slot></div>
  <div part="body"><slot></slot><slot name="actions"></slot></div>
</dialog>
```

`dialog.styles.ts` 37–70 行: `[part='label']` が grid 3 列 + `::before` の丸（patterns.css と二重に持つ。ヘッダのコメントにその旨あり）。
`rd-dismiss` の `reason` は `'esc' | 'backdrop' | 'api'`（`dialog.logic.ts` の `decideClose({ persistent, reason })` が可否を決める）。

`library/elements/src/_shared/field.ts` 75 行: `usesJapaneseCopy(host)`（最も近い `[lang]` を見て日本語表を選ぶ）。ボタンの `aria-label` の
日英切替に使う。`field.ts` から import できないなら **`_shared/lang.ts` に関数を移して両方から import**（既存テストが通ること）。

`apps/storybook/stories/Foundations/mado.stories.ts` 36–37 行: `<h2 class="rd-window-title" data-tone=…><span>…</span></h2>` を直接組んでいる。

トークン（`system/tokens/dist/tokens.css`、値は変えない）: `--rd-color-chrome-default` / `--rd-color-chrome-text`、
`--rd-sizing-target-min`（2.75rem）、`--rd-space-{1,2,3,4,6,8,12,16}`、`--rd-radius-{sm,md,lg,full}`、`--rd-shadow-{raised,overlay}`、
`--rd-layer-{base,raised,overlay,toast}`（z-index。広げた窓は `--rd-layer-overlay`）、`--rd-motion-duration-fast`。

## 設計（決めてある。変えるなら STOP）

### 帯のマークアップ（CSS 版、`patterns.css`）

```html
<section class="rd-window" aria-labelledby="w1">
  <header class="rd-window-bar" data-tone="warning">            <!-- tone は帯（bar）に付ける。見出しではない -->
    <div class="rd-window-controls">                              <!-- 無いなら要素ごと省く -->
      <button type="button" class="rd-window-control" data-action="close" aria-label="閉じる"></button>
      <button type="button" class="rd-window-control" data-action="expand" aria-label="広げる" aria-pressed="false"></button>
      <button type="button" class="rd-window-control" data-action="collapse" aria-label="たたむ" aria-expanded="true" aria-controls="w1-body"></button>
    </div>
    <h2 class="rd-window-title" id="w1">タイトル</h2>
  </header>
  <div class="rd-window-body" id="w1-body">…</div>
</section>
```

- `.rd-window-bar`: `display: grid; grid-template-columns: minmax(var(--rd-space-12), 1fr) minmax(0, auto) minmax(var(--rd-space-12), 1fr);
  align-items: center; min-block-size: var(--rd-sizing-target-min); padding-inline: var(--rd-space-2)`。色・角丸は旧 `.rd-window-title` から移す。
  `.rd-window-controls` は 1 列目 `justify-self: start`、`.rd-window-title` は 2 列目 `justify-self: center`（タイトルは短ければ中央、
  長ければボタンを優先して省略記号）。3 列目は空（左右対称の余白）
- `.rd-window-title`: `margin: 0; overflow: hidden; max-inline-size: 100%; white-space: nowrap; text-overflow: ellipsis; font: var(--rd-type-heading-2); color: inherit`。
  **見出し要素に見た目以外の役目を持たせない**（背景・高さは bar 側）
- `.rd-window-control`: `inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); display: grid; place-items: center;
  padding: 0; border: 0; background: transparent; color: inherit; border-radius: var(--rd-radius-full); cursor: default`。
  `::before` = 丸（1.25rem、`background: var(--rd-color-chrome-text)`、`border-radius: full`、grid-area 重ね）。
  `::after` = 記号（0.75rem 四方、`background: var(--rd-color-chrome-default)`、`mask: var(--rd-window-glyph) center / contain no-repeat`）。
  記号は `[data-action='close|expand|collapse']` ごとに `--rd-window-glyph: url("data:image/svg+xml,…")`（`viewBox 0 0 16 16`、`stroke-width 2`、
  `stroke-linecap round`、× は 2 本線、□ は `rect x=3 y=3 w=10 h=10 rx=1`、− は水平線）。3 本の data URI は
  **`library/elements/src/_shared/window-chrome.ts` の定数と同じ文字列**にする（下のテストで固定）
- hover / `:focus-visible`: `.rd-window-control::before` に `outline: 2px solid var(--rd-color-chrome-text); outline-offset: 2px`。塗りは変えない。
  `:active` は `translate: 0 0.0625rem`（reduced-motion no-preference の中）
- tone: `.rd-window-bar[data-tone='accent'|'warning'|'danger']` に旧 `.rd-window-title[data-tone]` の色を移す。丸は tone でも `chrome.text` 塗り、
  記号は `chrome.default`（帯の色に依存しない。非文字 3:1 は丸 vs 帯で検査 — `chrome.text` は on-accent / on-status と同じクリーム系）
- `forced-colors: active`: 帯は `Canvas`/`CanvasText` + 1px 境界（既存）、`.rd-window-control::before` は `background: ButtonFace; border: 1px solid ButtonText`、
  `::after` は `background: ButtonText`
- 装飾 `.rd-window[data-stack]`（重ねた窓、brand の「積み重ね」）: `box-shadow: var(--rd-shadow-raised), var(--rd-space-2) var(--rd-space-2) 0 var(--rd-color-surface-sunken), var(--rd-space-2) var(--rd-space-2) 0 var(--rd-border-width-default) var(--rd-color-border-default)`。
  **任意**。時間がなければ省いて報告
- 旧 `.rd-window-title::before` と、見出しに付いていた背景・grid は削除する。**互換の別名は残さない**（0.x、ADR-0014 決定 5）

### `rd-window` 部品（ティア B、experimental）

| 項目 | 内容 |
| --- | --- |
| タグ / ファイル | `rd-window`、`library/elements/src/window/**`（scaffold `--pe B`） |
| slot | `title`（**必須**、利用側の h 要素）、default（本文） |
| 属性（reflect） | `closable` / `collapsible` / `expandable`（boolean。付いた操作の丸だけ描く）、`collapsed`（boolean）、`expanded`（boolean）、`tone`（`'accent' \| 'warning' \| 'danger'`） |
| part | `bar`、`controls`、`control`（各ボタン。`data-action` 付き）、`title`（見出し slot の入れ物）、`body` |
| state | `collapsed`、`expanded`、`malformed`（`slot="title"` の子が無い） |
| event | `rd-dismiss`（`detail: { reason: 'button' }`、**cancelable**。既定の動作 = host に `hidden` を付ける）、`rd-toggle`（`detail: { collapsed }`）、`rd-expand`（`detail: { expanded }`） |
| メソッド | `close()`、`toggleCollapsed(force?: boolean)`、`toggleExpanded(force?: boolean)` |
| 描画 | `<header part="bar"><div part="controls">…</div><div part="title"><slot name="title"></slot></div></header><div part="body" id="rd-window-body"><slot></slot></div>` |
| ARIA | たたむボタン `aria-expanded={!collapsed}` `aria-controls="rd-window-body"`、広げるボタン `aria-pressed={expanded}`、閉じる/たたむ/広げるの `aria-label` は `usesJapaneseCopy` で ja/en。`collapsed` のとき body に `hidden`。host は `ElementInternals` で `role = 'region'`、`'ariaLabelledByElements' in internals` なら slot 先の見出しを結ぶ（無ければ何もしない。利用側が `aria-labelledby` を書ける） |
| 広げる | `:host([expanded])` を `position: fixed; inset: var(--rd-window-expanded-inset, var(--rd-space-4)); z-index: var(--rd-layer-overlay); overflow: auto`。**モーダルではない**（フォーカスは閉じ込めない）。`expanded` 中の Esc は `toggleExpanded(false)` |
| キー | ボタンはネイティブ `<button>` なので Enter / Space は無料。Esc は host の `keydown` で `expanded` のときだけ |
| JS 無し（`window.css`） | `rd-window:not(:defined)` は窓の枠 + `> [slot='title']` を帯として描く（ボタン無し）。`rd-window:not(:defined)[collapsed] > :not([slot='title'])` は `display: none` |
| 契約（`window.contract.ts`） | `pe: 'B'`、`roles: { title: ':scope > [slot="title"]' }`、`required: ['title']`、`tree` は `dialog.contract.ts` を手本に（`{ tag: 'h2', slot: 'title', children: [{ prop: 'title' }] }`, `{ raw: '$children' }`、attrs に `closable` / `collapsible` / `expandable` / `collapsed` / `tone`） |
| logic（`window.logic.ts`） | 純関数 `nextState({ collapsed, expanded }, action)` と `controlsFor({ closable, collapsible, expandable })`（並び順 close → expand → collapse を返す）。node テストで固定 |
| registry | `{ name: 'window', tag: 'rd-window', pe: 'B', status: 'experimental', summary: '窓。帯と閉じる/広げる/たたむ。見出しは slot="title" に利用側が置く', files: [...], dependsOn: [] }` |
| e2e/pe | `e2e/pe/build-pages.ts` の PAGES に `window` を足す（`<script>` は書けない）。JS 無しで見出しと本文が読めること |

`_shared/window-chrome.ts`: `export const WINDOW_GLYPHS = { close: 'url("data:…")', expand: 'url("data:…")', collapse: 'url("data:…")' } as const` と、
帯 + 丸の共通 CSS 断片 `export const windowChrome: CSSResult = css\`…\``（`dialog.styles.ts` と `window.styles.ts` の両方が `${windowChrome}` で挿す）。
**テスト** `library/elements/test/window-chrome.test.ts`（node）: `system/css/dist/patterns.css` を読み、`WINDOW_GLYPHS` の 3 つの data URI が
そのまま含まれることを assert（`bun run build` 後の dist を読む。無ければ `system/css/src/patterns.css` を読む）。

### `rd-dialog` の変更

- `render()` を `<dialog part="control" aria-labelledby="rd-dialog-label"><header part="bar">${persistent ? nothing : closeButton}<div id="rd-dialog-label" part="label"><slot name="label"></slot></div></header><div part="body">…</div></dialog>` に。
  `closeButton` = `<div part="controls"><button part="control close" type="button" data-action="close" aria-label=${…} @click=${() => this.close('button')}></button></div>`
- `dialog.styles.ts` の `[part='label']` の grid・背景・`::before` を消し、`${windowChrome}` を使う（`[part='bar']` が帯）。`[part='label']` は見出しの入れ物だけ
- `DismissReason` に `'button'` を追加。`decideClose` は `'button'` を常に許可（`persistent` ならボタン自体が無い）。JSDoc `@event` の型も更新
- `aria-labelledby` の先は `part="label"` のまま（ボタンは外にあるので名前に混ざらない）。**テスト**: `dialog.sr.test.ts` に「閉じるボタンの名前が
  ダイアログの名前に含まれない」を足す
- `contract` は変えない（`persistent` は既にある）
- story: `Default` に × が見えること。`Persistent` story（無ければ `Disabled` の代わり）に × が無いこと

### `rd-toast`

丸の `::before` があれば消す（`grep radial-gradient library/elements/src/toast` が 0 になること）。**閉じるボタンは今の文字ボタン（`part="close"`「閉じる」）のまま**。
左端の 0.5rem の意味色の帯は brand.md §7.7 のとおり残す。それ以外は触らない。

### 015 の積み残し

- ダイアログの帯: 見出しと × の間に `column-gap: var(--rd-space-2)`（新しい `[part='bar']` の grid に含める）
- `rd-meter`: 塗り（fill）の端を `border-radius: var(--rd-radius-full)` にする（今はトラックだけ丸い）。`meter.test.ts` に `getComputedStyle` の assert
- `e2e/frameworks/*.spec.ts` に meter を 1 ケース足す（`shared.ts` の一覧に `meter` を足すだけで済む構造ならそれで）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

```bash
RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/window-controls   # advisor が済ませていれば skip
bun install --frozen-lockfile && bun run build && bun run gen && bun run test
```

`bun run test` が全部通ることを確認（基準）。通らなければ STOP。

### Step 1 — `_shared/window-chrome.ts` と patterns.css の帯（`feat(css): make window controls real buttons`）

1. red: `system/css/test/patterns.test.ts`（既存があれば追記）に
   - `patterns.css` に `radial-gradient` が **含まれない**
   - `.rd-window-bar` / `.rd-window-controls` / `.rd-window-control[data-action='close']` / `[data-action='expand']` / `[data-action='collapse']` の宣言がある
   - `mask` の `url("data:image/svg+xml` が 3 つある
   - `@media (forced-colors: active)` の中に `ButtonFace` と `ButtonText` がある
   を書く → fail を確認
2. red: `library/elements/test/window-chrome.test.ts`（上記）→ fail
3. green: `_shared/window-chrome.ts` を書き、`patterns.css` を設計どおりに書き直す。`bun run build`（css）→ テスト green
4. `bun run check`（stylelint の `unit-disallowed-list` と `no-palette-token` が通ること）

### Step 2 — Foundations/Mado の story を新マークアップに（`refactor(storybook): use the window bar markup`）

`mado.stories.ts` の窓を `.rd-window-bar` + `.rd-window-controls` + `.rd-window-title` に。**3 種の窓を出す**: ボタン無し / × だけ / × □ − 全部。
tone 3 種は bar に付ける。`bun run storybook:build` が通ること。VRT は Step 6 でまとめて撮り直す。

### Step 3 — `rd-window` 部品（`feat(elements): add rd-window with close / expand / collapse`）

1. `bun run scaffold:element window --pe B`
2. red（node）: `window.logic.test.ts` — `controlsFor` の並びと省略、`nextState` の遷移（collapse toggle / expand toggle / expanded 中の Esc）
3. red（browser）: `window.test.ts` —
   - `closable` だけなら丸が 1 つ、3 属性なら 3 つ、並びが close → expand → collapse
   - たたむ → body に `hidden`、ボタン `aria-expanded="false"`、`rd-toggle` の detail、`:state(collapsed)`
   - 広げる → `expanded` 反映、`aria-pressed="true"`、Esc で戻る、`rd-expand` 2 回
   - 閉じる → `rd-dismiss` `{ reason: 'button' }`、`preventDefault` しなければ host に `hidden`、すれば付かない
   - `lang="en"` の祖先があれば `aria-label` が英語
   - `slot="title"` が無いと `:state(malformed)`
   - 丸の `getComputedStyle(::before).backgroundColor` が `chrome.text` の解決値、`::after` の `maskImage` に `data:image/svg+xml`
4. red（sr）: `window.sr.test.ts` — 見出しがそのまま読めること、ボタンの名前が「閉じる」「広げる」「たたむ」であること
5. green: contract / logic / element / styles / css / define / index / experimental index / `package.json` exports / registry / `examples.ts`
6. `bun run gen` → ラッパー再生成。`git status` で `library/*/src/generated` の差分が window 分だけであること
7. story 8 種 + `AllControls` + `Tones` + `Collapsed`（`Disabled` の枠は `Persistent` ではなく **`NoControls`** に）
8. `e2e/pe/build-pages.ts` に `window` を足し、`bun run pe`
9. `.size-limit.json` に window のエントリ（`meter` を手本に。予算は初回 `bun run release:check` の実測 + 10%）
10. `docs/proposals/window.md`（`meter.md` を手本に: 目的 / API / a11y / 代替案 / stable への条件）
11. `e2e/frameworks/*.spec.ts` に window を 1 ケース（`collapsible` を押して body が hidden になる）— React と Vue の 2 つ以上

### Step 4 — `rd-dialog` の ×（`feat(dialog): add the close control to the title bar`）

red: `dialog.test.ts` に「× があり、押すと `rd-dismiss` `{ reason: 'button' }`」「`persistent` なら × が無い」、`dialog.sr.test.ts` に名前の分離。
`dialog.styles.ts` に `radial-gradient` が無いことを `library/elements/test/` の node テストで固定（toast も同時に）。
green: 設計どおり。`bun run gen`（`@event` の型変更で CEM が変わる）。story 更新。

### Step 5 — 015 の積み残し（`fix(meter): round the fill end` / `test(e2e): cover meter in frameworks`）

上記「015 の積み残し」の 3 点。ダイアログの `column-gap` は Step 4 に含めてよい。

### Step 6 — VRT 撮り直しと移行メモ（`test(vrt): re-shoot windows and dialogs` / `docs(migration): window bar markup`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'Mado|Dialog|Window|Toast|Meter'
bash scripts/vrt.sh                       # 全部 green
bun run a11y                              # AAA。除外 0 のまま
bun run pe
```

差分は窓・ダイアログ・トースト・メーター・新規 window のみであること（他の story の画像が変わっていたら原因を調べる。
`.rd-window-title` の見た目を借りていた story があれば直す）。`docs/migration.md` に「0.2 → 0.3: 窓の帯」の節を足す（before / after の HTML、
`data-tone` の付け先の変更、`::before` の丸が消えること、qrcc / noter の `<Window>` が追随すべき点）。

### Step 7 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD          # レーン外が無いこと
```

changeset（minor、`@rimltempest/riml-ds-css` と `@rimltempest/riml-ds-elements` と各ラッパー）: 「窓の帯を帯 ⊃ 見出しに変更（破壊的、0.x）。
`rd-window` 追加。dialog に × 追加、`rd-dismiss` reason に `'button'`」。

## 完了条件（機械で検査できるもの）

- `grep -rn 'radial-gradient' system/css/src library/elements/src | wc -l` = **0**
- `grep -c 'data:image/svg+xml' system/css/dist/patterns.css` = **3**、`library/elements/test/window-chrome.test.ts` が green
- `bun run test` 全 green（新規: window の logic / browser / sr、dialog の × 3 件、window-chrome 1 件、meter の角丸 1 件）
- `bun run a11y` 全 green、除外 0
- `bun run pe` 全 green（window の JS 無しページ含む）
- `bun run e2e:frameworks`（または CI の e2e ジョブと同じコマンド）で window（2 フレームワーク以上）と meter が green
- `bash scripts/vrt.sh` 全 green（基準画像更新済み）
- `tools/cem/registry.json` に `window`（`status: experimental`）、`library/elements/package.json` に `./experimental/window` 4 行
- `bun run release:check` exit 0（size-limit 内、api-diff は minor）
- `bash scripts/guard.sh` exit 0、`git diff --name-only main...HEAD` がレーン内
- `docs/proposals/window.md` と `docs/migration.md` の追記がある

## STOP する条件（改善せず報告する）

- トークンの値や新しいトークンが必要になった（例: 丸のサイズを token にしたい）→ 今回は `1.25rem` / `0.75rem` を **CSS 変数 `--rd-window-control-size` / `--rd-window-glyph-size`** の既定値として書く。token 化は報告
- `ElementInternals.ariaLabelledByElements` が Vitest browser の Chromium で使えない → その部分だけ `in` 判定で飛ばして報告（他は進める）
- `mask` の data URI が stylelint（`riml-ds/*` や `unit-disallowed-list`）に落とされる → ルールの意図を読んで **stylelint 設定は触らず** STOP
- Vitest browser で `::before` の `maskImage` が取れない → `backgroundColor` と `content` だけ assert して報告
- `bun run gen` がラッパーを window 以外で書き換える → 生成器の非決定性なので STOP（差分を貼る）
- size-limit の超過が 2 KB 以上 → STOP

## スコープ外

- `rd-toast` の閉じるボタンを丸にする（文字ボタンのまま）
- 窓のドラッグ移動・リサイズ・タブ（020）
- qrcc2 / noter の追随（qrcc2 plan 013）
- `system/css/package.json` の `peerDependenciesMeta`（018）

## 保守メモ

- 帯の見た目は **`_shared/window-chrome.ts`（部品側）と `patterns.css`（CSS 側）の 2 か所**に在る。記号の data URI はテストで一致を固定したが、
  色・寸法は目視（VRT）でしか揃わない。どちらかを変えたら両方を見る
- `rd-window` の `expanded` は fixed で覆うだけで、モーダルでもフォーカストラップでもない。「モーダルに広げたい」要望は `rd-dialog` を使う
- `hidden` を既定動作にしたのは最小の約束。SPA は `rd-dismiss` を `preventDefault` して自分で消す
