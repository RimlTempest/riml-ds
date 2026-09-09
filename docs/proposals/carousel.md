# 提案: `rd-carousel`（experimental）

## 目的

shadcn の **Carousel** に当たるものが `.rd-carousel`（横スクロール + scroll-snap の atom）しか無く、
**前へ／次へ**も**「いま何枚目か」**も無い。ポインタでつかんで転がすか、キーボードで矢印を叩くしか
なく、スクリーンリーダーでは総数も現在位置も分からない。

`rd-carousel` は既存の atom と同じ HTML（`<ul><li>`）を包むティア A（ADR-0012）で、
**JS が無ければ今までどおり横スクロールできる列**のまま。定義されてはじめて末尾に
前へ／次へのボタンと `<output part="counter">` の「n / N」が足され、各 `<li>` に
`aria-roledescription="slide"` と `aria-label="n / N"` が付く。

## なぜ自動再生を作らないか

APG の Carousel には自動再生と一時停止ボタンの型があるが、**riml-ds は作らない**。

- WCAG 2.2.2（Pause, Stop, Hide, レベル A）は「5 秒以上自動で動くものには停止手段が要る」と言う。
  停止ボタンを付ければ**適合はする**が、AAA を既定にする riml-ds（`docs/accessibility.md`）は
  **3.2.5 Change on Request（AAA）** も見る。ページの変化は利用者の要求で起こすのが AAA の既定。
- **2.3.3 Animation from Interactions（AAA）** も、必須でない動きは無くせることを求める。
  自動再生は「必須でない動き」の典型で、`prefers-reduced-motion` で止めても
  「動いていないカルーセルの残骸」が残るだけになる。
- 自動再生は注意・読字・運動の負荷を上げるわりに、実測でクリックされるのはほぼ 1 枚目だけ、
  という報告が繰り返し出ている。**足さないことが一番強い縮退**。

要るときは利用側が `index` を書き換えればよい（`rd-change` は出ない）。そのとき停止手段と
`prefers-reduced-motion` の尊重は**利用側の責務**になる。

## なぜ `IntersectionObserver` か（`scrollend` / `scrollsnapchange` ではなく）

「いま見えている枚」を決める素直な手は 2 つあるが、どちらも**全エンジンには無い**:

| API                  | 状況（2026-09）                     |
| -------------------- | ----------------------------------- |
| `scrollend`          | Safari は 26.2 以降だけ             |
| `scrollsnapchange`   | Chromium だけ                       |
| `IntersectionObserver` | **全エンジン（Baseline Widely）** |

`docs/baseline.md` の決まりどおり、Widely available にあるものだけを無条件に使う。
`watchVisible()` は `<ul>` を `root`、`threshold: [0.5, 1]` で各 `<li>` を観て、
交差比が最大の枚（同率なら先頭）を現在位置にする（`pickVisible`）。

副産物として、**ボタンで動いたときもユーザーが指で転がしたときも同じ経路**を通る。
`rd-change` は「見えている枚が変わった」1 か所からしか出ないので、両方を聞き分ける必要がない。

`scroll` イベントを間引いて自前で位置を計算する案は取らない。転がりの途中を拾うので
`scroll-behavior: smooth` の有無で結果が変わり、テストが時間に依存する。

## なぜ「n / N」が `<output>` か

`<output>` は**暗黙のライブリージョン**（`role="status"` = `aria-live="polite"`）を持つ。
`aria-live` を属性として書かずに済むので、ADR-0008 §6 の「部品に `aria-live` を書かない」を
守ったまま、枚が変わったことが読み上げに乗る。`rd-live-region` を呼ぶ必要も無い
（読み上げるのは押した本人が起こした変化で、`announce()` を通すほどの割り込みではない）。

`<span aria-live="polite">` でも同じ効果は出せるが、**同じことを ARIA で書き直すのは最後の手段**
（`riml-ds-element` §4）。ネイティブに同じ意味の要素があるならそれを使う。

## なぜ `<li>` に `role` を書かないか

初版は APG の例に倣って `<li role="group" aria-roledescription="slide">` にしていたが、
axe が 2 つ落とした:

- `list` — `<ul>` の子は `listitem` でなければならない
- `aria-allowed-role` — `<li>` に `group` は許されない

`aria-roledescription` は**役割の言い換え**なので、役割そのもの（`listitem`）を差し替える必要は無い。
仮想スクリーンリーダーは `listitem` のまま「slide, 1 / 3」「position 1, set size 3」と読み、
**位置と総数はリストの意味論からそのまま出る**（`carousel.sr.test.ts` が固定している）。
`role="group"` にすると、この「1 / 3 枚目」を自前の `aria-label` だけで背負うことになる。

列そのものの役割（`role="group"` + `aria-roledescription="carousel"` + `aria-label`）は
`ElementInternals` が持つ。利用側が書いた HTML に属性を書き足さないので、
サーバーで描いた HTML とハイドレーション後の HTML がずれない。

## なぜ `<ul>` が契約側で `tabindex="0"` を持つか

横に転がる箱はキーボードだけの利用者にも中身を読める必要がある（axe `scrollable-region-focusable`、
WCAG 2.1.1）。`tabindex` を element が定義後に足すと、**JS が来るまで届かない**。
ティア A は「JS 無しで動く」ので、`tabindex="0"` は契約の木（`markup()`）が出す。
element は `tabindex` を**足しも消しもしない**。焦点環は `rd-carousel > ul:focus-visible` に置く
（atom の `.rd-carousel:focus-visible` と同じ見え方）。

契約に `tabindex="0"` を入れたことで React ラッパーが `tabIndex="0"`（文字列）を出して
TS2322 になったため、生成器側でネイティブ要素のリテラル数値属性を `={0}` で出すよう直した
（main `1ada18b`）。

## なぜ atom（`.rd-carousel`）を残すか

`.rd-carousel` / `.rd-carousel-track` / `.rd-carousel-item` は **JS 無しで完結する見た目**で、
部品を読み込まないページ（ドキュメント・メール風の静的ページ）でも使える。
`rd-carousel` はその上に**操作**を足すだけなので、atom を消す理由が無い。
次のメジャーで `rd-carousel` に寄せるかは、利用実績を見てから判断する。

## API

- ティア A。契約は `rd-carousel > ul`（`track`、`tabindex="0"` 付き）と `> ul > li`（`item`、1 枚以上）。
  どちらかが欠ければ `console.error` + `:state(malformed)` で、強化ノードを 1 つも足さない
- `label`（**必須**）: 列のアクセシブル名。`ElementInternals` に `role = 'group'`、
  `ariaRoleDescription = 'carousel'`、`ariaLabel = label` を書く。空なら `:state(unlabeled)` + `console.error`
- `loop`（boolean）: 端で折り返す。無ければ端でボタンが `aria-disabled="true"`
  （`disabled` にはしない。フォーカスは受け取れるまま）
- イベント: `rd-change`（`detail: { index }`。0 始まり）。**ボタンでもユーザーの転がりでも**出るが、
  `index` プロパティへの代入では出さない（`rd-toggle-group` / `rd-sort` と同じ方針）
- `:state()`: `at-start` / `at-end`（`loop` 無しで端）/ `single`（1 枚以下。操作を隠す）/
  `unlabeled` / `malformed`
- CSS part: `controls` / `prev` / `next` / `counter`
- CSS 変数: `--rd-carousel-item`（1 枚の幅。既定 `min(100%, 20rem)`）/
  `--rd-carousel-padding`（端の `scroll-padding`。既定 0）
- 枚は利用側が書く。`carouselItemMarkup({ children })` で `<li>` を組める

## a11y

- ボタンの文言は最も近い `[lang]` で決まる（`_shared/lang.ts`）: 「前へ」「次へ」/ "Previous" "Next"。
  `‹` `›` は装飾だが `aria-label` が名前として勝つので `aria-hidden` は要らない
- タップ標的は 44×44（`--rd-sizing-target-min`。WCAG 2.5.5 AAA）
- **スクロールバーを隠さない**（`scrollbar-width: thin` まで）。「まだ先がある」ことの手がかり
- 滑らかな転がりは `@media (prefers-reduced-motion: no-preference)` の中の
  `scroll-behavior: smooth` **だけ**。JS は必ず `scrollIntoView({ behavior: 'auto' })` で呼び、
  利用者の設定を踏み越えない
- 強制配色ではボタンの境界が `ButtonText`、`aria-disabled` は `GrayText`、焦点環は `Highlight`
- 色だけで端を伝えない（`aria-disabled` と「n / N」が状態を持つ）

## 代替案

- **自動再生 + 一時停止ボタン**: 取らない（上）
- **ドット（インジケータ）を `tablist` にする**: 取らない。枚が増えると 44px の的が並びきらず、
  `tablist` にすると `<li>` が `tab` になって `list` の意味論が壊れる。位置は「n / N」で伝える
- **縦向き（`orientation="vertical"`）**: 取らない。縦に積むなら普通のリストで足りる
- **無限ループ（DOM の複製）**: 取らない。読み上げに同じ枚が二度現れ、`position n, set size N` が嘘になる
- **`scrollsnapchange` を Chromium だけで使い、他は `IntersectionObserver`**: 取らない。
  経路が 2 本になると、エンジンごとに `rd-change` の出るタイミングが変わる

## 保守メモ

`carousel.css` の寸法は `system/css/src/atoms.css` の `.rd-carousel*` と**二重**になっている
（`gap` / `flex` / `scroll-snap-*` / `overscroll-behavior-x`）。どちらかを変えるときはもう片方も
直す。この一致を見る自動テストは無い（`system/**` と `library/**` は依存を持てないため）。

`IntersectionObserver` の `threshold: [0.5, 1]` は「半分以上見えている枚」を現在位置にする判断。
`--rd-carousel-item` を小さくすると複数の枚が同時に該当するので、`pickVisible` が先頭を選ぶ。
