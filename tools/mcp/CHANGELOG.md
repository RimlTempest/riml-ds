# @rimltempest/riml-ds-mcp

## 0.2.0

### Minor Changes

- [`4d3fe2c`](https://github.com/RimlTempest/riml-ds/commit/4d3fe2caeca840f17bc3776d373f9db90afbdab4) Thanks [@RimlTempest](https://github.com/RimlTempest)! - エージェント向けの面として `@rimltempest/riml-ds-mcp` を追加した。

  - MCP サーバ（stdio、`bunx @rimltempest/riml-ds-mcp`）：resource 6 種（`riml-ds://tokens`、
    `riml-ds://tokens/{path}`、`riml-ds://elements`、`riml-ds://elements/{tag}`、
    `riml-ds://guidelines/{topic}`、`riml-ds://design-md`）と tool 5 種（`search_tokens` /
    `get_element` / `check_contrast` / `suggest_component` / `lint_css`）。生成物を読むだけで、
    実行時にネットワークへ出ない（ADR-0010）
  - `design-md` サブコマンド：`tokens.json` + `themes/<brand>` の差分から利用側の `DESIGN.md` を作る

### Patch Changes

- [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7) Thanks [@RimlTempest](https://github.com/RimlTempest)! - 使用例を `@rimltempest/riml-ds-elements/<name>/contract` から作るようにして、
  **`lit` を実行時依存から外した**。`@rimltempest/riml-ds-elements` は
  `dependencies` から `devDependencies` に移り（バンドルに取り込む）、`bunx @rimltempest/riml-ds-mcp`
  が入れるパッケージが減る。

  `rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` の使用例も足した（計 7 部品）。
  `@status experimental` の部品の例は `@rimltempest/riml-ds-{react,vue,svelte}/experimental`（React の client 版は `/client/experimental`）と
  `@rimltempest/riml-ds-astro/experimental/<name>.astro` から import するようになった（それまでは解決できない root のパスを出していた）。

- Updated dependencies [[`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba), [`5a6acb6`](https://github.com/RimlTempest/riml-ds/commit/5a6acb6e99fac2ecf4df7071536bfa554dd6ea89), [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234)]:
  - @rimltempest/riml-ds-tokens@0.2.0
  - @rimltempest/riml-ds-lint@0.2.0
