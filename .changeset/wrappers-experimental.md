---
'@rimltempest/riml-ds-react': minor
'@rimltempest/riml-ds-vue': minor
'@rimltempest/riml-ds-svelte': minor
'@rimltempest/riml-ds-astro': minor
---

**`@status experimental` の部品を専用サブパスに分けた**（ADR-0009）。`rd-select` / `rd-checkbox` /
`rd-disclosure` のラッパーは root の index から出なくなり、import 先が変わる（0.x なので minor で入れる）。

```diff
- import { RdButton, RdSelect } from '@rimltempest/riml-ds-react'
+ import { RdButton } from '@rimltempest/riml-ds-react'
+ import { RdSelect } from '@rimltempest/riml-ds-react/experimental'
```

| fw     | stable                | experimental                                   |
| ------ | --------------------- | ---------------------------------------------- |
| react  | `.` / `./client`      | `./experimental` / `./client/experimental`     |
| vue    | `.`（`rdComponents`） | `./experimental`（`rdExperimentalComponents`） |
| svelte | `.`                   | `./experimental`                               |
| astro  | `./<name>.astro`      | `./experimental/<name>.astro`                  |

- Vue の `rdDesignSystem` プラグインが `app.component()` するのは **stable だけ**になった。
  experimental は `rdExperimentalComponents` を利用側が明示的に登録する。`GlobalComponents` の
  型も登録される部品だけを持つ（`<rd-*>` を直接書くときの `IntrinsicElementAttributes` は全部品のまま）
- `<rd-*>` をタグで直接書くときの型（React の `IntrinsicElements`、svelte の `svelteHTML`）は
  全部品を持ち続ける
- **Vue の `v-model` が `<select>` / `<textarea>` でも効くようになった。**
  生成する `onInput` が `HTMLInputElement` のときしか `update:modelValue` を emit しておらず、
  `rd-select` に `v-model` を付けても値が返ってこなかった
