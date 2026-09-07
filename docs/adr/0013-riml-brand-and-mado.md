# 0013: 既定ブランドを riml（青・赤・クリーム）にし、視覚言語「まど」を全ブランド共通の形にする

- 状態: Accepted
- 日付: 2026-09-08
- 関連: ADR-0003（トークン）、ADR-0008（AAA）、ADR-0012（PE ティア）、plan 013（テーマは `color.palette.*` だけ）、
  [brand.md](../brand.md)（仕様本体）、[color-and-theming.md](../../system/guidelines/color-and-theming.md)

## 文脈

riml-ds の既定の色（accent hue 175 の青緑・neutral hue 200）は足場づくりの仮置きで、誰のブランドでもなかった。
形も「角丸 4/8/12px・ぼかし影・1px 線」という無難な既定で、部品を並べても riml-ds の見た目だと分からない。

一方で riml には既にブランドがある。`RimlTempest/blogs` の `design.md` は青髪赤目のキャラクター由来の 7 色
（blue / blue-light / red / peach / cream / navy / slate）と Voice & Tone を定義し、OKLCH・3 層トークン・
`color-mix()` での状態派生・AA コントラストまで決めている。riml-ds はこれを**引き継ぐ側**であるべきで、
別の色を発明する理由がない。

見た目の方向として参考にしたのは、配信画面向けに作られたレトロ OS 風の UI：クリームの窓、濃い帯の
タイトルバーと左端の丸 3 つ、ピル型のボタン、太いスライダー、区分表示のメーター、点線の区切り。
かわいさが「形」から出ていて色に依存しないので、ブランド色（riml / qrcc / noter）を差し替えても成り立つ。

制約は変わらない：AAA（文字 7:1・非文字 3:1）を全モードで機械検査（`system/tokens/test/contrast.test.ts`）、
テーマが触れるのは `color.palette.*` だけ、Web フォントを同梱しない、無料枠。

## 決定

1. **既定ブランド（`theme=riml-ds`）は riml の色にする。** blogs の 7 色を出自とし、`neutral` = 紙（cream）/ 肌（peach）/
   インク（navy）/ slate、`accent` = 髪の青、`signature` = 赤目、`danger` は signature と同色相の濃い段。
   AAA のため blogs の値から明度を動かした段は [brand.md §2](../brand.md) に「出自」と理由を残す。
2. **鮮やかなブランド色は装飾専用にする。** 髪の青（`accent.500`）と赤目（`signature.500`）は紙の上で 3.8–3.9:1 しかなく
   文字は載らない。`color.brand.primary` / `color.brand.signature` として **非文字 3:1** で検査し、
   文字色・塗りの下地にしない。文字は常に「インク on 紙」（`text.default` × `surface.*` が全面で 7:1）。
3. **視覚言語「まど」を全ブランド共通の形にする。** 帯（`color.chrome.*`）+ 丸 3 つ（CSS 装飾）+ ピル（`radius.full`）+
   大きめの角丸（8/12/16px）+ 硬い影（ぼかし 0）+ 点線の区切り。形・影・文字はテーマで変えない。
4. **見出しに丸ゴシック系のフォントスタックを足すが、フォントは同梱しない。** `font.family.display` は
   入っていれば効くだけの前方互換スタック。
5. **旧既定の青緑は noter のテーマとして引き取る。** 既定を変えても noter の見た目は変わらない。qrcc のテーマは
   増えた palette 段（`neutral.700` / `accent.500` / `signature.*`）を自分の色で埋める。

## 理由

- 発明しない。ブランドの出自（キャラクター）と語彙（cream / peach / navy）が blogs にあり、利用側の作者も同じ人。
- 「形で可愛く、色は装飾」に分けると、AAA と可愛さが衝突しない。参考画面の「黄色の帯にクリームの文字」のような
  低コントラストは、帯をインクにして文字を紙にすれば同じ佇まいで 9:1 になる。
- 形をテーマから独立させると、qrcc / noter も同じ部品で同じ手ざわりになり、ブランドは色の差し替えだけで済む
  （plan 013 の「テーマは palette だけ」がそのまま効く）。
- 硬い影・平坦な塗りは描画が軽く、VRT の差分も安定する。

## 捨てた選択肢

- **参考画面の色（コーラル / ミント / バター）をそのまま既定にする** — riml のブランドではない。コーラルを
  テーマとして足すのは可能だが、今は要らない（YAGNI）。
- **blogs の値をそのまま使う（navy 43.76% / blue.700 45%）** — peach 上の本文 6.13:1、塗り上の文字 6.86:1 で
  AAA を割る。riml-ds は AAA が不変条件なので明度を動かした。
- **輪郭線を 2px にしてネオブルータリズム寄りにする** — 参考画面は線ではなく面（帯・窪み）で区切っている。
  線を太くすると密度が上がり、入力欄が重くなる。
- **Web フォント（Zen Maru Gothic 等）を同梱する** — 無料枠・性能予算・ライセンス管理の負担。スタックだけ置き、
  利用側が選ぶ。
- **丸 3 つを実要素（`<span>` × 3）で描く** — DOM が増え、SR に読まれる・押せると誤解される。CSS 背景で描く。
- **`brand.*` を文字にも許す（AA 4.5:1 で妥協）** — AAA 既定（ADR-0008）を破る。

## 影響（守るべき不変条件）

- `contrastAgainst` を持つトークンは **15**（文字 11 + 非文字 4）。`color.brand.primary` / `color.brand.signature` /
  `color.focus.ring` / `color.border.*` が非文字、`color.chrome.text` は `color.chrome.default` に対して文字 7:1。
  `system/tokens/test/contrast.test.ts` が 8 モード全部で検査する。
- `color.text.default` × `color.surface.{default,raised,sunken}` はライトで 7:1 以上（`invariants.test.ts` に追加）。
- テーマ（qrcc / noter）は引き続き `color.palette.*` だけを上書きする。**新しい palette 段を足したら、qrcc / noter の
  テーマにも同じ段を足す**（足し忘れると riml の色が混ざる。`invariants.test.ts` で「既定が持つ palette 段を
  テーマも全部持つ」ことを固定する）。
- 部品 CSS は `--rd-color-palette-*` を直接参照しない（stylelint `no-palette-token`）。丸 3 つも `--rd-color-brand-*` /
  `--rd-color-border-default` 経由。
- `brand.*` の上に文字を置く CSS は書かない。レビュー観点として `.claude/skills/riml-ds-css/SKILL.md` に載せる。
- 見た目を変えたので VRT のベースライン（`e2e/__screenshots__`）は Docker で撮り直す（ADR-0007）。
