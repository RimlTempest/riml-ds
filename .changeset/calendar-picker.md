---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-calendar` に **`picker` 属性**を追加（Date Picker）。月表を常設せず、`<input>` の右の 44px のボタン 1 つで開く `<div part="popover" popover role="dialog">` に入れる。新しい要素は作らない——違うのは見せ方だけなので属性 1 つで足りる
- elements: 開くのは `popovertarget`（UA）、**Escape と外側クリックも `popover`（auto）のネイティブの light dismiss**。部品が呼ぶのは「日を選んだあとの `hidePopover()`」の 1 行だけで、`showPopover()` は呼ばない。閉じたあとのフォーカス復帰も UA の hide popover algorithm に任せる（`toggle.focus()` を自分で呼ばない）
- elements: JS が無ければ `<input type="date">` だけの普通の入力欄に縮退する（ティア A のまま。モバイルでは OS のピッカーが出て、`min` / `max` / `required` のネイティブ検証も生きる）
- elements: 開くボタンは `[part='toggle']`（`aria-label` は `暦を開く` / `Open calendar`、中身は `currentColor` の inline SVG）、窓は `[part='popover']`。`:state()` に **`open`** を追加。`role="dialog"` に `aria-modal` は付けない（非モーダル。light dismiss と噛み合わせる）
- elements: `[part='header']` / `[part='grid']` の CSS から子結合子を外した（inline と popover の中の両方に当てるため）。窓の位置決めは `position-area: block-end span-inline-start` + `position-try-fallbacks: flip-block`（anchor positioning が無ければ `_shared/popover-anchor.ts` が `top` / `left` を書く）
- wrappers: `RdCalendar` に真偽 prop `picker` が生える（react / vue / svelte / astro）
