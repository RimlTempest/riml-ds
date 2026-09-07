---
'@rimltempest/riml-ds-lint': patch
---

publish に `stylelint-plugin/` が含まれず、`stylelint-config-standard` / `stylelint-declaration-strict-value` / `postcss-lit` を依存に宣言していなかったため、npm から入れた利用側で共有 stylelint 設定が読めなかった。
