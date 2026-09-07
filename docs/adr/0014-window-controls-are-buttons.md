# 0014: 窓の左端の丸 3 つは装飾ではなく本物のボタンにする（`rd-window` を部品として追加）

- 状態: Accepted
- 日付: 2026-09-08
- 関連: ADR-0012（PE ティア）、ADR-0013（「まど」）、[brand.md §7.1 / §7.7](../brand.md)、plan 017

## 文脈

plan 015 は窓（`.rd-window`）とダイアログの帯の左端に丸 3 つを **CSS の `::before`（`radial-gradient`）** で描いた。
「窓は JS が要らないので部品にしない」（ADR-0012 §6）という判断と、参考にした画面の丸を装飾として読んだことが理由だった。

オーナーから訂正が入った: **参考にした画面の丸は操作ボタン（閉じる・広げる・たたむ）であり、柄ではない。**
押せそうに見えて押せない丸は、見た目の約束を破る（WCAG の失敗ではないが、`better-ui` の「押せる見た目は押せる」に反する）。
また brand.md §7.7 は「閉じるボタンは帯の右端のピル」と書いていたが、実装には閉じるボタンが無く、Esc と背面クリックしか無かった。

## 決定

1. **帯の左端の丸は `<button>`。** 描くのは使う操作の分だけ（閉じる ×・広げる □・たたむ −、この順）。
   押せない丸は置かない。記号は幾何で、CSS の `mask-image`（data URI の SVG）で描く。絵・アイコンフォントは持ち込まない。
2. **帯 ⊃ 見出し。** これまでは「帯 = 見出し要素」だったが、ボタンが見出しの名前に混ざるため、
   帯（`.rd-window-bar` / `part="bar"`）の中に制御（`.rd-window-controls`）と見出し（`.rd-window-title`）を並べる。
   `aria-labelledby` は見出しに結ぶ。
3. **窓を部品にもする（`rd-window`、ティア B、experimental）。** 「たたむ / 広げる」は状態と ARIA（`aria-expanded` /
   `aria-controls` / `aria-pressed`）と Esc の処理を伴うので、JS が要る = 部品にする条件（ADR-0012 §6）を満たす。
   JS 無しの窓は引き続き `patterns.css` のクラスで組める（ボタンの動作は利用側）。両方の帯は同じ見た目で、
   CSS の記号（mask の data URI）は `library/elements/src/_shared/window-chrome.ts` と `patterns.css` で**同じ文字列**を
   持つことをテストで固定する。
4. **ダイアログの閉じるボタンは帯の左端の ×。** `persistent` のときは出さない。`rd-dismiss` の `reason` に `'button'` を足す。
   帯の右端にピルは置かない（brand.md §7.7 を訂正）。
5. **利用側（qrcc / noter）は 0.x の破壊的変更として追随する。** `.rd-window-title::before` の丸は消え、
   帯の構造が 1 段深くなる（qrcc2 の `<Window>` は plan 013 で追随）。

## 却下した案

- **丸を装飾のまま残し、閉じるボタンを右端に置く**: 参考画面の意図と食い違い、押せない丸が残る。
- **丸をすべて描き、使わない操作は `disabled`**: 押せないボタンが 2 つ常に並ぶ。無効ボタンは「今は押せない」の
  意味なので誤り（`writing.md`）。
- **記号を inline SVG で DOM に置く**: static な HTML の利用側が SVG を毎回貼ることになる。CSS の mask なら
  `<button class="rd-window-control" data-action="close" aria-label="閉じる"></button>` の 1 要素で済む。
  `forced-colors` でも `background: ButtonText` で記号が出る。
- **`rd-window` の中で見出しを生成する（`heading-level` 属性）**: 見出しは文書構造で、利用側が持つべき（ADR-0012 ティア B の原則
  「内容は light DOM」）。`rd-dialog` と同じく `slot="title"` に h 要素を置いてもらう。

## 影響

- `patterns.css` の `.rd-window-title::before` と `dialog.styles.ts` の `[part='label']::before` を削除。
  `grep -rn radial-gradient system/css/src library/elements/src` は 0 件になる。
- 新規: `library/elements/src/window/**`、`_shared/window-chrome.ts`、`docs/proposals/window.md`、registry の `window`。
- VRT: 窓・ダイアログ・Foundations/Mado の基準画像を撮り直す。
- 利用側の移行は `docs/migration.md` に 1 節足す（帯のマークアップの before / after）。
