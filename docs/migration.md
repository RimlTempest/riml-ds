# 移行（qrcc / noter → riml-ds）

段階的に、視覚差分ゼロで始める。

## 段階 1: トークンだけ

qrcc での実例: qrcc2 の `plans/010-riml-ds-tokens-stage1.md` と `docs/adr/0011-riml-ds-tokens.md`。

1. `@rimltempest/riml-ds-tokens` を入れる。**npm 公開前**は riml-ds をビルドしてから
   `cd system/tokens && bun pm pack --destination <app>/vendor/riml-ds --quiet` で tgz を作り、
   アプリ側の `package.json` に `"@rimltempest/riml-ds-tokens": "file:./vendor/riml-ds/rimltempest-riml-ds-tokens-0.1.0.tgz"`
   と書く（`bun install --frozen-lockfile` は tgz の整合性ハッシュを lockfile に持つので CI でも通る）。
   公開後はこの 1 行をバージョン指定に変え、`vendor/` を消す。CSS 側の `@import` 指定子は変わらない。
2. ルート CSS の `@layer` 宣言の**先頭に `rd.tokens`** を足し、既存の import より前で
   `@import "@rimltempest/riml-ds-tokens/tokens.css"; @import "@rimltempest/riml-ds-tokens/themes/qrcc.css";`
   （両ファイルは自分で `@layer rd.tokens { … }` に包まれているので `layer()` を付けない）。
   アプリ側の `color-scheme: light dark;` は消す（riml-ds の `tokens.css` が `:root` に置く）。
3. 既存の `--qrcc-*` を **別名**にする。アプリの CSS は触らず、トークン定義ファイルの値だけを
   `var(--rd-*)` に置き換える：
   ```css
   :root { --qrcc-text: var(--rd-color-text-default); /* … */ }
   ```
   対応表はアプリ側に手書きし、ADR に残す（`tools/migrate` はまだ無い。2 アプリ目で同じ表が要るなら作る）。
   riml-ds に無い概念（qrcc の `--qrcc-measure: 70ch`、見出し 4 段）は生値のまま残し、
   「残したものの一覧」をテストで固定する（qrcc の `shared/ui/src/styles/tokens.test.ts`）。
4. a11y ゲート（各アプリの axe）で差分ゼロを確認。**視覚差分はゼロにならない**（palette を共有するため
   text / border / hover の明度が数 % 動く）。差分は ADR に表で記録し、AAA を満たす側への変化だけ受け入れる。
   受け入れられない差分はテーマ側（`themes/qrcc`）の palette を直す — semantic トークンは触らない。
5. 以後、新しい CSS は `--rd-*` で書く。`--qrcc-*` を足すとテストが落ちるようにしておく。

## 段階 2: 基盤 CSS

`@rimltempest/riml-ds-css` の reset / base に切り替え、アプリ側の reset を消す。`@layer` 順を揃える。

**npm 公開前の注意**: css パッケージの tgz は `peerDependencies` に tokens の固定版（`0.1.0`）を持ち、
bun はそれを registry で解決しようとして 404 になる（`file:` の tokens tgz とは結び付かない）。
段階 2 は npm 公開後に始めるか、アプリ側 `package.json` の `overrides` で tokens を tgz に固定してから始める。

## 段階 3: 共通部品

`rd-button` / `rd-text-field` / `rd-live-region` / `rd-dialog`（experimental の `rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` は stable になってから。スキップリンクは `.rd-skip-link`） を `@rimltempest/riml-ds-react` で
置き換える。1 部品 1 PR。既存の a11y e2e がそのまま通ることを条件にする。

## 段階 4: 独自部品の整理

アプリ固有（qrcc の QR プレビュー、noter のプレゼンス表示）はアプリに残す。2 つ以上のアプリで
使うものだけ `library/elements/experimental` に昇格させる。

## 削除された API の codemod

`tools/migrate/rules/*.yml`（ast-grep）。例：

```yaml
id: rd-button-kind-to-variant
language: html
rule: { pattern: '<rd-button kind="$V">' }
fix: '<rd-button variant="$V">'
```

`bunx @rimltempest/riml-ds-mcp migrate run --from 1 --to 2` で適用。
