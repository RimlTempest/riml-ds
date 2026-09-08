# 提案: `rd-toggle`（experimental）

## 目的

「太字」「一覧 / 格子」のような**押した状態が残るボタン**を、`aria-pressed` のまま 1 つの部品にする。
ツールバーや `.rd-button-group`（ボタンの枕）の中身がこれにあたる。

いまは `rd-button` の `primary` / `secondary` を選択の有無に読み替えて見せ分けていたが、
variant は**重要度**を表すもので、押されているかどうかを表さない。読み上げでも「押されている」が
出ない（`aria-pressed` が無いため）ので、見た目の差だけで状態を伝えていた。

## API

- ティア A（ADR-0012）。契約は `rd-toggle > button`（必須）。マークアップは `toggleMarkup(...)` で組む
- 属性: `variant`（`outline`（既定）/ `ghost`）。**`pressed` 属性・`disabled` 属性は持たない**
- 押下の真実は子の **`aria-pressed`** 属性。`markup()` は省略時に `aria-pressed="false"` を書く
  （属性ごと消えると toggle ではなくただのボタンになる）
- `pressed` プロパティは getter / setter がネイティブの `aria-pressed` に**委譲するだけ**で値を持たない。
  利用側が属性を直接書き換えても `MutationObserver` で `:state(pressed)` が追随する
- イベント: `rd-toggle`（`detail: { pressed: boolean }`、bubbles + composed）。ネイティブの `click` は透過する
- `:state()`: `outline` / `ghost` / `pressed` / `malformed`
- 無効化はネイティブの `<button disabled>` に任せる（部品は属性を持たない）

## a11y

- 名前と役割は `<button>` そのもの。押下は `aria-pressed` なので「一覧、切り替えボタン、押されている」と読まれる
- 押下は**面（accent）+ 文字色の反転 + 太字**の 3 つで示し、色だけに頼らない（`docs/accessibility.md` 9）
- 強制配色では自前の面が消えるので、押下を `outline: … solid Highlight`（`outline-offset` は内側）で示す。
  `background: Highlight` にすると Chromium のバックプレートで文字が読めなくなる
- ピルの高さは `--rd-sizing-target-min`（44px）。横も `min-inline-size` で 44px を切らない（WCAG 2.2 Target Size）
- JS が無いときは「押しても変わらない普通のボタン」に縮退する。初期状態の `aria-pressed` は
  マークアップに書かれているので**読み上げは正しい**（害の無い縮退。ADR-0012 ティア A）

## 代替案

- **送信に載せる値なら `rd-checkbox`（`switch`）を使う**: `rd-toggle` はフォームに参加しない
  （`<button>` は値を送らない）。設定の ON / OFF を保存するなら checkbox が正しい
- **Toggle Group（shadcn）を部品にする**: 作らない。単一選択は `rd-radio-group segmented`、
  複数選択は `rd-checkbox-group segmented` が既にその形で、送信・キーボード操作までネイティブに任せられる。
  `.rd-button-group` は「押下状態を持つボタンを並べる枕」であって、選択の意味論は各 `rd-toggle` が持つ
- **`rd-button` に `pressed` を足す**: 足さない。`rd-button` は stable なので API を増やすと戻せない。
  押下状態は「操作の起点」とは別の意味論で、`variant` との組み合わせも増える
- **`pressed` を部品の属性にして `aria-pressed` を部品が書く**: しない。JS が無いときに属性が消え、
  読み上げが「押されている」を落とす。真実をネイティブ側に置くのがティア A の決まり
