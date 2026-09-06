# markuplint runner（TypeScript 6 隔離）

markuplint は `@typescript-eslint/typescript-estree` 経由で TypeScript の programmatic API を
使う。TypeScript 7（tsgo）はその API を持たないため、ルートの TS 7 と同居させると動かない
（[ADR-0006](../../docs/adr/0006-toolchain.md)）。そこでこのディレクトリだけを
**ルートの Bun workspaces から外し**（root `package.json` の `"!tools/markuplint"`）、
TypeScript 6 を持つ独立インストールにしている。ルートの `postinstall` が
`bun install --cwd tools/markuplint` を走らせる。

検査対象は lit-html のテンプレートではなく、**描画後の HTML**（Storybook の story を開いて
`getHTML({ serializableShadowRoots: true })` で吐いたもの）。テンプレートの静的解析より、
条件分岐後の実物を見るほうが正確だから。

ルートから呼ぶ `bun run lint:html` は plan 005（Storybook レーン）が足す。単体では:

```bash
node tools/markuplint/node_modules/markuplint/bin/markuplint.mjs \
  --config .markuplintrc.json 'apps/storybook/rendered/**/*.html'
```

ルール本体は ルートの `.markuplintrc.json`。`required-h1` は false（story の描画断片に h1 は無い）。
