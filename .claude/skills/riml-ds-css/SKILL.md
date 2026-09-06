---
name: riml-ds-css
description: riml-ds の CSS 規約。system/css や部品の *.styles.ts を書く・直す前に読む。プレーン CSS、@layer の固定順、--rd-* トークン以外の生値禁止、論理プロパティのみ、Baseline Widely 以外は @supports、モーションは prefers-reduced-motion の中だけ。「stylelint が落ちた」「どのレイヤーに書くか」「@supports が要るか」「ダーク/強制配色でどう書くか」で発火。
---

# riml-ds CSS 規約

根拠は [ADR-0004](../../../docs/adr/0004-plain-css-layers-baseline.md)、機能の可否は
[docs/baseline.md](../../../docs/baseline.md)、判断は
[system/guidelines/](../../../system/guidelines/)。stylelint（`tools/lint/stylelint.config.js`）が
機械的に落とす。

## 0. まずこれだけ

| やること                                            | やらないこと                                   |
| --------------------------------------------------- | ---------------------------------------------- |
| `var(--rd-color-text-default)`                      | `#333`、`oklch(…)`、`16px`、`200ms` の生値     |
| `margin-inline-start`、`inset-block-end`            | `margin-left`、`bottom`                        |
| `@layer rd.components { … }`                        | `!important`、詳細度を上げるための重複セレクタ |
| `@supports (field-sizing: content) { … }`           | Newly の機能を無条件に書く                     |
| `@media (prefers-reduced-motion: no-preference) { transition: … }` | 無条件の `transition` / `animation` |
| `light-dark()` はトークン側。部品は変数を参照するだけ| 部品の中で `@media (prefers-color-scheme)`     |
| `:state(open)`（`@supports selector` の中）+ `[open]` フォールバック | class の付け替え              |

## 1. レイヤー

```css
/* @rimltempest/riml-ds-css/layers.css — 利用側が最初に読み込む */
@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;
```

| レイヤー         | 中身                                          | 誰が書くか            |
| ---------------- | --------------------------------------------- | --------------------- |
| `rd.reset`       | 最小リセット（box-sizing、margin 0、media）    | `system/css`          |
| `rd.tokens`      | `:root { --rd-… }`（生成物）                  | `system/tokens`       |
| `rd.base`        | `html` / `body` / 見出し / リンク / フォーカス | `system/css`          |
| `rd.components`  | 部品（shadow 内でも同名レイヤーを宣言）        | `library/elements`    |
| `rd.utilities`   | `.rd-visually-hidden` 等、少数                | `system/css`          |
| `rd.overrides`   | 空。利用側がここより後に自分のレイヤーを置く   | 利用側                |

shadow 内でも `@layer rd.components { :host { … } }` で書く。レイヤー名を揃えると、利用側が
`::part()` で上書きするときの優先順位が読める。

## 2. 生値禁止の例外

`0`、`1px`（罫線）、`100%`、`auto`、`inherit`、`initial`、`unset`、`currentColor`、`transparent`、
`none`、`1`（`line-height` の倍率ではなく `flex: 1` 等）。それ以外を書きたくなったら
**トークンが足りない**サイン。`riml-ds-tokens` に従って足す。

`color-mix()` は許可されるが、引数は必ずトークン：
`color-mix(in oklch, var(--rd-color-accent-default), transparent 8%)`。

## 3. 部品の CSS はティアで置き場が決まる（ADR-0012）

| ティア | 置き場                  | 形                                                                 |
| ------ | ----------------------- | ------------------------------------------------------------------ |
| A      | `<name>.css`（light DOM） | `@layer rd.components { rd-text-field { display: block } rd-text-field > input { … } rd-text-field > input:user-invalid { … } }` |
| B      | `<name>.css` + `<name>.styles.ts` | `.css` は `rd-dialog:not(:defined) { display: block }` など定義前の見え方だけ。枠は `styles.ts` |
| C      | `<name>.styles.ts`（shadow） | 下の型                                                          |

ティア A のセレクタは **`rd-<name> > <native>` の 1 段**に留める（利用側のクラスや ID を仮定しない）。
`rd-<name>` 自身に `display` を必ず書く（未定義でも `inline` にならない）。stylelint は `.css` も `css` タグ付きテンプレート も同じ規則で見る。

### 3.1 ティア C の `*.styles.ts` の型

```ts
import { css } from 'lit'
export const styles = css`
  @layer rd.components {
    :host {
      display: inline-flex;
      container-type: inline-size;
    }
    :host([hidden]) { display: none; }
    [part='control'] {
      min-block-size: var(--rd-sizing-target-min);
      padding-block: var(--rd-space-2);
      padding-inline: var(--rd-space-4);
      border: var(--rd-border-width-default) solid var(--rd-color-border-default);
      border-radius: var(--rd-radius-md);
      background: var(--rd-color-surface-default);
      color: var(--rd-color-text-default);
      font: inherit;
    }
    [part='control']:focus-visible {
      outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color);
      outline-offset: var(--rd-focus-ring-offset);
    }
    @media (prefers-reduced-motion: no-preference) {
      [part='control'] { transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard); }
    }
    @media (forced-colors: active) {
      [part='control'] { border-color: ButtonText; }
      [part='control']:focus-visible { outline-color: Highlight; }
    }
    @supports selector(:state(loading)) {
      :host(:state(loading)) [part='control'] { cursor: progress; }
    }
    @supports not selector(:state(loading)) {
      :host([loading]) [part='control'] { cursor: progress; }
    }
  }
`
```

- `:host` に `display` を必ず書く（custom element の既定は `inline`）。
- `:host([hidden])` を必ず書く。
- `font: inherit` で利用側のタイポグラフィを継承する。部品がフォントサイズを決めない
  （`size` 属性で相対指定するだけ）。
- `::part()` で上書きされる要素には `part` 属性を付け、CEM の `@csspart` に書く。
- 利用側が触ってよい変数は `--rd-<component>-<prop>` で `:host` に既定値を置き、`@cssprop` に書く。

## 4. モード

| モード           | 部品が書くこと                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| ダーク           | **何も書かない**（トークンが `light-dark()`）                           |
| 高コントラスト   | 原則書かない（トークン側）。境界を太くする必要があれば `@media (prefers-contrast: more)` |
| 強制配色         | `@media (forced-colors: active)` でシステム色。**必ず書く**（枠・フォーカス・選択状態） |
| 密度             | 何も書かない（`--rd-space-*` が変わる）                                 |
| 低モーション     | `no-preference` の中にだけモーションを書く                              |
| RTL              | 論理プロパティで自動。アイコンの向きは `:host(:dir(rtl))` で反転        |

## 5. レスポンシブ

- 部品内は `@container (inline-size < 20rem) { … }`。`@media` の幅は使わない。
- 折り返し既定：`flex-wrap: wrap`。
- 画像・SVG：`max-inline-size: 100%; block-size: auto;`。

## 6. 落ちたときの読み方

| stylelint のメッセージ                                | 直し方                                        |
| ----------------------------------------------------- | --------------------------------------------- |
| `scale-unlimited/declaration-strict-value`            | 生値 → `--rd-*`。無ければトークンを足す        |
| `property-disallowed-list` (`margin-left` 等)         | 論理プロパティに                              |
| `riml-ds/motion-in-media`                             | `@media (prefers-reduced-motion: no-preference)` で囲む |
| `riml-ds/baseline-newly-needs-supports`               | `@supports` で囲み、フォールバックを書く       |
| `riml-ds/no-palette-token`                            | `--rd-color-palette-*` → semantic トークン     |
| `unit-disallowed-list` (`px`)                         | `rem` に。`1px` 罫線だけ許可                   |
