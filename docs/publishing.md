# 公開手順

## 初回（ユーザーが手元で行う）

npm の Trusted Publishing はパッケージが存在してからしか設定できない。

```bash
npm login                                     # ブラウザで認証
cd system/tokens && npm publish --access public
cd ../css && npm publish --access public
cd ../../library/elements && npm publish --access public
# react / vue / svelte / astro / lint / mcp も同様
```

その後 npmjs.com の各パッケージ → Settings → **Trusted Publisher** に
`RimlTempest/riml-ds` / workflow `release.yml` を登録する。
`@riml-ds` スコープの npm org はユーザーが Web UI で作る（無料、public のみ）。

## 以後（自動）

1. PR に `.changeset/*.md`（`bunx changeset`）。
2. main にマージすると `release.yml` が **Version PR** を作る（`changesets/action`）。
3. Version PR をマージすると同じワークフローが `bun run build` → ゲート → `changeset publish`。
   `permissions: id-token: write`。npm トークンは無い。provenance は自動。
4. GitHub Release と CHANGELOG は changesets が書く。

## ゲート（`release.yml` の publish 前）

```
bun run build
bun run gen           # CEM → ラッパー → registry.json → DESIGN.md フロントマター。diff ゼロを検証
bunx publint --strict （各 package）
bunx attw --pack      （各 package）
bunx size-limit
bunx knip
bunx sherif
```

## サイズ予算（`size-limit`）

| パッケージ / 入口                        | 予算（brotli） |
| ---------------------------------------- | -------------- |
| `@riml-ds/tokens/tokens.css`             | 6 KB           |
| `@riml-ds/css`（全部）                   | 8 KB           |
| `@riml-ds/elements/button/define`（lit 込み）| 12 KB      |
| `@riml-ds/elements/dialog/define`        | 14 KB          |
| `@riml-ds/react`（button のみ import）   | 13 KB          |

超えたら CI が落ちる。上げるときは PR で理由を書く。

## パッケージの形

```jsonc
{
  "name": "@riml-ds/elements",
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
