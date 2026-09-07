# @rimltempest/riml-ds-lint

## 0.2.0

### Patch Changes

- [`5a6acb6`](https://github.com/RimlTempest/riml-ds/commit/5a6acb6e99fac2ecf4df7071536bfa554dd6ea89) Thanks [@RimlTempest](https://github.com/RimlTempest)! - publish に `stylelint-plugin/` が含まれず、`stylelint-config-standard` / `stylelint-declaration-strict-value` / `postcss-lit` を依存に宣言していなかったため、npm から入れた利用側で共有 stylelint 設定が読めなかった。
