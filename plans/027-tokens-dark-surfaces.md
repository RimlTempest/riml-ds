# 027: ダークの面を 4 段にする — `neutral.750` / `neutral.950` と、ダークでも見える硬い影

**優先度**: P1　**規模**: M　**依存**: 014（ブランドのトークンが在ること。マージ済み）
**レーン**: `feat/tokens-dark`　**計画時の main**: `b61ee24`（023 マージ後。**024（`feat/form-wave5`）と並行** — そのレーンのファイルには触らない）

> **Drift check（最初に実行）**:
> `grep -c '"950"\|"750"' system/tokens/src/base/color.tokens.json` が **0** であること。出たら STOP。
> `grep -n 'sunken' -A2 system/tokens/src/modes/dark.tokens.json | grep -c 'neutral.900'` が **1** であること（ダークの sunken がまだ既定面と同じ）。
> `grep -c 'light-dark(' system/tokens/scripts/core/fold-light-dark.ts` が **1** であること（`fold()` が 1 か所で畳む）。
> `grep -c 'toHaveLength(110)' tools/mcp/test/core/tokens.test.ts` が **1** であること。
> `system/tokens/src/modes/dark.tokens.json` と `system/tokens/src/base/color.tokens.json` を読み、「現状のコード」の抜粋と見比べる。違っていたら STOP。

## なぜ

ダークモードで**面の段差が消えている**。`docs/tokens.md` に「palette に 900 より暗い段が無い」と書いて先送りにした判断（plan 002）の後始末。

| semantic | ライト | ダーク（いま） | 何が困るか |
| --- | --- | --- | --- |
| `color.surface.default` | `neutral.0`（L 0.97） | `neutral.900`（L 0.22） | — |
| `color.surface.raised` | `neutral.100`（0.99） | `neutral.800`（0.28） | — |
| `color.surface.sunken` | `neutral.200`（0.918） | **`neutral.900`（0.22）= default** | 入力欄・コード領域・`.rd-list-row` の見出し・`rd-slider` の溝・`rd-meter` の溝が**背景に溶ける** |
| `color.surface.hover` | `neutral.200`（0.918） | **`neutral.800`（0.28）= raised** | 窓（raised）の中の行を hover しても**何も変わらない**。riml-ds の画面はほぼ全部が窓の中なので実害が大きい |

ライトは 0 / 100 / 200 の 3 素材で 4 役をまかなえている（hover = sunken でも、既定面・浮いた面のどちらに対しても違う色になる）。
ダークは 900 / 800 の 2 素材しかないので同じ手が使えない。**palette に 2 段足す**:

- **`neutral.950`** — 900 より暗い。ダークの `surface.sunken`
- **`neutral.750`** — 800 と 700 の間。ダークの `surface.hover`（既定面 900 の上でも浮いた面 800 の上でも 1 段明るくなる）

`neutral.700`（L 0.38、インク）を hover に使わないのは、`text.muted`（`neutral.300`、L 0.80）がその上で **5.3:1** になり AAA を割るから。
`neutral.750` の L は「`text.muted` が 7:1 以上」（上限）と「800 から見て段差が分かる」（下限）の間に置く（設計 §1 に数値）。

あわせて**影**。`shadow.raised` / `shadow.overlay` はインク色（`[0.22, 0.03, 270.31]`）alpha 0.16 / 0.24 で、ダークの面（同じ L 0.22）の上では**見えない**。
brand.md §1 の「手ざわりのある = 硬い影」がダークで消えている。ダークの影は**黒 alpha 0.5 / 0.6** にする。
ただし `postbuild` の `light-dark()` 畳み込みは色にしか使えない（`light-dark()` は `<color>` 専用。shadow の値全体を包むと CSS が無効になる）ので、
`fold()` を「**共通の接頭辞 + 末尾の色**」の形なら色だけ包むように拡張する（設計 §3）。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）を `system/tokens/test/contrast.test.ts` が 8 モードで固定している。落とさない。**`contrastAgainst` を減らさない**（増やすのはよい）
- テーマ（qrcc / noter）は既定と**同じ段**を全部持つ（`invariants.test.ts`）。段を足したら 3 か所に足す
- `dist/tokens.json` の葉の数 = src の葉の数（同テスト）。`tools/mcp/test/core/tokens.test.ts` の `110` は **112** になる
- `DESIGN.md` は生成物（`bun run design-md`）。**手で直さない**。`release:check` が `git diff --exit-code DESIGN.md` を見る
- ライトの値は **1 バイトも変えない**（ライトの VRT 画像が変わったら STOP）
- 高コントラスト（`modes/high-contrast.tokens.json`）は alias のまま。触らない

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-tokens/SKILL.md`（あれば）と `docs/tokens.md`、`docs/brand.md` §2〜§5 を読む。
  手本は **`system/tokens/src/modes/dark.tokens.json`**（ダークは semantic を palette の別名で上書きする。生値は書かない）と
  **`system/tokens/src/base/color.tokens.json` の `neutral.800` / `neutral.900`**（`$description` と `$extensions.riml-ds.status: internal` を持つ）
- `any` / `as` / `!` / `class` / `enum` を書かない（`fold-light-dark.ts` を触るとき）。失敗は `Result` で返す（`throw` しない）
- **失敗するテストを先に書く**（tokens は `system/tokens/test/*.test.ts`（Vitest node、`dist/tokens.json` を読む → テストの前に `bun run --filter @rimltempest/riml-ds-tokens build`）、
  fold は `system/tokens/test/postbuild-core.test.ts` に純関数テストがある — その流儀で足す）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/tokens-dark`）: `system/tokens/**`、`DESIGN.md`（**`bun run design-md` の生成結果だけ**）、
  `docs/brand.md`（§2.1 の表・§3 の検査済みの比の表・§5 の影の表**だけ**）、`docs/tokens.md`（「実装で確定した判断」の sunken の 1 項目**だけ**）、
  `tools/design-md/test/**`、`tools/mcp/test/core/tokens.test.ts`（`110` → `112`）、`e2e/__screenshots__/**`（**ダークの画像だけ**）、`.changeset/`
  **触らない**: `system/css/**`、`library/**`、`apps/**`、`tools/mcp/src/**`、`tools/design-md/src/**`（生成器のロジック。段が増えても変えずに済むはず — 変えないと通らないなら STOP）、
  `e2e/**`（`__screenshots__` 以外）、`docs/*.md` の上記以外の箇所、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- コミットは段階ごと（下の Step の粒度）。Conventional Commits
- **並行レーン 024（`feat/form-wave5`）が同時に進んでいる。** 024 は `library/elements/**` と `e2e/__screenshots__/**` に**新しい**画像を足す。
  このレーンは既存のダーク画像を**更新**するだけなので同じファイルは触らないはず。`git merge main` はしてよいが、コンフリクトが出たら**自分で解決せず STOP**

## 現状のコード（抜粋。読んでから触る）

`system/tokens/src/base/color.tokens.json`（`neutral` の段。0 / 100 / 200 / 300 / 500 / 600 / 700 / 800 / 900 の 9 段。**400 は無い**）:

```json
"800": {
  "$value": { "colorSpace": "oklch", "components": [0.28, 0.032, 270.31] },
  "$description": "ダークの浮いた面に使う素材",
  "$extensions": { "riml-ds": { "status": "internal" } }
},
"900": {
  "$value": { "colorSpace": "oklch", "components": [0.22, 0.03, 270.31] },
  "$description": "ダークの既定の面に使う素材（blogs の navy.deep）",
  "$extensions": { "riml-ds": { "status": "internal" } }
}
```

`system/tokens/src/modes/dark.tokens.json`（semantic の上書き。palette の別名だけ）:

```json
"surface": {
  "default": { "$value": "{color.palette.neutral.900}" },
  "raised":  { "$value": "{color.palette.neutral.800}" },
  "sunken":  { "$value": "{color.palette.neutral.900}" },
  "hover":   { "$value": "{color.palette.neutral.800}" }
},
```

テーマの `neutral`（`system/tokens/src/themes/{qrcc,noter}/color.tokens.json`。`$description` は無く、値だけ）:

| 段 | riml（base） | qrcc | noter |
| --- | --- | --- | --- |
| 700 | `[0.38, 0.045, 270.31]` | `[0.24, 0.013, 265]` | `[0.25, 0.02, 200]` |
| 800 | `[0.28, 0.032, 270.31]` | `[0.24, 0.013, 265]` | `[0.27, 0.02, 200]` |
| 900 | `[0.22, 0.03, 270.31]` | `[0.18, 0.012, 265]` | `[0.16, 0.01, 200]` |

`system/tokens/src/semantic/color.tokens.json` の `text.muted`（`contrastAgainst` は 3 面。**hover は入っていない**）:

```json
"muted": {
  "$value": "{color.palette.neutral.600}",
  "$description": "補助テキスト（説明文・単位）の文字色。窓の本体（raised）や入力欄（sunken）の上にも置くので 3 面すべてで 7:1",
  "$extensions": { "riml-ds": { "contrastAgainst": ["color.surface.default", "color.surface.raised", "color.surface.sunken"] } }
},
```

`system/tokens/src/semantic/elevation.tokens.json`（`$type: shadow`。色は生値、alpha 0.16 / 0.24）:

```json
"raised": {
  "$value": {
    "color": { "colorSpace": "oklch", "components": [0.22, 0.03, 270.31], "alpha": 0.16 },
    "offsetX": { "value": 0.25, "unit": "rem" }, "offsetY": { "value": 0.25, "unit": "rem" },
    "blur": { "value": 0, "unit": "rem" }, "spread": { "value": 0, "unit": "rem" }
  },
  "$description": "浮いた面（窓・カード）の硬い影。ぼかさず右下に落とす"
},
```

生成された CSS（`system/tokens/dist/tokens.css`。Terrazzo の出力を `postbuild.ts` が `light-dark()` に畳んだもの）:

```css
--rd-shadow-raised: 0.25rem 0.25rem 0rem 0rem oklch(22% 0.03 270.31 / 0.16);
```

`system/tokens/scripts/core/fold-light-dark.ts` の `fold()`（ライトとダークで値が違えば**値全体**を `light-dark()` で包む）:

```ts
folded.set(
  name,
  darkValue === undefined || darkValue === lightValue
    ? lightValue
    : `light-dark(${lightValue}, ${darkValue})`,
)
```

`system/tokens/test/contrast.test.ts`（8 モード × `contrastAgainst` で 7:1 / 3:1 を固定。`contrastAgainst` を持つトークン数 **15** を数えている）:

```ts
it('contrastAgainst を持つトークンが 15 個ある（テキスト 11 + 非テキスト 4）', () => {
  expect(new Set(cases.map((entry) => entry.foreground)).size).toBe(15)
})
```

`tools/mcp/test/core/tokens.test.ts`: `expect(index.leaves).toHaveLength(110)`。
`tools/design-md/test/frontmatter.test.ts` の `EXPECTED.colors` は「**少なくとも**これを含む」の一覧（`neutral-0` … `neutral-900`）。

`docs/brand.md` §3「検査済みの比」の表（ダーク列の `muted / surface.sunken` = 9.28、`text / surface.sunken` = 15.90 は **sunken = default だった頃の値**）。
`docs/tokens.md` 「実装で確定した判断」の 2 項目め: 「**ダークの `color.surface.sunken` は `neutral.900`（= `surface.default`）**。palette に 900 より暗い段が無い。段を足すのは DESIGN.md の palette 追加＝デザイン判断」。

## 設計（決めてある。変えるなら STOP）

### 1. palette に 2 段足す（riml / qrcc / noter の 3 か所）

| 段 | riml（base） | qrcc | noter | `$description`（base だけ） |
| --- | --- | --- | --- | --- |
| **`750`** | `[0.33, 0.035, 270.31]` | `[0.30, 0.013, 265]` | `[0.32, 0.02, 200]` | ダークの行の hover に使う素材（800 より 1 段明るい） |
| **`950`** | `[0.17, 0.025, 270.31]` | `[0.13, 0.010, 265]` | `[0.11, 0.008, 200]` | ダークの窪んだ面に使う素材（900 より 1 段暗い） |

- JSON の並びは**数値順**（`"700"` → `"750"` → `"800"` → `"900"` → `"950"`）。`$extensions.riml-ds.status: "internal"` を base に付ける（他の段と同じ）
- **`750` の L は調整してよい**が範囲は `[0.31, 0.34]`。Step 2 で `text.muted`（ダーク = `neutral.300`）の hover 上の比が **7.0 未満なら L を下げる**。
  下限 0.31 でも 7:1 を割るなら STOP（`neutral.300` を明るくする案を報告する。muted を動かすのは別の判断）
- **`950` の L は 900 − 0.05**（riml 0.17 / qrcc 0.13 / noter 0.11）。chroma は 900 より少し小さく（暗い所で彩度が乗ると濁る）

### 2. ダークの semantic を付け替える（`modes/dark.tokens.json`）

```json
"surface": {
  "default": { "$value": "{color.palette.neutral.900}" },
  "raised":  { "$value": "{color.palette.neutral.800}" },
  "sunken":  { "$value": "{color.palette.neutral.950}" },
  "hover":   { "$value": "{color.palette.neutral.750}" }
},
```

ライトの `surface.*` / 他の semantic / 高コントラストは**変えない**。

### 3. `text.muted` の `contrastAgainst` に `color.surface.hover` を足す

`semantic/color.tokens.json` の `text.muted` の配列を 4 面にする（`"color.surface.hover"` を末尾に）。`$description` も「4 面すべてで 7:1」に直す。
ライトは `neutral.600` on `neutral.200` = 7.19（既に通る）。ダークは §1 の `750` で通す。`contrastAgainst` を持つトークン数は **15 のまま**（配列が伸びるだけ）。

### 4. ダークの影（`modes/dark.tokens.json` に `shadow` を足す）

```json
"shadow": {
  "$type": "shadow",
  "raised": {
    "$value": {
      "color": { "colorSpace": "oklch", "components": [0, 0, 0], "alpha": 0.5 },
      "offsetX": { "value": 0.25, "unit": "rem" }, "offsetY": { "value": 0.25, "unit": "rem" },
      "blur": { "value": 0, "unit": "rem" }, "spread": { "value": 0, "unit": "rem" }
    }
  },
  "overlay": {
    "$value": {
      "color": { "colorSpace": "oklch", "components": [0, 0, 0], "alpha": 0.6 },
      "offsetX": { "value": 0.5, "unit": "rem" }, "offsetY": { "value": 0.5, "unit": "rem" },
      "blur": { "value": 0, "unit": "rem" }, "spread": { "value": 0, "unit": "rem" }
    }
  }
}
```

寸法はライトと**同じ**（違うのは色だけ。これが §5 の畳み込みの前提）。DTCG の shadow は色の alias を持てないので生値で書く。

### 5. `fold()` が「共通の接頭辞 + 末尾の色」なら色だけ包む（`fold-light-dark.ts`）

```ts
/** `0.25rem 0.25rem 0rem 0rem oklch(…)` のように**末尾が 1 つの色**なら、その前までを接頭辞として返す */
const splitTrailingColor = (value: string): { readonly prefix: string; readonly color: string } | undefined
// 正規表現: /^(.*?)((?:oklch|oklab|color|rgb|hsl|lab|lch)\([^()]*\))$/ に一致し、prefix が空でないとき
```

`fold()` の分岐を 1 つ足す: `lightValue !== darkValue` のとき、両方が `splitTrailingColor` に一致し **`prefix` が同じ**なら
`` `${prefix}light-dark(${lightColor}, ${darkColor})` ``。そうでなければ今までどおり値全体を包む（色トークンはこの分岐に入らない —
`oklch(...)` 単体は `prefix` が空なので `undefined`）。純関数として `export` し、テストは既存の `postbuild-core.test.ts` の流儀で
`foldLightDark()` に **shadow を含む生 CSS** を食わせて出力を固定する。

期待する出力: `--rd-shadow-raised: 0.25rem 0.25rem 0rem 0rem light-dark(oklch(22% 0.03 270.31 / 0.16), oklch(0% 0 0 / 0.5));`
（Terrazzo が出す色の書式は実際の `dist` を見て合わせる。**書式を推測して書かない**）

### 6. 文書

- `docs/brand.md` §2.1 の表に `750` / `950` の 2 行（他の行と同じ列構成。sRGB 近似は `dist/tokens.css` の `color-gamut` の無い `:root` 値を hex に直して書く — culori で計算してよい）、
  §2 の semantic 対応表（`color.surface.sunken` のダーク列を `neutral.950`、`hover` を `neutral.750`）、
  §3「検査済みの比」のダーク列（`text / surface.sunken`、`muted / surface.sunken` を実測値に。`muted / surface.hover` の行を**足す**）、
  §5 の影の表に「ダーク: 黒 alpha 0.5 / 0.6（同じ寸法）」の 1 列か 1 文
- `docs/tokens.md` の該当項目を「**ダークの `color.surface.sunken` は `neutral.950`、`hover` は `neutral.750`**（plan 027。ライトは 3 素材 4 役、ダークは 4 素材 4 役）」に書き換える。
  「hover は 1 段だけ動く」の記述も「ダークは既定面・浮いた面のどちらから見ても 1 段明るい `750`」に直す
- `DESIGN.md` は `bun run design-md` で再生成してコミット（差分は palette の 2 行と、あれば sunken / hover の値のはず。**それ以外が変わったら STOP**）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/tokens-dark` で worktree を作り、その中で作業する。
`bun install --frozen-lockfile` → `git checkout bun.lock`（bun のバージョン差で `optionalPeers` が付くのを戻す）。
**`bun run build` を先に通す**（`bun run gen` / `design-md` / tests は `dist` を読む）。Drift check。`bun run test` が緑であることを確認。

### Step 1 — red: 「ダークの面は 4 つとも違う色」（`test(tokens): dark surfaces must be four distinct colours`）

`system/tokens/test/contrast.test.ts` に追加（`byId` / `valueIn` / `toCss` を使う）:

- `it('ダークの surface.default / raised / sunken / hover は 4 つとも違う色')` — `new Set(4 つの toCss(valueIn(…, 'dark'))).size` が 4。
  `theme-qrcc-dark` / `theme-noter-dark` でも同じ（`it.each`）
- `it('text.muted は surface.hover の上でも 7:1 以上（8 モード）')` — 既存の `cases` は `contrastAgainst` から生成されるので、
  §3 の変更で自動的に生えるが、**先に手で 1 本書いて red を見る**

`bun run --filter @rimltempest/riml-ds-tokens test` → 「4 つとも違う色」が **fail**（sunken = default、hover = raised）。コミット。

### Step 2 — green: palette と dark モード（`feat(tokens): add neutral.750 / 950 and give dark surfaces four steps`）

§1 の 2 段を 3 ファイルに、§2 の付け替え、§3 の `contrastAgainst`。
`bun run --filter @rimltempest/riml-ds-tokens build && bun run --filter @rimltempest/riml-ds-tokens test`。
`contrast.test.ts` の `it.each(cases)` が **全モードで通る**ことを確認（`750` の L はここで詰める）。`invariants.test.ts`（テーマの段が揃う・葉の数）も緑。
`tools/mcp/test/core/tokens.test.ts` の `110` → `112` に直す（red を見てから）。`tools/design-md/test/frontmatter.test.ts` の `EXPECTED.colors` に `neutral-750` / `neutral-950` を足す。
`bun run test` 全体が緑。コミット。

### Step 3 — red → green: 影の畳み込み（`feat(tokens): fold light-dark() into the colour of a shadow`）

red: `system/tokens/test/postbuild-core.test.ts` に「ライトとダークで**色だけ違う shadow** は色だけ `light-dark()` で包む」を足す（§5 の期待出力）。
`bun run --filter @rimltempest/riml-ds-tokens test` で fail（値全体が包まれる）。
green: `splitTrailingColor` と `fold()` の分岐。既存の fold テストが**全部そのまま通る**こと（色トークンの出力は 1 バイトも変わらない）。コミット。

### Step 4 — ダークの影（`feat(tokens): darker hard shadows for the dark scheme`）

§4 を `modes/dark.tokens.json` に。`bun run --filter @rimltempest/riml-ds-tokens build`。
`grep -c 'light-dark(' system/tokens/dist/tokens.css` が Step 2 の時点より **+2**、`grep 'rd-shadow-raised' system/tokens/dist/tokens.css` が
`0.25rem 0.25rem 0rem 0rem light-dark(` で始まること。`build.test.ts` / `postbuild-core.test.ts` 緑。
**Terrazzo が modes の shadow 上書きを受け付けない**（`terrazzo build` がエラー、または dark セクションに `--rd-shadow-*` が出ない）なら、
この Step だけ**戻して**（§4 と §5 は残さず revert）報告に書く — 面の 4 段（Step 1〜2）は独立して価値がある。コミット。

### Step 5 — 文書と生成物（`docs(brand): record neutral.750 / 950 and the dark shadows`）

§6。`bun run design-md` → `git diff --stat DESIGN.md`（palette の追加行と surface の値だけ）。`bun run gen`（`git status --short` に生成物の差分が出ないこと —
tokens は CEM に影響しない）。`bunx oxfmt docs/brand.md docs/tokens.md`（markdown の表を揃える）。コミット。

### Step 6 — VRT（`test(vrt): dark baselines after the surface split`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（Docker。ホストで撮った画像はコミットしない）。
`git status --short e2e/__screenshots__ | grep -v 'vrt-dark' ` が**空**であること（ライト・forced-colors・reduced-motion の画像が変わったら STOP —
ライトの値を触ったことになる）。変わったダーク画像を**全部開いて**、窪んだ面（入力欄・溝・リストの見出し）が既定面と**区別できる**こと、影が見えることを目で確認する。
変わらなかったダーク画像があっても問題ない（sunken / hover / 影を使っていない story）。コミット。

### Step 7 — 仕上げ

`bun run check`、`bun run test`、`bun run a11y`、`bun run release:check`（`DESIGN.md` の差分ゼロ・size-limit: `tokens.css` は 6 KB brotli —
`light-dark()` が 2 本増えて超えるなら 1 KB 上げて changeset に書く）、`bash scripts/guard.sh`。
changeset（`@rimltempest/riml-ds-tokens`: **minor** — 「palette に `neutral.750` / `neutral.950`。ダークの `surface.sunken` / `surface.hover` を別の段に。
ダークの `shadow.*` を黒に。`text.muted` は hover の上でも 7:1」。`@rimltempest/riml-ds-css` / `-elements` は**変更なし**（CSS は変数を参照しているだけ）。

## 完了条件（機械で検査できるもの）

- `bun run --filter @rimltempest/riml-ds-tokens build && bun run test` exit 0
- `grep -c '"750"\|"950"' system/tokens/src/base/color.tokens.json system/tokens/src/themes/qrcc/color.tokens.json system/tokens/src/themes/noter/color.tokens.json` がそれぞれ **2**
- `grep -A1 '"sunken"' system/tokens/src/modes/dark.tokens.json | grep -c 'neutral.950'` = 1、`grep -A1 '"hover"' system/tokens/src/modes/dark.tokens.json | grep -c 'neutral.750'` = 1
- `grep -c 'color.surface.hover' system/tokens/src/semantic/color.tokens.json` ≥ 1（`text.muted` の `contrastAgainst`）
- `git diff main -- system/tokens/src/semantic/color.tokens.json | grep '^-' | grep -v '^---' | grep -c '\$value'` = **0**（ライトの値を変えていない）
- `bun run design-md && git diff --exit-code DESIGN.md` exit 0（再生成済み）
- `git diff --name-only main -- e2e/__screenshots__ | grep -vc vrt-dark` = 0（ダーク以外の画像は変わらない）
- `bun run a11y` exit 0、`bash scripts/vrt.sh` exit 0
- `bun run release:check` exit 0、`bash scripts/guard.sh` exit 0
- （Step 4 を残した場合）`grep -c 'light-dark(oklch' system/tokens/dist/tokens.css` ≥ 1 かつ `grep -c 'light-dark(0' system/tokens/dist/tokens.css` = 0（値全体を包んだ shadow が無い）

## STOP する条件（改善せず報告する）

- `750` の L を 0.31 まで下げても `text.muted`（ダーク）が hover 上で 7:1 に届かない
- ライトの VRT 画像が変わる（`vrt-dark` 以外の差分）
- `tools/design-md/src/**` を変えないと `design-md` が通らない（段の追加で生成器が落ちる）
- `DESIGN.md` の差分に palette / surface 以外が出る
- `git merge main` でコンフリクト
- `terrazzo build` が modes の shadow を受け付けない → Step 4 だけ revert して続行（STOP ではない。報告に書く）

## スコープ外

- `color.border.subtle`（薄い装飾線。`docs/tokens.md` が「別名で足す」と書いているが、この計画の対象ではない）
- ライトの面の見直し・`neutral.400` の追加
- `system/css` / `library/elements` 側で sunken / hover を使う箇所を増やすこと（024 以降）
- 高コントラストモードの sunken / hover の別名（alias のまま。`prefers-contrast: more` で sunken = default に戻したいなら別計画）

## 保守メモ

- ダークは **950 / 900 / 800 / 750** の 4 素材で `sunken / default / raised / hover` の 4 役。ライトは **0 / 100 / 200** の 3 素材で 4 役（hover = sunken）。
  役を増やすときは「ライトで 3 素材に収まるか・ダークで 4 素材に収まるか」を先に見る
- `text.muted` は 4 面（default / raised / sunken / hover）すべてで 7:1 を `contrastAgainst` が固定する。`750` の L を上げると先に割れるのはここ
- `fold()` の「末尾の色だけ包む」分岐は shadow のためのもの。**寸法までダークで変える**と値全体が `light-dark()` に包まれて CSS が無効になる —
  ダークの shadow は色以外をライトと同じにしておく（テストがその形を固定する）
- `neutral.750` / `950` は `status: internal`。CSS から `--rd-color-palette-neutral-750` を直接引いてはいけない（stylelint が落とす）。semantic 経由で使う
