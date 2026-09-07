---
'@rimltempest/riml-ds-mcp': patch
---

使用例を `@rimltempest/riml-ds-elements/<name>/contract` から作るようにして、
**`lit` を実行時依存から外した**。`@rimltempest/riml-ds-elements` は
`dependencies` から `devDependencies` に移り（バンドルに取り込む）、`bunx @rimltempest/riml-ds-mcp`
が入れるパッケージが減る。

`rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` の使用例も足した（計 7 部品）。
`@status experimental` の部品の例は `@rimltempest/riml-ds-{react,vue,svelte}/experimental`（React の client 版は `/client/experimental`）と
`@rimltempest/riml-ds-astro/experimental/<name>.astro` から import するようになった（それまでは解決できない root のパスを出していた）。
