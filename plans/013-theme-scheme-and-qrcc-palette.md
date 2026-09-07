# 013: テーマ × スキームの解決と、`themes/qrcc` に qrcc の実色を入れる

**優先度**: P1（qrcc 実導入の前提）　**規模**: M　**依存**: 012（マージ済みであること）　**レーン**: `feat/theme-scheme`
**計画時の main**: `dfb3dbe`（012 は既にマージ済み。Drift check で 012 由来の差分が出る前提）

> **Drift check（最初に実行）**:
> `git diff --stat dfb3dbe..HEAD -- system/tokens`
> 012 由来の差分（`semantic/typography.tokens.json` に `type.link.underline-offset`、`test/`）は想定内。
> `scripts/core/sections.ts` / `split-themes.ts` / `postbuild.ts` / `terrazzo.config.ts` に差分があったら読んでから進める。

## なぜ

qrcc（`/Users/riml/orca/projects/qrcc2`）が riml-ds のトークンを取り込む段階 1（`docs/migration.md`）は
「視覚差分ゼロ」が条件。ところが今の `themes/qrcc` は既定値と同じ（`dist/themes/qrcc.css` は注記だけ）で、
qrcc のブランド色は **青（accent hue 255 / 中性色 hue 265）**、riml-ds の既定は **緑青（hue 175 / 200）**。
テーマに qrcc の色を入れないと取り込めない。

入れようとすると、テーマの仕組みに 2 つの穴がある:

1. **テーマはライトしか解決されない。** `terrazzo.config.ts` の permutation は `{ theme: 'qrcc' }` だけで、
   `resolutionOrder` は base → semantic → **theme → scheme**。テーマが semantic トークン（例 `color.text.default`）を
   上書きすると、`splitThemes` はライトの差分だけを `themes/qrcc.css` に書く。読み込み側では
   `--rd-color-text-default: light-dark(...)`（tokens.css）が **ライトのリテラル 1 個に置き換わり、ダークが壊れる**。
2. **テーマのコントラストを誰も見ていない。** `test/contrast.test.ts` の `CHECKED_MODES` は
   light / dark / more / more-dark だけ。

対処は 2 段:

- **仕組み**: テーマ × ダークの permutation を足し、`splitThemes` がライト差分とダーク差分を `light-dark()` に畳む。
  `tokens.json` の `$extensions.riml-ds.modes` に `theme-<name>` / `theme-<name>-dark` を出し、コントラスト検査を
  テーマにも掛ける。
- **運用の決まり**: それでも **テーマが上書きできるのは `color.palette.*` だけ**にする（不変条件テストで固定）。
  semantic と `modes/dark` は palette を参照しているので、palette を差し替えればライト・ダーク・高コントラストが
  全部いっしょに追随する。semantic を直接上書きするテーマは、モードの組み合わせごとに値を持たねばならず保守できない。

さらに qrcc が使っていて riml-ds に無い意味色を 2 つ足す（テーマではなく semantic の追加。全ブランド共通）:
`color.surface.hover`（ポインタを載せた面）と `color.status.danger.hover`（破壊的操作の hover）。

## リポジトリの決まり（守る）

- `any` / `as` / `!` / `enum` / `class` を書かない（oxlint `riml-ds/*`）。`scripts/core/*` は純関数で `Result` を返し `throw` しない
- 失敗するテストを先に書く（red → green）。tokens のテストは `bun run test -- --project node system/tokens`
- トークンの `$description` は日本語で「何に使う素材か」。`color.palette.*` は `$extensions.riml-ds.status: "internal"`
- `bun run build`（tokens）→ `bun run design-md` → `bun run gen` の後に `git status` が汚れないこと
- `.changeset/*.md` は手書き。fixed group
- 触ってよいパス（`scripts/lanes.tsv` の `feat/theme-scheme`）: `system/tokens/**`（src / scripts / test / terrazzo.config.ts / README.md）、
  `tools/mcp/test/core/tokens.test.ts`（葉の数 91 を固定しているテスト。トークンを 4 つ足すので **95** に更新する）、
  `.changeset`、生成物の再出力 `DESIGN.md`（フロントマターのみ。dimension の葉は載らないが color は載る）。`docs/**`, `plans/README.md`, `skills/**`, `.claude/**`,
  `system/css/**`, `library/**`, `tools/**` は触らない

## 現状のコード（抜粋。読んでから触る）

`system/tokens/terrazzo.config.ts` の permutations（テーマは 1 つずつ、ライトのみ）:

```ts
        { input: { theme: 'qrcc' }, prepare: (c) => block('/* rd:theme qrcc */\n:root', c) },
        { input: { theme: 'noter' }, prepare: (c) => block('/* rd:theme noter */\n:root', c) },
```

`scripts/core/sections.ts`: `Scope = { light, dark, moreLight, moreDark, compact, theme }`、
`THEME_RE = /rd:theme\s+([a-z0-9-]+)/`、`Section = { scope, theme, gamut, declarations }`。
`scripts/core/split-themes.ts`: テーマ区画を `Scope.light` の baseline と比べて差分だけ `:root { … }` に出す。
`scripts/postbuild.ts`: `modes` Map に `'theme-qrcc'` / `'theme-noter'`（ライト）がある。`emitJson(light, modes)` が
`$extensions.riml-ds.modes[<mode>]` に差分値を書く。
`test/tokens-json.ts`: `MODES = ['light','dark','more','more-dark','compact']`。
`test/contrast.test.ts`: `CHECKED_MODES = ['light','dark','more','more-dark']`、`contrastAgainst` 12 個。

`src/themes/qrcc/color.tokens.json`（現状。semantic を既定値と同じ値で上書きしているだけ）:

```json
{ "color": { "$type": "color", "accent": { "default": { "$value": "{color.palette.accent.600}" }, "hover": { "$value": "{color.palette.accent.700}" }, "text": { "$value": "{color.palette.accent.600}" } } } }
```

## Step 1 — テーマ × ダークの区画を解析できるようにする（sections / splitThemes）

**red**（`test/postbuild-core.test.ts` の `describe('splitThemes')` に追加。既存の `FULL` フィクスチャの形に揃える）:

```ts
  it('テーマのライト差分とダーク差分を light-dark() に畳む', () => {
    const css = `${FULL}
/* rd:theme qrcc dark */
:root {
  --rd-a: navy;
  --rd-b: green;
}
`
    // FULL: light は --rd-a: blue / --rd-b: red、dark は --rd-a: navy、theme qrcc(light) は --rd-b: green
    const result = splitThemes(css)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    // --rd-a: テーマはライト・ダークとも基準と同じ → 出ない
    expect(result.value[0]?.css).not.toContain('--rd-a')
    // --rd-b: ライト green / ダーク green（基準はどちらも red）→ 同じ値なので畳まない
    expect(result.value[0]?.css).toContain('--rd-b: green;')
  })

  it('ライトとダークで違う値はテーマ CSS でも light-dark() になる', () => {
    const css = `${FULL}
/* rd:theme qrcc dark */
:root {
  --rd-a: navy;
  --rd-b: lime;
}
`
    const result = splitThemes(css)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value[0]?.css).toContain('--rd-b: light-dark(green, lime);')
  })
```

`FULL` の中身が上のコメントと違えば、コメントとフィクスチャを実際の `FULL` に合わせて書き直す（テストの意図は変えない）。

**green**:

- `sections.ts`: `Scope` に `themeDark: 'theme-dark'` を足す。`THEME_RE = /rd:theme\s+([a-z0-9-]+)(\s+dark)?/` にして、
  `dark` が付いていれば `Scope.themeDark`。`findSection(sections, Scope.themeDark, Gamut.srgb, name)` で引ける
- `split-themes.ts`: テーマごとに
  - `lightDelta` = テーマ(light) の宣言のうち baseline(light) と違うもの
  - `darkBaseline` = baseline(light) に baseline(dark) を重ねたもの（`foldLightDark` の `merge` と同じ考え方）
  - `darkDelta` = テーマ(dark) の宣言のうち `darkBaseline` と違うもの（テーマ(dark) 区画が無ければ空）
  - 変数名の和集合を辞書順で回し、`l = テーマ(light).get(v) ?? baseline(light).get(v)`、`d = テーマ(dark).get(v) ?? darkBaseline.get(v)`。
    `l === d` なら `v: l`、違えば `v: light-dark(l, d)`。`l` が undefined なら `err({ kind: 'dark-only', name })`（`foldLightDark` と同じエラー形。`SplitThemesError` に足す）
  - 差分ゼロの注記文は今のまま
- `terrazzo.config.ts`: テーマごとに `{ input: { theme: 'qrcc', scheme: 'dark' }, prepare: (c) => block('/* rd:theme qrcc dark */\n:root', c) }` を追加（noter も）
- `postbuild.ts`: `modes` に `['theme-qrcc-dark', setFor({ theme: 'qrcc', scheme: 'dark' })]`、noter も

**Verify**: `bun run test -- --project node system/tokens/test/postbuild-core.test.ts` green。`bun run --filter @rimltempest/riml-ds-tokens build` exit 0。
`cat system/tokens/dist/themes/qrcc.css` はこの時点ではまだ注記だけ（テーマ内容は Step 3）。

## Step 2 — semantic に `color.surface.hover` と `color.status.danger.hover` を足す

**red**（`test/invariants.test.ts` に追加）:

```ts
  it('surface.hover と status.danger.hover がある（qrcc / noter 移行の前提）', () => {
    expect(byId.has('color.surface.hover')).toBe(true)
    expect(byId.has('color.status.danger.hover')).toBe(true)
  })
```

**green**:

`src/base/color.tokens.json` の `palette.danger` に `300` と `700` を追加（既存の `400` / `600` と同じ形、`status: internal`）:

| id | oklch | $description |
| --- | --- | --- |
| `color.palette.danger.300` | `[0.86, 0.1, 25]` | 最も明るい危険色。ダークの hover に使う素材 |
| `color.palette.danger.700` | `[0.36, 0.17, 25]` | 最も暗い危険色。ライトの hover に使う素材 |

`src/semantic/color.tokens.json`:

```json
    "surface": {
      "…既存…",
      "hover": {
        "$value": "{color.palette.neutral.200}",
        "$description": "ポインタを載せた行やカードの背景。sunken と同じ素材だが役割が違う"
      }
    },
    "status": {
      "danger": {
        "default": { "…既存…" },
        "hover": {
          "$value": "{color.palette.danger.700}",
          "$description": "破壊的操作のボタンの hover / pressed の面"
        },
        "text": { "…既存…" }
      }
    }
```

`color.text.on-status` の `contrastAgainst` 配列に `"color.status.danger.hover"` を足す（既存 4 件 → 5 件）。

`src/modes/dark.tokens.json`: `surface.hover` = `{color.palette.neutral.800}`（ダークは明るい方へ 1 段。窪ませない）、
`status.danger.hover` = `{color.palette.danger.300}`。

`src/modes/high-contrast.tokens.json` は触らない（hover は既定値で 7:1 を満たす。Step 4 のテストが確認する）。

**Verify**: `bun run --filter @rimltempest/riml-ds-tokens check` exit 0（`core/duplicate-values` の ignore に `color.surface.*` / `color.status.**` は入っている）。
`bun run test -- --project node system/tokens` green（`contrast.test.ts` の「contrastAgainst を持つトークンが 12 個」は変わらない — on-status は既に持っている）。
`grep -c "rd-color-surface-hover\|rd-color-status-danger-hover" system/tokens/dist/tokens.css` → 2。

## Step 3 — `themes/qrcc` に qrcc の palette を入れる（palette だけ）

**red 1**（`test/invariants.test.ts`）— テーマは palette だけを上書きする:

```ts
  it('テーマ（themes/*/color.tokens.json）は color.palette.* だけを上書きする', () => {
    for (const brand of ['qrcc', 'noter']) {
      const document: unknown = JSON.parse(readSrc(`themes/${brand}/color.tokens.json`))
      const ids = flatten(document).map((leaf) => leaf.id)
      expect(ids.length, brand).toBeGreaterThan(0)
      expect(ids.filter((id) => !id.startsWith('color.palette.')), brand).toEqual([])
    }
  })
```

（`flatten` は `$value` を持つ葉を集める。テーマの葉は `$value` だけで `$description` が無いが `flatten` は許す。）

**red 2**（`test/build.test.ts`）:

```ts
  it('themes/qrcc.css は qrcc の青いアクセントを palette の差し替えとして出す', () => {
    const css = readFileSync(distFile('themes/qrcc.css'), 'utf8')
    expect(css).toContain('--rd-color-palette-accent-600: oklch(44% 0.16 255)')
    expect(css).not.toContain('--rd-color-accent-default')
  })
```

（Terrazzo の oklch 出力書式は `tokens.css` の既存行（例 `--rd-color-palette-accent-600: oklch(42.47% 0.0814 173.2)`）に揃う。
実際の出力が `44%` でなく `44.00%` などになったら **テストの期待値をビルド結果に合わせる**（値そのものは変えない）。）

**green** — `src/themes/qrcc/color.tokens.json` を丸ごと置き換える。値は qrcc の `shared/ui/src/styles/tokens.css`
（oklch、light-dark）を riml-ds の palette の役割に写したもの。**この表のとおりに書く**:

| palette | oklch components | qrcc 側の由来 |
| --- | --- | --- |
| `neutral.0` | `[1, 0, 0]` | `--qrcc-surface`（light）/ `--qrcc-on-accent`（light） |
| `neutral.100` | `[0.975, 0.002, 265]` | `--qrcc-surface-raised`（light） |
| `neutral.200` | `[0.945, 0.004, 265]` | `--qrcc-surface-sunken`（light）。hover（0.93）はこれに寄せる |
| `neutral.300` | `[0.79, 0.012, 265]` | `--qrcc-text-muted`（dark） |
| `neutral.500` | `[0.6, 0.012, 265]` | **qrcc の値ではない。** qrcc の `--qrcc-border` は light 0.72 で白地に 2.48:1（3:1 未満）。両スキームで 3:1 を満たす 0.6 にする |
| `neutral.600` | `[0.415, 0.012, 265]` | `--qrcc-text-muted`（light） |
| `neutral.800` | `[0.24, 0.013, 265]` | `--qrcc-surface-raised`（dark）。light の本文（0.2）はこれに寄せる（16:1 のまま） |
| `neutral.900` | `[0.18, 0.012, 265]` | `--qrcc-surface`（dark） |
| `accent.300` | `[0.89, 0.11, 250]` | `--qrcc-accent-hover`（dark） |
| `accent.400` | `[0.83, 0.13, 250]` | `--qrcc-accent`（dark） |
| `accent.600` | `[0.44, 0.16, 255]` | `--qrcc-accent`（light） |
| `accent.700` | `[0.36, 0.16, 255]` | `--qrcc-accent-hover`（light） |
| `danger.300` | `[0.89, 0.12, 25]` | `--qrcc-danger-hover`（dark） |
| `danger.400` | `[0.83, 0.14, 25]` | `--qrcc-danger`（dark） |
| `danger.600` | `[0.44, 0.19, 25]` | `--qrcc-danger`（light） |
| `danger.700` | `[0.36, 0.19, 25]` | `--qrcc-danger-hover`（light） |
| `success.400` | `[0.83, 0.13, 150]` | `--qrcc-success`（dark） |
| `success.600` | `[0.42, 0.13, 150]` | `--qrcc-success`（light） |

書式（1 件の例。`$type` はグループに付いているので葉には不要。`$description` / `$extensions` は base の定義を継承するので書かない）:

```json
{
  "color": {
    "palette": {
      "neutral": {
        "0": { "$value": { "colorSpace": "oklch", "components": [1, 0, 0] } },
        "100": { "$value": { "colorSpace": "oklch", "components": [0.975, 0.002, 265] } }
      },
      "accent": { "…" },
      "danger": { "…" },
      "success": { "…" }
    }
  }
}
```

`warning` / `info` は qrcc に無いので触らない（riml-ds 既定のまま）。

`src/themes/noter/color.tokens.json` も **palette だけ**の形にする。noter はまだ色を決めていないので、
既定値と同じ `accent.600` を 1 件だけ書く（`[0.42, 0.09, 175]`。`dist/themes/noter.css` は引き続き注記だけになる）:

```json
{ "color": { "palette": { "accent": { "600": { "$value": { "colorSpace": "oklch", "components": [0.42, 0.09, 175] } } } } } }
```

**既知の差（qrcc から見た視覚差分。qrcc 側の plan に写す）**:
ダーク本文 0.955 → 1.0、ライト本文 0.2 → 0.24、ライト hover 面 0.93 → 0.945、ダーク sunken 0.14 → 0.18、
ダーク border-strong 0.66 → 0.79、ライト border-strong 0.55 → 0.415、border 0.72/0.48 → 0.6/0.6、
フォーカスリング 0.44 0.2 255 → accent と同じ 0.44 0.16 255（dark 0.86 0.16 250 → 0.83 0.13 250）。
すべて AAA を満たす側への変更（Step 4 で機械的に確認する）。

**Verify**: `bun run --filter @rimltempest/riml-ds-tokens check` exit 0、`build` exit 0。
`grep -c -- '--rd-color-palette' system/tokens/dist/themes/qrcc.css` → 18。
`grep -c 'light-dark' system/tokens/dist/themes/qrcc.css` → 0（palette はスキームで変わらない）。

## Step 4 — コントラスト検査をテーマに掛ける

**red**（`test/contrast.test.ts`）:

- `test/tokens-json.ts` の `MODES` に `'theme-qrcc', 'theme-qrcc-dark', 'theme-noter', 'theme-noter-dark'` を足す
- `CHECKED_MODES` に同じ 4 つを足す
- 追加のテスト:

```ts
  it('qrcc テーマの本文と面はライト・ダークとも 7:1 以上（移行時に既定より落ちない）', () => {
    const text = byId.get('color.text.default')
    const surface = byId.get('color.surface.default')
    expect(text && surface).toBeTruthy()
    if (!text || !surface) {
      return
    }
    for (const mode of ['theme-qrcc', 'theme-qrcc-dark'] as const) {
      expect(ratio(toCss(valueIn(text, mode)), toCss(valueIn(surface, mode))), mode).toBeGreaterThanOrEqual(7)
    }
  })
```

（`ratio` / `toCss` / `valueIn` は同ファイルの既存ヘルパ。`as const` は `const` アサーションで、`.oxlintrc.json` の `riml-ds/no-as` が
許しているか確認する — 許していなければ `const THEME_MODES: readonly Mode[] = [...]` にする。）

**green**: Step 1 で `postbuild.ts` の `modes` に theme × dark を足してあるので `tokens.json` にモード値が出ているはず。
`emitJson` がモードの差分を `$extensions.riml-ds.modes` に書く条件を確認し、theme モードも書かれることを確かめる
（書かれていなければ `emit.ts` を直す。差分が無いモードはキーごと省く現状の挙動は維持）。

**Verify**: `bun run test -- --project node system/tokens/test/contrast.test.ts` green。既存の `cases` が theme モードでも全部通る
（qrcc の palette は上の表の値で事前に検算済み: 最小は `color.text.on-status` × `status.success.default`（light）7.97:1、
非テキストの最小は border 0.6 × 白 3.95:1）。落ちたら **どの pair か報告して STOP**（値の調整は計画側の仕事）。

## Step 5 — 再生成・changeset

```bash
bun run build && bun run design-md && bun run gen && git status --short
```

出るのは `system/tokens/**`, `DESIGN.md`（フロントマター: トークン数と一覧）, `.changeset/…` だけ。

`.changeset/theme-scheme-and-qrcc-palette.md`:

```md
---
'@rimltempest/riml-ds-tokens': minor
---

- テーマがダークも解決するようになった。`themes/<brand>.css` はライトとダークの差分を `light-dark()` に畳む
- テーマが上書きできるのは `color.palette.*` だけ（テストで固定）。semantic と `modes/*` は palette を参照する
- `color.surface.hover` / `color.status.danger.hover`（と `palette.danger.300/700`）を追加
- `themes/qrcc` に qrcc（青 / hue 255）の palette を入れた。`tokens.json` の `$extensions.riml-ds.modes` に
  `theme-<brand>` / `theme-<brand>-dark` が出る
```

`system/tokens/README.md` にテーマの節があれば「palette だけ上書きする」決まりを 2〜3 行足す（無ければ触らない）。

## Done criteria

| コマンド | 期待 |
| --- | --- |
| `bun run check` | exit 0 |
| `bun run test` | 全 green（012 後の 490 + 新規 ≥ 6） |
| `bun run gen && bun run design-md && git status --short` | 空 |
| `bash scripts/guard.sh` | exit 0 |
| `bun run release:check` | exit 0 |
| `grep -c -- '--rd-color-palette' system/tokens/dist/themes/qrcc.css` | 18 |
| `grep -c 'light-dark' system/tokens/dist/themes/qrcc.css` | 0 |
| `grep -c '移行時にここへ' system/tokens/dist/themes/noter.css` | 1 |
| `grep -c 'theme-qrcc-dark' system/tokens/dist/tokens.json` | ≥ 1 |
| `bun run vrt` | 全 pass（Storybook は既定テーマなので変わらないはず。差分が出たら STOP） |

## STOP 条件

- Terrazzo が `{ theme, scheme }` の 2 軸 permutation を受け付けない（`PERMUTATIONS` にキーが出ない）
- テーマ側の palette 上書きが `core/duplicate-values` や `a11y/min-contrast` に落ちる（どの rule / どの pair かを報告）
- Step 4 で既存 pair がテーマモードで 7:1 / 3:1 を割る
- VRT に差分が出る

## 保守メモ

- 新しいブランドは `src/themes/<brand>/color.tokens.json`（palette のみ）＋ `riml-ds.resolver.json` の `theme.contexts` ＋
  `terrazzo.config.ts` の permutation 2 件（light / dark）＋ `postbuild.ts` の `modes` 2 件＋ `test/tokens-json.ts` の `MODES`。
  5 か所を 1 PR で。忘れると `themes/<brand>.css` が出ないか、コントラスト検査から漏れる
- 高コントラスト × テーマは permutation を作っていない。`modes/high-contrast` は semantic 同士の参照
  （`text.muted → text.default` など）なので palette 差し替えで自動的に追随するが、機械検査はしていない
- qrcc の `--qrcc-border`（light 0.72）は 3:1 を割っていた。riml-ds に寄せると境界線が濃くなる。qrcc の VRT/目視で
  「濁った」と感じたら、0.6 と 0.72 の間で 3:1 を保つ値を探す（0.66 で約 3.2:1）
