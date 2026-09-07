# @rimltempest/riml-ds-elements

## 0.2.0

### Minor Changes

- [`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3) Thanks [@RimlTempest](https://github.com/RimlTempest)! - `rd-dialog` の `dismissible`（既定 true）を **`persistent`（既定 false）に反転**した。
  boolean 属性は HTML で「無い = false」しか表せず、`dialogMarkup({ dismissible: false })` が
  属性を省くだけで既定の true のまま立ち上がる欠陥があったため（0.x なので破壊的変更を今のうちに入れる）。

  ```diff
  - <rd-dialog>            <!-- 閉じられる（既定） -->
  - <!-- 閉じられない指定は属性で書けなかった -->
  + <rd-dialog>            <!-- 閉じられる（既定） -->
  + <rd-dialog persistent> <!-- Esc も背面クリックも受けない -->
  ```

  `rd-live-region` の shadow root を `serializable: true` にした。
  `getHTML({ serializableShadowRoots: true })` に読み上げノードが出るようになり、
  描画後 HTML の検査（markuplint）で live region が見えるようになる。

- [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7) Thanks [@RimlTempest](https://github.com/RimlTempest)! - 契約（`markup()` / `contract`）だけを出す **`./<name>/contract` サブパス**を足した
  （experimental は `./experimental/<name>/contract`）。ティア A/B の 6 部品
  （button / text-field / dialog / select / checkbox / disclosure）が対象。

  ```ts
  // 部品の class は要らず、マークアップだけが欲しいとき（SSR・ドキュメント・コード生成）
  import { markup } from '@rimltempest/riml-ds-elements/button/contract'
  ```

  `./<name>` の index は Lit の class を re-export するので、読むだけで `lit` が実行時依存になる。
  契約サブパスは `_shared/markup.ts` と型しか読まないので `lit` を引き込まない。既存の
  `./<name>` / `./<name>/define` / `./<name>/style.css` はそのまま。

- [`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3) Thanks [@RimlTempest](https://github.com/RimlTempest)! - 部品の第 2 波として `rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` を
  **`@status experimental`** で追加した。import は
  `@rimltempest/riml-ds-elements/experimental/<name>`（+ `/define`、ティア A は `/style.css`）だけ
  （ADR-0009。stable に上がると `./<name>` に移り、experimental のパスは 1 メジャー残る）。

  - `rd-select`（ティア A）— 子の `<label for>` + `<select>` を包む。ヒント・エラー文言・
    `:state(invalid)` は `rd-text-field` と同じ共通ロジック。見た目はネイティブのまま
    （customizable `<select>` は Baseline 外）。`value` 属性は初期選択
  - `rd-checkbox`（ティア A）— `<label>` が `<input type="checkbox">` を包む契約。`switch` 属性で
    `role="switch"` と見た目だけを変える（JS が無ければチェックボックスとして動く）。
    `indeterminate` はプロパティ委譲
  - `rd-disclosure`（ティア A）— 子の `<details>` / `<summary>` を包む。JS 無しでも開閉でき、
    `group`（`<details name>`）で排他アコーディオンになる。`rd-toggle` を発火する
  - `rd-toast`（ティア C）— 表示だけを持ち、読み上げは `rd-live-region` に委譲する（ADR-0008 §6）。
    `popover` があれば最前面に出る。自動で消す時間はフォーカス／ホバー中は止まる（WCAG 2.2.1）

  `@rimltempest/riml-ds-{react,vue,svelte,astro}` は CEM とマークアップ契約から生成しているので、
  同じ 4 部品のラッパー（`RdSelect` / `RdCheckbox` / `RdDisclosure`）が自動で増える。
  バージョンは fixed 指定なので 4 パッケージも一緒に上がる。

### Patch Changes

- Updated dependencies [[`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba), [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234)]:
  - @rimltempest/riml-ds-tokens@0.2.0
