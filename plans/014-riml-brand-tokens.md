# 014: 既定ブランドを riml の色にし、「まど」の形（角丸・硬い影・丸ゴシック）をトークンに入れる

**優先度**: P1（見た目の作り直しの土台）　**規模**: M　**依存**: 013（マージ済み）　**レーン**: `feat/brand-tokens`
**計画時の main**: `3d85de1`

> **Drift check（最初に実行）**:
> `git diff --stat 3d85de1..HEAD -- system/tokens tools/design-md tools/mcp/test/core/tokens.test.ts`
> 差分が出たら読んでから進める（このプランはトークンの**値**を大量に変えるので、他レーンの値変更と衝突しやすい）。

## なぜ

riml-ds の既定の色（accent hue 175 の青緑・neutral hue 200）は足場の仮置きで、誰のブランドでもない。
riml には `RimlTempest/blogs` の `design.md` に定義済みのブランド（青髪赤目のキャラクター由来の 7 色）がある。
既定を riml の色に差し替え、同時に視覚言語「まど」（大きめの角丸・硬い影・丸ゴシックの見出し・タイトルバーの帯）の
**トークン側**を入れる。部品 CSS の作り直しは plan 015、Storybook / VRT の整備は plan 016。

仕様の本体は **`docs/brand.md`**（読んでから始める。値はそこから写す）。決定の記録は `docs/adr/0013-riml-brand-and-mado.md`。

守る不変条件（変えない）:

- **AAA**: `contrastAgainst` を持つトークンは 8 モード全部で文字 7:1 / 非文字 3:1（`system/tokens/test/contrast.test.ts`）
- **テーマは `color.palette.*` だけ**を上書きする（`invariants.test.ts`）
- Web フォントは同梱しない。`font.family.display` はスタック（文字列の配列）だけ

## リポジトリの決まり（守る）

- `any` / `as` / `!` / `enum` / `class` を書かない（oxlint `riml-ds/*`）。テストは vitest、`Result` を返し `throw` しない
- **失敗するテストを先に書く**（red → green）。tokens のテストは `bun run test -- --project node system/tokens`
- `$description` は日本語で「何に使う素材か」。`color.palette.*` は `$extensions.riml-ds.status: "internal"` と `$description` を持つ
- `bun run build`（ルート。tokens → css → elements → gen → …）→ `bun run design-md` の後に `git status` が汚れないこと
  （`DESIGN.md` のフロントマターは生成物。**本文は触らない** — 本文の更新は advisor が別コミットで行う）
- `.changeset/*.md` は手書き。fixed group なので 1 ファイルで `'@rimltempest/riml-ds-tokens': minor`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/brand-tokens`）: `system/tokens/**`、`DESIGN.md`（フロントマターのみ）、
  `tools/mcp/test/core/tokens.test.ts`、`tools/design-md/test/**`、`e2e/__screenshots__/**`（VRT の撮り直し）、`.changeset/`。
  **触らない**: `system/css/**`、`library/**`、`apps/**`、`docs/**`、`plans/README.md`、`skills/**`、`.claude/**`、`tools/design-md/src/**`
- コミットは Conventional Commits、細かく（値の差し替え / 新トークン / テーマ追随 / テスト / VRT の順で 5 コミット程度）

## 現状のコード（抜粋。読んでから触る）

`system/tokens/src/base/color.tokens.json`（palette の 1 段の形。全段この形）:

```json
"neutral": {
  "0": {
    "$value": { "colorSpace": "oklch", "components": [0.99, 0.005, 200] },
    "$description": "最も明るい面。ライトの既定背景・ダークの本文色に使う素材",
    "$extensions": { "riml-ds": { "status": "internal" } }
  },
```

`system/tokens/src/semantic/color.tokens.json`（非文字の検査対象の形）:

```json
"border": {
  "default": {
    "$value": "{color.palette.neutral.500}",
    "$description": "部品と面の既定の境界線",
    "$extensions": { "riml-ds": { "contrastAgainst": "color.surface.default", "nonText": true } }
  },
```

`system/tokens/src/modes/dark.tokens.json` は semantic と同じ id に `$value` だけを持つ（`$description` なし）。
`system/tokens/src/themes/qrcc/color.tokens.json` は `color.palette.*` の `$value` だけ（`$description` / `$extensions` なし）。
`system/tokens/src/themes/noter/color.tokens.json` は `accent.600 = [0.42, 0.09, 175]` の 1 段だけ（既定と同値のプレースホルダ）。

`system/tokens/terrazzo.config.ts:66-83` — `core/duplicate-values` は base 層だけ検査し、semantic は `ignore` リストで除外:

```ts
          ignore: [
            'color.surface.*',
            'color.text.*',
            'color.border.*',
            'color.accent.*',
            'color.focus.*',
            'color.status.**',
            ...
```

固定値を持つテスト（触る）:

- `system/tokens/test/contrast.test.ts:50-52` — `contrastAgainst` 保有トークンは **12**
- `tools/mcp/test/core/tokens.test.ts:20` — 葉の数 **95**
- `tools/design-md/test/frontmatter.test.ts:72` — `neutral-0` = `oklch(0.99 0.005 200)`、`:106` `accent-600` 既定 = `oklch(0.42 0.09 175)`、
  `:129` `info-600` = `oklch(0.44 0.13 240)`（qrcc の `:105` / `:131` は変えない）
- `system/tokens/test/build.test.ts:31-36` — qrcc の `--rd-color-palette-accent-600: oklch(44.29% 0.1571 257)`（変えない）

## Step 0 — 失敗するテストを先に書く（red）

`system/tokens/test/invariants.test.ts` に追加:

```ts
  it('既定が持つ color.palette.* の段を、テーマ（qrcc / noter）も全部持つ（riml の色が混ざらない）', () => {
    const defaults = flatten(JSON.parse(readSrc('base/color.tokens.json')))
      .map((leaf) => leaf.id)
      .toSorted()
    const themes = BRANDS.map((brand) => ({
      brand,
      ids: flatten(JSON.parse(readSrc(`themes/${brand}/color.tokens.json`)))
        .map((leaf) => leaf.id)
        .toSorted(),
    }))
    expect(themes).toEqual(BRANDS.map((brand) => ({ brand, ids: defaults })))
  })

  it('ライトの本文色は既定・浮いた面・窪んだ面のどれの上でも 7:1 以上（brand.md §3）', () => {
    // contrast.test.ts の ratio と同じ計算（culori）。surface.raised / sunken は contrastAgainst に無いのでここで固定する
  })
```

2 つ目は `contrast.test.ts` の `ratio` / `toCss` / `valueIn` を使って `color.text.default` × `color.surface.{default,raised,sunken}` の
`light` を 7 以上で固定する（`contrast.test.ts` に置いてもよい。置き場所は好みで、1 箇所に）。

`system/tokens/test/contrast.test.ts:50-52` の 12 → **15**（文字 11 + 非文字 4）に書き換える。
`tools/mcp/test/core/tokens.test.ts:20` の 95 → **104**。
`tools/design-md/test/frontmatter.test.ts` の既定値 3 箇所を Step 1–2 の値に書き換える
（`neutral-0` → `oklch(0.9701 0.0181 78.24)`、`accent-600` → `oklch(0.42 0.0911 260.53)`、`info-600` → `oklch(0.42 0.07 200)`。
frontmatter は **src の値をそのまま**出す（ガマットマップ前）ことを `:72` の既存期待値で確認できる）。

`bun run test -- --project node system/tokens tools/mcp tools/design-md` → 上記が失敗することを確認。

## Step 1 — `base/color.tokens.json` を riml のパレットに差し替える

`docs/brand.md` §2 の表を写す。**段の追加**: `neutral.700`、`accent.500`、`signature.400`、`signature.500`（`signature` は新しい家族。
`$type` は親の `"palette"` に既にある）。既存段は `components` と `$description` を書き換える。

| id | components | $description |
| --- | --- | --- |
| `neutral.0` | `[0.9701, 0.0181, 78.24]` | 紙。ライトの既定の面・ダークの本文色に使う素材（blogs の cream） |
| `neutral.100` | `[0.99, 0.008, 78]` | 窓。ライトの浮いた面に使う、紙より明るい素材 |
| `neutral.200` | `[0.9178, 0.0393, 57.35]` | 肌。窪んだ面と行の hover に使う素材（blogs の peach） |
| `neutral.300` | `[0.80, 0.015, 78.24]` | ダークの補助テキストと強い境界線に使う素材 |
| `neutral.500` | `[0.60, 0.026, 273.03]` | 境界線に使う素材（面に 3:1 以上） |
| `neutral.600` | `[0.40, 0.025, 273.03]` | ライトの補助テキスト・強い境界線、ダークのタイトルバーに使う素材（blogs の slate） |
| `neutral.700` | `[0.38, 0.045, 270.31]` | インク。ライトの本文とタイトルバーに使う素材（blogs の navy） |
| `neutral.800` | `[0.28, 0.032, 270.31]` | ダークの浮いた面に使う素材 |
| `neutral.900` | `[0.22, 0.03, 270.31]` | ダークの既定の面に使う素材（blogs の navy.deep） |
| `accent.300` | `[0.878, 0.06, 260.53]` | ダークの hover に使う素材 |
| `accent.400` | `[0.80, 0.082, 260.53]` | ダークのアクセント・フォーカスリング・ブランド色に使う素材 |
| `accent.500` | `[0.5915, 0.0911, 260.53]` | 髪の青。ライトの装飾用ブランド色に使う素材（文字は載せない） |
| `accent.600` | `[0.42, 0.0911, 260.53]` | ライトのアクセント塗り・リンク・フォーカスリングに使う素材 |
| `accent.700` | `[0.36, 0.0911, 260.53]` | ライトの hover に使う素材 |
| `signature.400` | `[0.71, 0.19, 25.84]` | ダークの装飾用ブランド赤に使う素材 |
| `signature.500` | `[0.6057, 0.2011, 25.84]` | 赤目。ライトの装飾用ブランド赤に使う素材（文字は載せない） |
| `danger.300` | `[0.86, 0.09, 25.84]` | ダークの hover に使う素材 |
| `danger.400` | `[0.78, 0.13, 25.84]` | ダークの危険色に使う素材 |
| `danger.600` | `[0.43, 0.175, 25.84]` | ライトの危険色に使う素材 |
| `danger.700` | `[0.37, 0.15, 25.84]` | ライトの hover に使う素材 |
| `warning.400` / `warning.600` | `[0.78, 0.10, 75]` / `[0.42, 0.09, 75]` | （既存の文言のまま） |
| `success.400` / `success.600` | `[0.78, 0.11, 150]` / `[0.42, 0.11, 150]` | （既存の文言のまま） |
| `info.400` / `info.600` | `[0.78, 0.11, 200]` / `[0.42, 0.07, 200]` | （既存の文言のまま。色相は主役の青と混ざらないよう 200） |

JSON のキー順は数値順（`"400"` の前に `"300"`）。`signature` は `danger` の前に置く。

`bun run --filter @rimltempest/riml-ds-tokens build` が通ること（Terrazzo の `a11y/min-contrast` AAA と `duplicate-values` がここで効く）。
ガマット外の C（`accent.300` / `signature.400` / `danger.300` / `danger.400` / `danger.600` / `warning.600`）は Terrazzo が sRGB に
マップして出す。**src の値は変えない**（brand.md の表が真実源）。

## Step 2 — semantic / dark を更新し、`brand.*` と `chrome.*` を足す

`semantic/color.tokens.json`:

- `color.text.default` の `$value` を `{color.palette.neutral.700}` に（旧 800）。`$description` はそのまま
- 新設（`color` の直下、`accent` の後に `brand`、`focus` の後に `chrome`）:

```json
"brand": {
  "primary": {
    "$value": "{color.palette.accent.500}",
    "$description": "装飾用のブランド青（髪の色）。窓の丸・区切り・メーターの区分に使う。文字を載せない",
    "$extensions": { "riml-ds": { "contrastAgainst": "color.surface.default", "nonText": true } }
  },
  "signature": {
    "$value": "{color.palette.signature.500}",
    "$description": "装飾用のブランド赤（赤目）。窓の丸の 1 つ目・選択中の目印に使う。文字を載せない・danger の代わりにしない",
    "$extensions": { "riml-ds": { "contrastAgainst": "color.surface.default", "nonText": true } }
  }
},
"chrome": {
  "default": {
    "$value": "{color.palette.neutral.700}",
    "$description": "窓のタイトルバーの帯の色"
  },
  "text": {
    "$value": "{color.palette.neutral.0}",
    "$description": "タイトルバーの帯の上に置く文字色",
    "$extensions": { "riml-ds": { "contrastAgainst": "color.chrome.default" } }
  }
}
```

`modes/dark.tokens.json` に同じ id で `$value` だけ:
`brand.primary` → `{color.palette.accent.400}`、`brand.signature` → `{color.palette.signature.400}`、
`chrome.default` → `{color.palette.neutral.600}`、`chrome.text` → `{color.palette.neutral.0}`。
`text.default` の dark は `{color.palette.neutral.0}` のまま（変更なし）。

`terrazzo.config.ts` の `duplicate-values` の `ignore` に `'color.brand.*'` と `'color.chrome.*'` を足す
（`chrome.default` は `text.default` と同じ値の別名なので、足さないと base 層扱いで落ちる）。

`scripts/core/contrast-pairs.ts` は `contrastAgainst` から pairs を作るので変更不要のはず。`chrome.text` が pairs に入ることを
`bun run --filter @rimltempest/riml-ds-tokens build` の後に `dist/tokens.json` で確認する。

## Step 3 — 形・影・文字

`semantic/shape.tokens.json`: `radius.sm` 0.5rem、`radius.md` 0.75rem、`radius.lg` 1rem（`radius.full` はそのまま）。
`$description` を用途に合わせて更新（brand.md §4 の「使う所」）。

`semantic/elevation.tokens.json`（硬い影。`blur` 0、`spread` 0、右下）:

| id | color | offsetX | offsetY | blur |
| --- | --- | --- | --- | --- |
| `shadow.raised` | `[0.22, 0.03, 270.31]` alpha 0.16 | 0.25rem | 0.25rem | 0 |
| `shadow.overlay` | `[0.22, 0.03, 270.31]` alpha 0.24 | 0.5rem | 0.5rem | 0 |

`base/typography.tokens.json`: `font.family.display` を足す
`["Zen Maru Gothic", "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Kosugi Maru", "Arial Rounded MT Bold", "Nunito", "system-ui", "sans-serif"]`、
`$description`「見出しとタイトルバーの丸ゴシック系スタック。フォントは同梱しない（入っていれば効く）」。

`semantic/typography.tokens.json`: `type.heading.1` / `type.heading.2` の `fontFamily` を `{font.family.display}` に。
`type.body` / `type.small` / `type.mono` は触らない。

> `tools/design-md/src/core/frontmatter.ts:204` は body と同じ family なら `{typography.body.fontFamily}` と書く。
> 変えた見出しは別 family になるので実値が出る。それで正しい。

## Step 4 — テーマを追随させる（qrcc / noter）

Step 0 の新テスト「既定が持つ段をテーマも全部持つ」を通す。テーマは `$value` だけ。

**qrcc**（`themes/qrcc/color.tokens.json`。既存 18 段はそのまま、9 段を足す）:

| id | components | 由来 |
| --- | --- | --- |
| `neutral.700` | `[0.24, 0.013, 265]` | qrcc の本文色（旧 `neutral.800` と同値。`duplicate-values` が落としたら `[0.235, 0.013, 265]`） |
| `accent.500` | `[0.58, 0.15, 255]` | qrcc の青の中間段（装飾用。白に 3:1 以上） |
| `signature.400` / `signature.500` | `[0.72, 0.17, 25]` / `[0.62, 0.19, 25]` | qrcc に印章色は無いので danger と同色相の中間段 |
| `warning.400` / `warning.600` | `[0.78, 0.10, 75]` / `[0.42, 0.09, 75]` | 既定と同じ（テーマが全段持つ規則のため明示） |
| `info.400` / `info.600` | `[0.78, 0.13, 240]` / `[0.42, 0.10, 240]` | qrcc は info を青系（240）のまま |

**noter**（`themes/noter/color.tokens.json`。旧既定の青緑をそのまま引き取る。全 27 段）:

- neutral: `0 [0.99,0.005,200]`、`100 [0.96,0.008,200]`、`200 [0.9,0.012,200]`、`300 [0.8,0.015,200]`、`500 [0.55,0.02,200]`、
  `600 [0.44,0.02,200]`、`700 [0.25,0.02,200]`、`800 [0.27,0.02,200]`、`900 [0.16,0.01,200]`
- accent: `300 [0.86,0.08,175]`、`400 [0.78,0.11,175]`、`500 [0.55,0.10,175]`、`600 [0.42,0.09,175]`、`700 [0.36,0.08,175]`
- signature: `400 [0.72,0.15,25]`、`500 [0.62,0.16,25]`（noter の印章色は未定。仮置き）
- danger: `300 [0.86,0.1,25]`、`400 [0.78,0.17,25]`、`600 [0.44,0.17,25]`、`700 [0.36,0.17,25]`
- warning: `400 [0.78,0.1,75]`、`600 [0.44,0.1,75]`；success: `400 [0.78,0.11,150]`、`600 [0.44,0.11,150]`；info: `400 [0.78,0.13,240]`、`600 [0.44,0.13,240]`

`bun run test -- --project node system/tokens` で **8 モード**のコントラストが全部通ること。
通らない段があったら **L を 0.01 刻みで動かして通す**（色相と彩度は変えない）。それでも通らなければ STOP。

## Step 5 — 再生成・VRT・changeset

1. `bun run build && bun run design-md && bun run gen` → `git status` に `DESIGN.md`（フロントマター）、`library/elements/custom-elements.json` /
   `tools/cem/registry.json`（変わらないはず）以外の未追跡が無いこと。`DESIGN.md` の**本文の diff が出たら STOP**
   （design-md は本文が変わると中止する安全弁を持つ。フロントマターだけの diff が正）
2. `bun run test`（全部）、`bun run check`
3. VRT の撮り直し（色が変わるので 321 枚全部差分が出る。これは想定内）: `bun run vrt:update`（Docker）→ `bun run vrt` が通ること →
   `e2e/__screenshots__` をコミット（ファイル名に OS 名が付いていないこと。`bash scripts/guard.sh` 検査 11）
4. `.changeset/riml-brand-tokens.md`:

```md
---
'@rimltempest/riml-ds-tokens': minor
---

- 既定ブランドを riml の色にした（blogs の 7 色由来。紙 = cream、インク = navy、主役 = 髪の青、印章 = 赤目）。旧既定の青緑は `themes/noter` へ
- `color.brand.primary` / `color.brand.signature`（装飾用・非文字 3:1）、`color.chrome.default` / `color.chrome.text`（タイトルバー）、
  `font.family.display`（丸ゴシック系スタック、同梱なし）、`color.palette.neutral.700` / `accent.500` / `signature.*` を追加
- `radius.sm/md/lg` を 8/12/16px に、`shadow.*` をぼかし 0 の硬い影に、`type.heading.*` を display スタックに
- `color.text.default`（ライト）の参照先を `neutral.700` に。テーマは既定の palette 段を全部持つ（テストで固定）
```

## Done criteria

- [ ] `bun run test -- --project node system/tokens tools/mcp tools/design-md` が緑。`contrast.test.ts` の対象が 15、mcp の葉が 104
- [ ] `bun run build && bun run design-md && bun run gen` 後に `git status --porcelain` が空
- [ ] `grep -c 'rd-color' system/tokens/dist/tokens.css` が増えている（brand 2 + chrome 2 = +4 変数）、`grep 'brand-primary' system/tokens/dist/tokens.css` が `light-dark(` を含む
- [ ] `grep -- '--rd-color-palette-accent-600' system/tokens/dist/themes/qrcc.css` が `oklch(44.29% 0.1571 257)` のまま（qrcc の見た目は動かない）
- [ ] `grep -c 'oklch' system/tokens/dist/themes/noter.css` が 27 以上（noter が全段持つ）
- [ ] `bun run vrt` が緑（撮り直したベースラインで）、`bash scripts/guard.sh` が緑
- [ ] `bun run check` が緑

## STOP 条件

- Terrazzo の `a11y/min-contrast` が brand.md の値で落ちる（表は culori で検算済み。落ちたら計算系の差なので値を動かさず報告）
- `DESIGN.md` の本文に diff が出る（生成器が本文を触っている）
- `postbuild` が新しい家族 `signature` / 新しい semantic グループ `brand` / `chrome` を落とす（`scripts/core/*` に固定の一覧がある場合）
- `bun run vrt:update` が Docker で 2 回続けて失敗する（環境の問題。ベースライン無しで報告）
- テーマの追随で色相・彩度を変えないと通らない段が出る

## 保守メモ

- 以後、palette に段を足したら **qrcc / noter にも同じ段を足す**（テストが落として教える）
- `brand.*` の上に文字を置く CSS は plan 015 以降のレビュー観点（`.claude/skills/riml-ds-css/SKILL.md` に advisor が追記する）
- blogs 側の `design.md` と値がずれたときは `docs/brand.md` §2 の「出自」列を見て、意図した差（AAA のための明度）か
  取り込み漏れかを判断する
