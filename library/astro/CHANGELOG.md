# @rimltempest/riml-ds-astro

## 0.2.0

### Minor Changes

- [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7) Thanks [@RimlTempest](https://github.com/RimlTempest)! - **`@status experimental` の部品を専用サブパスに分けた**（ADR-0009）。`rd-select` / `rd-checkbox` /
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

### Patch Changes

- Updated dependencies [[`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3), [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7), [`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3), [`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba), [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234)]:
  - @rimltempest/riml-ds-elements@0.2.0
  - @rimltempest/riml-ds-tokens@0.2.0
  - @rimltempest/riml-ds-css@0.2.0
