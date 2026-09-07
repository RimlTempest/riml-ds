---
'@rimltempest/riml-ds-elements': minor
---

部品の第 2 波として `rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` を
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
