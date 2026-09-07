# 公開手順

## 初回（ユーザーが手元で行う）

npm の Trusted Publishing はパッケージが存在してからしか設定できない。

```bash
bun run release:check                         # 先にゲートを手元で通す
npm login                                     # ブラウザで認証
cd system/tokens && npm publish --access public
cd ../css && npm publish --access public
cd ../../library/elements && npm publish --access public
# 依存の向きに沿って react / vue / svelte / astro → tools/lint も同様
# （tools/mcp は plan 008 でパッケージができてから同じ手順で足す）
```

`npm publish` はローカルの provenance を付けない（`publishConfig.provenance: true` は
CI の OIDC でだけ効く）。手元からの初回だけは来歴無しになるが、以後は CI が付ける。

その後 npmjs.com の各パッケージ → Settings → **Trusted Publisher** → GitHub Actions に
Organization `RimlTempest` / Repository `riml-ds` / Workflow filename `release.yml` を登録する。
**Environment は空欄**（`release.yml` は `environment:` を宣言していない。入れると照合に失敗する）。
あわせて GitHub の Settings → Actions → General → Workflow permissions で
「Read and write permissions」と「Allow GitHub Actions to create and approve pull requests」を ON にする
（`changesets/action/version` が Version PR を作るために必要）。Secrets は追加しない。
npm はユーザー名スコープ `@rimltempest`（既存）を使い、パッケージ名は `riml-ds-<name>`。org は作らない（ユーザー決定 2026-09-07）。

## 以後（自動）

1. PR に `.changeset/*.md`（`bun run changeset`）。破壊的変更（`bun run api-diff` が検出）には
   `0.x` の間は `minor`、`1.0` 以降は `major` の changeset が要る。
2. main にマージすると `release.yml`（`.changeset/**` / `**/package.json` / CHANGELOG の変更で発火）が
   `changesets/action/select-mode@v2` で状態を判定し、changeset が残っていれば **Version PR** を作る／更新する
   （`changesets/action/version@v2`）。
3. Version PR をマージすると同じワークフローが `publish` モードになり、`bun run release:check` → 
   `changesets/action/publish@v2`。`permissions: id-token: write`。npm トークンは無い。provenance は自動。
4. GitHub Release・タグ・CHANGELOG は changesets が書く。
5. 手順「初回」が終わるまで publish モードは 404 / 403 で落ちる。これは想定どおり。

## ゲート（`release.yml` の publish 前）

`bun run release:check` が一括で回す:

```
bun run build
bun run gen && bun run design-md   # CEM → ラッパー → registry.json → DESIGN.md。git diff ゼロを検証
bash scripts/release-check.sh      # 公開パッケージ全部に publint --strict と attw --profile esm-only
                                   # （.css / .astro の入口は型を持たないので attw の対象から外す）
bunx size-limit
bunx knip                          # 除外の理由は scripts/release-check.sh 先頭のコメント
bunx sherif
```

`bun run guard` の検査 13 が、公開パッケージの `publishConfig.access: public` /
`publishConfig.provenance: true` と `@rimltempest/riml-ds-` プレフィックスを固定する。

## サイズ予算（`size-limit`）

| パッケージ / 入口                        | 予算（brotli） |
| ---------------------------------------- | -------------- |
| `@rimltempest/riml-ds-tokens/tokens.css`             | 6 KB           |
| `@rimltempest/riml-ds-css`（全部）                   | 8 KB           |
| `@rimltempest/riml-ds-elements/button/define`（lit 込み）| 12 KB      |
| `@rimltempest/riml-ds-elements/dialog/define`        | 14 KB          |
| `@rimltempest/riml-ds-react`（button のみ import）   | 13 KB          |

超えたら CI が落ちる。上げるときは PR で理由を書く。

## パッケージの形

```jsonc
{
  "name": "@rimltempest/riml-ds-elements",
  "type": "module",
  "sideEffects": ["./dist/**/define.js"],
  "customElements": "custom-elements.json",
  "exports": {
    "./button": { "types": "./dist/button/index.d.ts", "default": "./dist/button/index.js" },
    "./button/define": "./dist/button/define.js",
    "./custom-elements.json": "./custom-elements.json"
  },
  "files": ["dist", "custom-elements.json", "README.md"],
  "publishConfig": { "access": "public", "provenance": true }
}
```
