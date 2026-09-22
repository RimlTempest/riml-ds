# @rimltempest/riml-ds-lint

## 0.3.1

### Patch Changes

- [#4](https://github.com/RimlTempest/riml-ds/pull/4) [`feac890`](https://github.com/RimlTempest/riml-ds/commit/feac89018dacbc645ffacd9fb1596740885e4eba) Thanks [@RimlTempest](https://github.com/RimlTempest)! - 公開物の修正。0.2.0 / 0.3.0 は `package.json` の依存に `workspace:*` が残ったまま公開され、`@rimltempest/riml-ds-{css,elements,react,vue,svelte,astro,mcp}` はどのパッケージマネージャからもインストールできなかった（`Workspace dependency "@rimltempest/riml-ds-elements" not found`）。0.3.1 から、ほかの riml-ds パッケージへの依存は実際の版範囲（peer は `^0.3.1`）で公開する。利用側は 0.3.1 に上げるだけでよい。コードと見た目の変更は無い。

## 0.3.0

No changes in this release.

## 0.2.0

### Patch Changes

- [`5a6acb6`](https://github.com/RimlTempest/riml-ds/commit/5a6acb6e99fac2ecf4df7071536bfa554dd6ea89) Thanks [@RimlTempest](https://github.com/RimlTempest)! - publish に `stylelint-plugin/` が含まれず、`stylelint-config-standard` / `stylelint-declaration-strict-value` / `postcss-lit` を依存に宣言していなかったため、npm から入れた利用側で共有 stylelint 設定が読めなかった。
