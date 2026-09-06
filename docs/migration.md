# 移行（qrcc / noter → riml-ds）

段階的に、視覚差分ゼロで始める。

## 段階 1: トークンだけ

1. `bun add @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css`
2. ルート CSS で `@import "@rimltempest/riml-ds-tokens/tokens.css"; @import "@rimltempest/riml-ds-tokens/themes/qrcc.css";`
3. 既存の `--qrcc-*` を **別名**にする：
   ```css
   @layer rd.overrides {
     :root { --qrcc-color-text: var(--rd-color-text-default); /* … */ }
   }
   ```
   `tools/migrate/alias-map.<brand>.json` に対応表を置き、`bunx @rimltempest/riml-ds-mcp migrate alias --brand qrcc`
   で生成する。
4. VRT（各アプリの Playwright）で差分ゼロを確認。差分が出たらテーマ側（`themes/qrcc`）を直す。
5. 以後、新しい CSS は `--rd-*` で書く。`--qrcc-*` の出現数を CI で単調減少にする。

## 段階 2: 基盤 CSS

`@rimltempest/riml-ds-css` の reset / base に切り替え、アプリ側の reset を消す。`@layer` 順を揃える。

## 段階 3: 共通部品

`rd-button` / `rd-text-field` / `rd-live-region` / `rd-dialog`（スキップリンクは `.rd-skip-link`） を `@rimltempest/riml-ds-react` で
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
