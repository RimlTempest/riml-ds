---
'@rimltempest/riml-ds-mcp': patch
---

使用例を `@rimltempest/riml-ds-elements/<name>/contract` から作るようにして、
**`lit` を実行時依存から外した**。`@rimltempest/riml-ds-elements` は
`dependencies` から `devDependencies` に移り（バンドルに取り込む）、`bunx @rimltempest/riml-ds-mcp`
が入れるパッケージが減る。

`rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` の使用例も足した（計 7 部品）。
