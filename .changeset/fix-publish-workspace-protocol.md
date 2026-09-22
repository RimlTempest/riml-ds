---
'@rimltempest/riml-ds-tokens': patch
'@rimltempest/riml-ds-css': patch
'@rimltempest/riml-ds-elements': patch
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
'@rimltempest/riml-ds-lint': patch
'@rimltempest/riml-ds-mcp': patch
---

公開物の修正。0.2.0 / 0.3.0 は `package.json` の依存に `workspace:*` が残ったまま公開され、`@rimltempest/riml-ds-{css,elements,react,vue,svelte,astro,mcp}` はどのパッケージマネージャからもインストールできなかった（`Workspace dependency "@rimltempest/riml-ds-elements" not found`）。0.3.1 から、ほかの riml-ds パッケージへの依存は実際の版範囲（peer は `^0.3.1`）で公開する。利用側は 0.3.1 に上げるだけでよい。コードと見た目の変更は無い。
