---
version: "1.0"
name: "riml-ds"
description: "riml-ds の見た目の正。フロントマターは system/tokens から生成される（plan 002 以降）。本文は手書きで、system/guidelines/ の要約。矛盾したら guidelines が正。"
colors:
  accent-300: "oklch(0.86 0.08 175)"
  accent-400: "oklch(0.78 0.11 175)"
  accent-600: "oklch(0.42 0.09 175)"
  accent-700: "oklch(0.36 0.08 175)"
  danger-300: "oklch(0.86 0.1 25)"
  danger-400: "oklch(0.78 0.17 25)"
  danger-600: "oklch(0.44 0.17 25)"
  danger-700: "oklch(0.36 0.17 25)"
  info-400: "oklch(0.78 0.13 240)"
  info-600: "oklch(0.44 0.13 240)"
  neutral-0: "oklch(0.99 0.005 200)"
  neutral-100: "oklch(0.96 0.008 200)"
  neutral-200: "oklch(0.9 0.012 200)"
  neutral-300: "oklch(0.8 0.015 200)"
  neutral-500: "oklch(0.55 0.02 200)"
  neutral-600: "oklch(0.44 0.02 200)"
  neutral-800: "oklch(0.25 0.02 200)"
  neutral-900: "oklch(0.16 0.01 200)"
  success-400: "oklch(0.78 0.11 150)"
  success-600: "oklch(0.44 0.11 150)"
  warning-400: "oklch(0.78 0.1 75)"
  warning-600: "oklch(0.44 0.1 75)"
  surface: "{colors.neutral-0}"
  surface-raised: "{colors.neutral-100}"
  text: "{colors.neutral-800}"
  text-muted: "{colors.neutral-600}"
  border: "{colors.neutral-500}"
  focus: "{colors.accent-600}"
typography:
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  heading-1:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  heading-2:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
  small:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Noto Sans Mono CJK JP', monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
sizing:
  target-min: "2.75rem"
  focus-ring-width: "3px"
  focus-ring-offset: "2px"
  measure-max: "80ch"
motion:
  duration-fast: "120ms"
  duration-base: "200ms"
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
---

# riml-ds

## Overview

riml-ds は RimlTempest のプロダクト（qrcc、noter、以降のもの）で共有する見た目の基準。
**「静かで、読みやすく、触りやすい」**。装飾より情報、演出より応答速度、独自性より一貫性を
優先する。既定で AAA（WCAG 2.2）を満たし、ダーク・高コントラスト・強制配色・低モーション・
高密度のすべてのモードで同じ意味を保つ。

- 誰のためか：文書を書く人、コードを扱う人、印刷物を作る人。長時間見る画面。
- どこで使うか：ブラウザ（モバイル 360px 〜 デスクトップ）、印刷、埋め込み（ドキュメント内）。
- 何をしないか：ブランドの主張（ロゴを大きく出す等）、マーケティング用の演出、
  ヒーロー画像。それらはプロダクト側が必要なら足す。

見た目の値は `system/tokens/` の DTCG ファイルが正で、このファイルのフロントマターは
そこから生成する。本文の判断は `system/guidelines/` が正。

## Colors

**中立色は青みの灰（色相 200）**。純粋な灰は画面上で汚れて見え、暖色の灰は文書の白と
喧嘩する。**アクセントは深い青緑（色相 175、明度 0.42）**。青（qrcc / noter の 255）でも
緑でもない位置を取り、リンクの青と区別できる。

- テキストと背景の対は **7:1 以上**（AAA）。`text-muted` でも 7:1 を満たす明度に置く。
  補助テキストは「薄く」ではなく「小さく・細く」で階層を作る。
- 非テキストの境界（入力欄の枠、アイコン）は **3:1 以上**。
- **色だけで状態を伝えない。** 危険は色 + アイコン + 文言、成功は色 + チェック + 文言。
- 意味色は 4 つだけ：danger（25）、warning（75）、success（150）、info（240）。
  すべて明度 0.42–0.44 に置き、白地でテキストとして 7:1 を満たす。
- ダークモードは **同じ色相・反転した明度**。アクセントは 0.78 に持ち上げ、
  ダーク背景（0.16）に対して 7:1 を保つ。彩度は少し落とす（暗い背景では彩度が強く見える）。
- 高コントラスト（`prefers-contrast: more`）では `text-muted` を `text` に寄せ、境界を
  `text` の色にする。強制配色（`forced-colors: active`）ではシステム色（`CanvasText`、
  `Highlight`、`ButtonText`）だけを使い、独自の色を一切出さない。
- 半透明の重ね（`color-mix()` で `transparent` を混ぜる）は hover / pressed の
  一時的な状態にのみ使い、静止状態の表面には使わない（コントラスト計算が壊れる）。

## Typography

**システムフォント**。自前で配信しない（性能・無料枠・日本語フォントの容量）。
本文は `system-ui` を先頭に、日本語は `Hiragino Sans` / `Noto Sans JP` に落ちる。
等幅は `ui-monospace` 系。

- 本文は **流体サイズ**（`clamp()`）で 16px → 18px。見出しも同じ比率で伸びる。
  最小 16px を下回らない（iOS のフォーカス時ズームを避ける）。
- 行間 1.6（本文）/ 1.2–1.25（見出し）。行長は **80ch 以下**（`measure-max`）。
- 太さは 400 と 700 の 2 段だけ。500 / 600 は使わない（システムフォントで差が出ない）。
- 日本語の禁則と約物：`text-wrap: pretty`（Newly、`@supports` 内）を段落に、
  `text-wrap: balance` を見出しに。`word-break: auto-phrase` は Baseline 外なので使わない。
- コード・数値は等幅で `font-variant-numeric: tabular-nums`。
- リンクは下線を消さない。色は `accent-600`（テキストと 7:1、隣接する本文とも 3:1）。

## Layout

**4px の倍数**（`spacing.1` = 0.25rem）。部品内は 2–3（8–12px）、部品間は 4–6、
セクション間は 8–12、ページ余白は 4（モバイル）→ 8（デスクトップ）。

- **モバイルファースト**。ブレークポイントは `@container` を優先し、`@media` は
  ページ骨格だけ。幅は 40rem / 64rem / 80rem の 3 段。
- **論理プロパティのみ**（`inline` / `block`）。RTL でそのまま反転する。
- グリッドは CSS Grid。`subgrid` で表形式の整列。Flexbox は 1 方向の並びだけ。
- タッチターゲットは **44×44 CSS px 以上**（`target-min`）。密度 `compact` でも 32px を
  下回らず、視覚サイズは小さくても当たり判定は `::after` で 44px を保つ。
- 密度は `[data-density="compact"]` で `spacing` と `sizing` を 0.75 倍。文字サイズは変えない。
- スクロールバーで幅が跳ねないよう `scrollbar-gutter: stable`（Newly、`@supports` 内）。
- 印刷（`@media print`）では影・背景色を消し、リンクの URL を `::after` で出し、
  対話部品（ボタン・入力欄）は値だけを残す。

## Elevation & Depth

**影は 2 段だけ**。`raised`（カード、ポップオーバー）と `overlay`（ダイアログ、メニュー）。
影の色は `neutral-900` を `color-mix()` で 12% / 24% に薄めたもの。ダークでは影が見えないため
**1px の境界線 + 表面の明度差**で層を表す。

- 層の順序は `z-index` トークン（`layer.base` 0 / `layer.raised` 10 / `layer.overlay` 100 /
  `layer.toast` 200）のみ。生の数値は書かない。
- ダイアログとポップオーバーは **ネイティブ**（`<dialog>`、`popover` 属性）で最上位レイヤーに
  乗せる。`z-index` で殴らない。
- 半透明の背景ぼかし（`backdrop-filter`）は使わない（性能・低コントラスト）。

## Shapes

角丸は **4 / 8 / 12px** と `full`。小さい部品（チップ、入力欄）が 4、ボタンとカードが 8、
ダイアログが 12。入れ子のときは内側を 1 段小さくする。

- 境界線は **1px**。太さで階層を作らず、色（`border` → `text-muted` → `text`）で作る。
- アイコンは 20px（本文）/ 24px（ボタン）。線幅 1.5–2px。`currentColor` で塗る。
- フォーカスリングは **外側 3px、オフセット 2px、`focus` 色**。部品の形（角丸）に沿わせる。
  背景に対して 3:1 を確保できない場所では 2 重リング（内側を `surface` 色）にする。

## Components

すべての部品は `<rd-*>` の Web Components（Lit）。React / Vue / Svelte 向けは同じ要素の
薄いラッパー。API は `library/elements/custom-elements.json` が正。

部品は **Progressive Enhancement のティア**を 1 つ持つ（ADR-0012）。ティア A（フォーム・ボタン・
リンク）は light DOM でネイティブ要素を包み、**JS が無くても動く**。ティア B（dialog など）は
JS が無くても内容が読める。ティア C（live-region など）は無くても害が無い。

最初の部品（plan 004）：

| 部品              | 役割                                            | 主要な API                                      |
| ----------------- | ----------------------------------------------- | ----------------------------------------------- |
| `rd-button`（A）      | 操作の起点。子のネイティブ `<button>` を包む。`variant`: primary / secondary / ghost / danger | `variant`, `loading`, `rd-press` |
| `rd-text-field`（A）  | 1 行テキスト入力。子の `<label for>` + `<input>` を包む。インラインのエラー文言と `:state(invalid)` を足す | `hint`, `error`, `:state(invalid)` |
| `rd-dialog`（B）      | モーダル。ネイティブ `<dialog>` を枠にし内容は slot | `open`, `persistent`, `show()`, `close()`, `:state(open)` |
| `rd-live-region`（C） | 読み上げの集約点。ページに 1 つ                 | `announce(text, { politeness })`                |
| `.rd-skip-link`（CSS）| 本文へのスキップ。部品ではなく `@rimltempest/riml-ds-css` のクラス | `<a class="rd-skip-link" href="#main">` |

第 2 波（plan 009、`@status experimental`。import は `@rimltempest/riml-ds-elements/experimental/<name>`）：

| 部品              | 役割                                            | 主要な API                                      |
| ----------------- | ----------------------------------------------- | ----------------------------------------------- |
| `rd-select`（A）      | 1 つ選ぶ。子の `<label for>` + `<select>` を包む。見た目はネイティブのまま | `hint`, `error`, `value`（初期選択）, `:state(invalid)` |
| `rd-checkbox`（A）    | 真偽。`<label>` が `<input type="checkbox">` を包む。`switch` で `role="switch"` | `switch`, `indeterminate`, `hint`, `error` |
| `rd-disclosure`（A）  | 開閉。子の `<details>` / `<summary>` を包む。`group` で排他アコーディオン | `group`（`<details name>`）, `rd-toggle` |
| `rd-toast`（C）       | 一時通知の表示。読み上げは `rd-live-region` に委譲する | `show({ message, tone, duration })`, `close()`, `rd-dismiss`, `:state(success)` など |

`rd-toast` の `tone`（info / success / warning / danger）は装飾で、意味は文言に持たせる。色だけで意味を伝えない。

部品の共通ルール：

- ラベルの無い対話部品は**作れない**（ティア A は `<label for>` が無い、B/C は `label` 属性が空なら `console.error` と `:state(unlabeled)`）。
- 読み込み中は `aria-busy` と視覚的な進行表示を両方出す。`disabled` にしない
  （フォーカスが飛んで場所を失う）。
- 無効状態は `aria-disabled` を使い、フォーカス可能に留める（理由をツールチップで示せる）。
- 状態は `:state()`。利用側は `rd-dialog:state(open)` で参照できる。
- イベント名は `rd-` プレフィックス、`detail` はオブジェクト。ネイティブイベント（`input`、
  `change`）は**そのまま透過**させ、独自イベントで上書きしない。

## Do's and Don'ts

**Do**

- トークンだけで色・余白・角丸・時間を書く（`--rd-*`）。
- ネイティブ要素（`<button>`、`<dialog>`、`<input>`）を包む。作り直さない。
- 文言は短く、動詞で始める（「保存」「共有リンクを作成」）。丁寧語の「〜してください」は
  エラー文だけ。
- ダーク・高コントラスト・強制配色・低モーション・RTL・compact の 6 条件で story を確認する。
- 破壊的操作は 2 段階（確認ダイアログ）か取り消し可能にする。

**Don't**

- 色だけで状態や意味を伝えない。
- `outline: none` を書かない。フォーカスリングを消す代わりに形を変える。
- 44px 未満のタッチターゲットを置かない。
- 自動再生するモーションを置かない。モーションは応答（押した・開いた）にだけ使う。
- `aria-live` を部品ごとに持たない。`rd-live-region` に流す。
- フォントを自前配信しない。アイコンフォントを使わない（SVG を使う）。
- `z-index` の生値、`px` の余白、`#` の色を書かない。
