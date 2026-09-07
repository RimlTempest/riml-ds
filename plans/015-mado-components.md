# 015: 「まど」の見た目を部品に当てる — `.rd-window` パターン、ピルのボタン、`rd-meter`

**優先度**: P1　**規模**: L　**依存**: 014（マージ済みであること。`--rd-color-chrome-*` / `--rd-color-brand-*` / `--rd-type-heading-*-font-family` が `tokens.css` に在ること）
**レーン**: `feat/mado-chrome`　**計画時の main**: `3d85de1`（014 マージ後の SHA は Drift check で確認）

> **Drift check（最初に実行）**:
> `grep -c 'rd-color-chrome-default\|rd-color-brand-primary' system/tokens/dist/tokens.css`（`bun run build` 後）が 2 以上であること。
> 0 なら 014 が入っていない → STOP。
> `git diff --stat 3d85de1..HEAD -- library/elements system/css` に自分以外の差分があれば読む。

## なぜ

014 で色・角丸・影・見出しの文字がトークンに入った。しかし部品 CSS は「四角い箱 + 1px 枠」の足場のままで、
`docs/brand.md` §7 の視覚言語「まど」（タイトルバーの帯 + 丸 3 つ、ピルのボタン、太いトラック、点線の区切り、硬い影）は
まだどこにも無い。このプランで **部品 CSS を書き直し**、窓の骨格を CSS パターンとして出し、メーターを足す。

仕様は **`docs/brand.md` §7–§9**（読んでから始める。ASCII の構造図がある）。ここに書くのは実装の手順と検査。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ使う（`--rd-color-palette-*` は stylelint `riml-ds/no-palette-token` が落とす）
- **`brand.primary` / `brand.signature` の上に文字を置かない。文字色にも使わない**（装飾用。brand.md §9）
- 動きは `prefers-reduced-motion: no-preference` の中だけ（`system/css/test/build.test.ts` が検査）
- PE ティアを変えない（ボタン等はティア A の light DOM。dialog はティア B、toast / live-region はティア C）
- `.size-limit.json` の予算内（超えたら予算を **1 KB 単位で** 上げ、理由を changeset に書く）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`（部品規約・story 8 種・完了条件）と `.claude/skills/riml-ds-css/SKILL.md`（CSS 規約）を読む
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **失敗するテストを先に書く**。CSS の見た目は VRT（`bun run vrt`）と Vitest browser（`*.test.ts` の `getComputedStyle`）で固定する
- **JS が要らないものは部品にしない**（ADR-0012 §6）。窓は `.rd-window` の CSS クラス。メーターは JS が値を CSS 変数に写す仕事があるので部品
- CSS の単位: `px` は罫線系だけ（stylelint `unit-disallowed-list`）。それ以外は `rem` か `--rd-*`
- `*.element.ts` / `*.contract.ts` を変えたら `bun run gen`（CEM・registry・ラッパー・argTypes が再生成される。guard 検査 15）
- story は 8 種（`Default` / `Variants` / `Disabled` / `Invalid` or `Loading` / `Dark` / `ForcedColors` / `ReducedMotion` / `RTL` / `Dense`）。
  a11y の除外には `reason:` を付ける
- 触ってよいパス（`scripts/lanes.tsv` の `feat/mado-chrome`）: `library/elements/**`、`system/css/**`、`library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`e2e/**`（`e2e/vrt`・`e2e/pe`・`e2e/frameworks`・screenshots）、
  `.size-limit.json`、`docs/proposals/**`（新設可）、`.changeset/`。
  **触らない**: `system/tokens/**`（値が要るなら STOP して報告）、`apps/storybook/**`（016）、`docs/*.md`、`plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`
- コミットは部品ごとに（`feat(css): add .rd-window pattern` / `feat(elements): pill buttons` / `feat(elements): add rd-meter` / `test(vrt): re-shoot for mado` …）

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/button/button.css`（ティア A、light DOM。`rd-button > button` に当てる。`@supports selector(:state(...))` で状態版を重ねる）:

```css
@layer rd.components {
  rd-button > button,
  rd-button > a {
    display: inline-flex;
    ...
    min-block-size: var(--rd-sizing-target-min);
    padding-inline: var(--rd-button-padding-inline, var(--rd-space-4));
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: transparent;
    border-radius: var(--rd-radius-md);
    background: var(--rd-color-accent-default);
    color: var(--rd-color-text-on-accent);
    ...
  }
  rd-button[variant='secondary'] > button, rd-button[variant='secondary'] > a {
    border-color: var(--rd-color-border-strong);
    background: var(--rd-color-surface-raised);
    color: var(--rd-color-text-default);
  }
```

`library/elements/src/dialog/dialog.styles.ts`（ティア B。shadow の枠だけ。`[part='control']` = `<dialog>`、`[part='label']` = 見出し、
`::slotted([slot='actions'])`）。`box-shadow: var(--rd-shadow-overlay)`、`border-radius: var(--rd-radius-lg)`、1px `border.default`。

`library/elements/src/toast/toast.styles.ts`（ティア C。`[part='control']` 右下固定、`border-inline-start-width: var(--rd-space-1)` で tone、`[part='close']`）。

`system/css/scripts/build.ts:10` — 結合順 `ORDER = ['layers', 'reset', 'base', 'utilities', 'print', 'forced-colors']`。
`system/css/test/build.test.ts:14` — `SOURCES` の一覧（dist に 1 ファイルずつ出ることを検査）。`system/css/package.json:15-22` — `exports`。

`system/css/src/base.css` の見出しは `font-size` / `font-weight` / `line-height` だけで **`font-family` を指定していない**
（014 で `type.heading.*` が display スタックになったが、まだ効いていない）。

`library/elements/scripts/scaffold.ts` — `bun run scaffold:element <name> --pe A|B|C` で 10 ファイルの雛形を出す。

`e2e/pe/tier-a.spec.ts` — JS 無しでフォーム部品が動く検査。`e2e/pe/build-pages.ts` が `markup()` からページを作る。

## Step 0 — 失敗するテスト（red）

1. `system/css/test/build.test.ts` の `SOURCES` に `'patterns.css'` を足し、
   「`dist/patterns.css` が `.rd-window` を含み `@layer rd.components` の中にある」「`base.css` の `h1` / `h2` が
   `--rd-type-heading-1-font-family` / `-2-` を参照する」「`hr` が `dotted`」の 3 テストを足す
2. `library/elements/src/button/button.test.ts` に「`border-radius` が `--rd-radius-full` の解決値（9999px）」
   「`font-weight` が bold の解決値（700）」を `getComputedStyle` で固定するテストを足す
3. `bun run scaffold:element meter --pe A` → `library/elements/src/meter/` に雛形。`meter.logic.test.ts` の `it.todo` を実テストに
   （下の Step 4 の仕様）。`meter.contract.test.ts` に `roles.control` が `:scope > meter, :scope > progress` であることを固定
4. `bun run test -- --project node system/css library/elements` と `bun run test -- --project browser` で **red** を確認

## Step 1 — `system/css`: `patterns.css`（窓）と base の追随

`system/css/src/patterns.css` を新設し、`build.ts` の `ORDER` に `'patterns'` を **`utilities` の前**に足す（layer は `rd.components`）。
`package.json` の `exports` に `"./patterns.css": "./dist/patterns.css"`。`README.md` に 1 段落（クラス名と最小マークアップ）。

```css
@layer rd.components {
  /* 窓（brand.md §7.1）。JS は要らないので部品にしない（ADR-0012 §6） */
  .rd-window {
    border-radius: var(--rd-radius-lg);
    background: var(--rd-color-surface-raised);
    box-shadow: var(--rd-shadow-raised);
    color: var(--rd-color-text-default);
  }

  /* 帯 = 見出し要素そのもの。丸 3 つは ::before の radial-gradient（DOM に無い・読まれない・押せない） */
  .rd-window-title {
    display: grid;
    grid-template-columns: var(--rd-space-12) 1fr var(--rd-space-12);
    align-items: center;
    min-block-size: var(--rd-sizing-target-min);
    margin: 0;
    padding-inline: var(--rd-space-3);
    border-start-start-radius: var(--rd-radius-lg);
    border-start-end-radius: var(--rd-radius-lg);
    background: var(--rd-color-chrome-default);
    color: var(--rd-color-chrome-text);
    font: var(--rd-type-heading-2);
    text-align: center;
  }

  .rd-window-title > * { grid-column: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .rd-window-title::before {
    grid-column: 1;
    inline-size: var(--rd-space-12);
    block-size: var(--rd-space-3);
    background:
      radial-gradient(circle at 12.5% 50%, var(--rd-color-brand-signature) 45%, transparent 50%),
      radial-gradient(circle at 50% 50%, var(--rd-color-brand-primary) 45%, transparent 50%),
      radial-gradient(circle at 87.5% 50%, var(--rd-color-border-default) 45%, transparent 50%);
    content: '';
  }

  .rd-window-title[data-tone='accent'] { background: var(--rd-color-accent-default); color: var(--rd-color-text-on-accent); }
  .rd-window-title[data-tone='warning'] { background: var(--rd-color-status-warning-default); color: var(--rd-color-text-on-status); }
  .rd-window-title[data-tone='danger'] { background: var(--rd-color-status-danger-default); color: var(--rd-color-text-on-status); }

  .rd-window-body { padding: var(--rd-space-4); }

  @media (forced-colors: active) {
    .rd-window { border: 0.0625rem solid CanvasText; box-shadow: none; }
    .rd-window-title { border-block-end: 0.0625rem solid CanvasText; background: Canvas; color: CanvasText; }
    .rd-window-title::before { display: none; }
  }
}
```

（`--rd-space-12` が無ければ在る spacing トークンで 3rem 相当を選ぶ。`grep -- '--rd-space-' system/tokens/dist/tokens.css` で確認。
無い段が要る場合は `calc(var(--rd-space-4) * 3)` にする。**tokens には足さない**。）

`base.css`: `h1` / `h2` に `font-family: var(--rd-type-heading-1-font-family)` / `-2-` を足す。
`hr` を追加: `border: 0; border-block-start: 0.125rem dotted var(--rd-color-border-default); margin-block: var(--rd-space-4);`
（`2px` は `0.125rem`。`unit-disallowed-list` が `px` を許すのは罫線系だけだが、既存は `0.0625rem` と書いているので揃える）。

## Step 2 — ティア A 部品の CSS を書き直す（button / text-field / checkbox / select / disclosure）

各 `*.css` を brand.md §7.2–7.4 に合わせる。**セレクタ構造・`:state()` の二重定義・focus-visible・forced-colors・reduced-motion の節は保つ**。変えるのは値:

| 部品 | 変える所 |
| --- | --- |
| `button.css` | `border-radius: var(--rd-radius-full)`、`font-weight: var(--rd-font-weight-bold)`、`border-width: 0`（枠を持たない。secondary も）。secondary = `background: var(--rd-color-surface-sunken)`、`color: text-default`。hover: primary `accent-hover`、secondary `surface-hover`、danger `status-danger-hover`（**hover の節は新設**。`@media (hover: hover)` の中）。`:active` は `translate: 0 0.0625rem`（`prefers-reduced-motion: no-preference` の中） |
| `text-field.css` | `background: var(--rd-color-surface-raised)`、`border-color: var(--rd-color-border-default)`、label に `font-weight: bold` |
| `select.css` | text-field と同じ窪み。矢印は既存のまま |
| `checkbox.css` | 箱 `border-radius: var(--rd-radius-sm)`（`appearance: none` にしないなら `accent-color` のまま可。**チェックの描き直しはしない**）。switch: トラック `block-size: var(--rd-space-6)`（1.5rem）、`inline-size: var(--rd-space-12)` 相当（無ければ `calc`）、つまみ `var(--rd-space-4)`、境界線なし・`surface-sunken` → checked `accent-default` |
| `disclosure.css` | summary をピル無しの行に。開閉マーカーは既存。hover `surface-hover` |

`forced-colors` の節は色を `ButtonFace` / `ButtonText` / `Canvas` / `CanvasText` に。`border-width: 0` にした部品は forced-colors で
`border: 0.0625rem solid ButtonText` を戻す（枠が無いと強制配色で消える）。

## Step 3 — dialog / toast（shadow の枠を窓にする）

`dialog.styles.ts`: `[part='control']` を `padding: 0; border: 0; border-radius: var(--rd-radius-lg); box-shadow: var(--rd-shadow-overlay)`。
`[part='label']` を帯にする（Step 1 の `.rd-window-title` と同じ宣言を **shadow 内に書く**。shadow は light DOM のクラスを参照できない。
重複は許容。**値はトークン参照のみ**）。本文（既定 slot）と `[slot='actions']` は `padding: var(--rd-space-4)` の body に置く —
shadow の構造（`dialog.element.ts` の `render()`）に `<div part="body"><slot></slot><slot name="actions"></slot></div>` が要るなら
element を変えてよい（**API は変えない**: slot 名・属性・イベントはそのまま。`@csspart body` を JSDoc に足す → `bun run gen`）。
閉じるボタン（在れば `[part='close']`）は帯の右端の列（grid-column 3）に置く。

`toast.styles.ts`: `border: 0; border-radius: var(--rd-radius-md); box-shadow: var(--rd-shadow-raised)`、
tone の左帯は `border-inline-start-width: var(--rd-space-2)`（0.5rem）のまま色を維持。

## Step 4 — `rd-meter`（新設、experimental、ティア A）

`bun run scaffold:element meter --pe A` の雛形から。仕様（brand.md §7.5）:

- 契約: `rd-meter > meter` または `rd-meter > progress`（`roles.control: ':scope > meter, :scope > progress'`）。`<label for>` は
  必須（`required: ['control', 'label']`、`:scope > label`）。`tree` は `<rd-meter><label for=$id>$label</label><meter id=$id value=$value max=$max min=$min>$text</meter></rd-meter>`
  （`$text` はフォールバック文言。例「3.2 GB / 10 GB」）
- logic（純関数）: `computeFill({ value, min, max }) → Result<{ fill: number }, 'invalid-range'>`。`fill` は 0–1 に丸める。
  `max <= min` / NaN は `invalid-range`（`throw` しない）。`progress` で `value` 無し（indeterminate）は `fill: 0` + `states: ['indeterminate']`
- element: `firstUpdated` で control を掴み、`value` / `min` / `max` 属性（`progress` は `value` / `max`）を読んで
  `this.style.setProperty('--rd-meter-fill', String(fill))`。`MutationObserver` で属性変更に追随（`disconnectedCallback` で切る）。
  `render()` は何も足さない（`nothing`）。JSDoc: `@pe A`、`@status experimental`、`@cssprop --rd-meter-fill`、`@state indeterminate`
- CSS（`meter.css`）: `rd-meter > meter, rd-meter > progress { appearance: none; inline-size: 100%; block-size: var(--rd-space-4); border: 0;
  border-radius: var(--rd-radius-full); background: linear-gradient(to right, var(--rd-color-accent-default) calc(var(--rd-meter-fill, 0) * 100%), var(--rd-color-surface-sunken) 0); }`
  + `[dir='rtl']` は `to left`（`:dir(rtl)` が Baseline なら `rd-meter:dir(rtl) > meter`）。`data-tone` で `success` / `warning` / `danger` の塗り（`status.*.default`）。
  Blink の `::-webkit-meter-bar` 等は使わない（`appearance: none` + 背景で描く。`@supports not (appearance: none)` はネイティブのまま）。
  forced-colors: `border: 0.0625rem solid CanvasText`、塗りは `Highlight`
- `experimental/meter/index.ts` から re-export。`package.json` の `exports` に `./experimental/meter`（+ `/contract` / `/define` / `/style.css`）
  を checkbox の並びに合わせて足す
- テスト: `meter.logic.test.ts`（fill の丸め・invalid-range・indeterminate）、`meter.test.ts`（browser: 属性 → `--rd-meter-fill` の値、
  `MutationObserver` の追随）、`meter.sr.test.ts`（`<label for>` で名前が付く。`meter` は role meter）、`meter.stories.ts` 8 種
  （`Variants` = tone 4 つ + `progress`、`Invalid` の代わりに `Indeterminate`）
- `e2e/pe/build-pages.ts` / `tier-a.spec.ts` に meter を足す（JS 無しでネイティブ `<meter>` が値を表示する）
- `docs/proposals/meter.md`（新設。目的・API・a11y・代替案 10 行程度）
- `tools/mcp/src/examples.ts` に meter の例を 1 つ（既存の形に倣う）。`bun run gen` → CEM / registry / 4 ラッパー / argTypes。
  `e2e/frameworks/*.spec.ts` は既存の一覧駆動なら自動で対象に入る。入らなければ 1 行ずつ足す

## Step 5 — VRT・予算・changeset

1. `bun run build && bun run gen && bun run test && bun run check`
2. `bunx size-limit`。超えた項目は 1 KB 刻みで上げる（ピル・hover・forced-colors の追加で button.css が増える見込み。+1 KB まで想定内）
3. `bun run vrt:update`（Docker）→ `bun run vrt` 緑 → `e2e/__screenshots__` をコミット。**meter の story が撮れていること**（`e2e/stories.ts` は `index.json` 駆動なので自動）
4. `bun run pe`（JS 無し検証）・`bun run a11y` 緑
5. `.changeset/mado-components.md`:

```md
---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- css: `patterns.css` に窓 `.rd-window` / `.rd-window-title` / `.rd-window-body` を追加（帯 + 丸 3 つ、`data-tone`）。`hr` を点線に、見出しを display スタックに
- elements: ボタンをピル・太字・枠なしに（hover / active を追加）。入力・チェックボックス・スイッチ・開閉・ダイアログ・トーストを「まど」の形に
- elements: `rd-meter`（experimental、ティア A）を追加。`<meter>` / `<progress>` を包み `--rd-meter-fill` を書く
- wrappers: `RdMeter` を生成
```

## Done criteria

- [ ] `bun run test` 緑（node + browser + react）。Step 0 のテストが green
- [ ] `bun run check` 緑（stylelint `no-palette-token` を含む）。`grep -rn 'rd-color-palette' library/elements/src system/css/src` が 0 件
- [ ] `grep -rn 'rd-color-brand' library/elements/src system/css/src` の一致行に `color:` が **無い**（brand は背景・装飾だけ）
- [ ] `bun run gen` 後 `git status --porcelain` が空。`library/elements/custom-elements.json` に `rd-meter`（`@pe A` / `@status experimental`）
- [ ] `library/react/src/generated/` に `RdMeter`。`bun run test -- --project react` 緑
- [ ] `bun run pe` / `bun run a11y` / `bun run vrt` 緑（ベースライン更新済み）
- [ ] `bunx size-limit` 緑。`bash scripts/guard.sh` 緑
- [ ] story 数が 76 + 8 以上（`bun run storybook:build` 後 `node -e 'console.log(Object.keys(require("./apps/storybook/storybook-static/index.json").entries).length)'`）

## STOP 条件

- 部品の色に必要な semantic トークンが無い（例: 帯の hover）。**tokens を足さず**、必要なトークン名と用途を報告
- `.size-limit.json` の超過が 2 KB を超える部品がある（設計を見直す）
- Vitest browser で `getComputedStyle` の `border-radius` が `9999px` に解決されない（`--rd-radius-full` の出方が違う → 実値を報告）
- dialog の `render()` 変更で既存の `dialog.sr.test.ts` / `e2e/pe/tier-b.spec.ts` が落ちて 2 回直しても通らない
- `bun run vrt:update` が Docker で 2 回続けて失敗

## 保守メモ

- 「まど」の帯の宣言は `.rd-window-title`（light DOM）と `dialog.styles.ts`（shadow）の 2 箇所にある。値を変えるときは両方（トークンを変えれば追随する）
- `brand.*` の上に文字を置かない規則は Done criteria の `grep` で機械検査している。CI に入れるなら `scripts/guard.sh` に 1 検査（別プラン）
- meter は experimental。stable に上げるとき `exports` を `./meter` に移し `./experimental/meter` を 1 メジャー残す（ADR-0009）
- 区分メーター（複数系列）は入れていない。要るときは `rd-meter` を並べて凡例を `<dl>` で出す例を story に足す
