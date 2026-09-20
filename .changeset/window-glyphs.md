---
'@rimltempest/riml-ds-tokens': minor
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
---

- tokens: `color.chrome.control.close` / `.expand` / `.collapse` を追加（ADR-0015）。窓の帯の操作の丸を riml の 3 色（ほっぺの桃 `danger.300` / 髪の青 `accent.300` / 紙 `neutral.0`）で塗る。3 つとも `chrome.default` に対して **3:1 以上**を全モード・全テーマで検査する（最低は dark の 5.84:1）。記号の色 = 帯の色なので、この 1 対で「丸 ↔ 帯」と「記号 ↔ 丸」の両方を見ている
- css / elements: 窓とダイアログの帯の記号（× / □ / −）を **riml の筆致**に差し替えた（ADR-0015）。参考にした画面の記号と同じ角度・太さ・角丸で描かない。× は 8 度傾け、□ は角丸を一辺の 1/3 弱（一辺 9.6 に `rx 3`）に、− は端を丸く短く取り、線は `stroke-width 2.4` / `stroke-linecap round` の 1 本書きにした
- css / elements: 丸の塗りに `--rd-window-control-color` を挟み、`[data-action]` ごとに上の 3 色を当てる。帯の `data-tone` を変えても丸の色は動かない。`forced-colors: active` では従来どおり `ButtonFace` + `ButtonText` の輪郭に戻る
- **見た目だけの変更で、クラス・属性・part・イベントは変わらない**（利用側の追随は不要。VRT の基準画像は撮り直しが要る）
- css / elements: 帯の丸の並びを利用側が調整できるようにした。`--rd-window-control-gap`（丸どうしの間隔。既定 `0`）、`--rd-window-control-size`（丸の直径。既定 `1.25rem`）、`--rd-window-glyph-size`（記号の大きさ。既定 `0.75rem`）。既定値は帯（`:host` / `.rd-window-bar`）に置いたので、`rd-window { --rd-window-control-gap: 0.25rem }` のように**外から**上書きできる（丸自身に書いてあった従来の既定は届かなかった）。当たり判定は 2.75rem 四方のまま変わらない
