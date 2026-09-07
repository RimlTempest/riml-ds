---
'@rimltempest/riml-ds-elements': minor
---

契約（`markup()` / `contract`）だけを出す **`./<name>/contract` サブパス**を足した
（experimental は `./experimental/<name>/contract`）。ティア A/B の 6 部品
（button / text-field / dialog / select / checkbox / disclosure）が対象。

```ts
// 部品の class は要らず、マークアップだけが欲しいとき（SSR・ドキュメント・コード生成）
import { markup } from '@rimltempest/riml-ds-elements/button/contract'
```

`./<name>` の index は Lit の class を re-export するので、読むだけで `lit` が実行時依存になる。
契約サブパスは `_shared/markup.ts` と型しか読まないので `lit` を引き込まない。既存の
`./<name>` / `./<name>/define` / `./<name>/style.css` はそのまま。
