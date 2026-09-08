# 提案: `rd-tooltip`（experimental）

## 目的

操作の意味やショートカットを、**押す前に**短く補う。`title` 属性はホバーでしか出ず、
出るまでの時間もブラウザ任せで、タッチとキーボードでは実質読めない。

## API

- ティア C（ADR-0012）。shadow 完結で `<name>.css` を持たない。`<rd-tooltip for="save">…</rd-tooltip>`
  の `for` が説明する相手の id（同じ木の中）
- **JS が無ければ何も出ない**。代わりは利用側が対象に書く `title`。`title` が無ければ
  `console.warn`（`console.error` にはしない——無くても壊れないため）
- 対象に `aria-describedby` を足す（既存の値があれば追記する）
- `popover="manual"` があれば top layer に出す。位置は `_shared/popover-anchor.ts`
  （anchor positioning があれば CSS に任せ、無ければ `getBoundingClientRect` で 1 回だけ置く）
- `--rd-tooltip-delay` でポインタで開くまでの待ち時間を変える（既定 400ms）
- `:state(open)` / `:state(orphan)`（`for` の先が無い）

## a11y

- **ホバーだけに頼らない**: `focusin` でも開く。`pointerenter` は遅らせ、`focusin` は即座に開く
- WCAG 1.4.13（Content on Hover or Focus）: Esc で閉じる・吹き出し自身にポインタが乗っても消えない・
  ポインタを外すまで残る
- `aria-live` を書かない。読み上げは `aria-describedby` に任せる（ADR-0008 §6）
- 面はインク（`chrome.default`）に反転文字（`chrome.text`）。この対は `system/tokens` の
  contrast 検査が 7:1 を保証している（`--rd-color-text-inverse` というトークンはこのリポジトリに無い）

## 分かっている穴

- **定義前（JS が来る前）に文言が素で流れる。** ティア C は `<name>.css` を持てない
  （`scripts/guard.sh` 検査 8）ので、`rd-tooltip:not(:defined) { display: none }` を置く先が無い。
  害はないが望ましくもない。直すなら「文言を属性で受ける」か「ティア C にも `.css` を許す」の
  どちらかを決める必要がある（`e2e/pe/tier-c.spec.ts` が現状を固定している）
- 対象に `title` と `rd-tooltip` の両方があると、ブラウザ既定の吹き出しと二重に出る。
  `title` を消してしまうと JS 無しの代替が消えるので、いまは消していない

## 代替案

- **`title` だけで済ませる**: タッチとキーボードで読めない。遅延も見た目も制御できない
- **ティア B にする**（light DOM に文言を置き `:not(:defined)` で隠す）: 「無くても害が無い」以上の
  約束を背負うことになる。吹き出しは無くても情報が失われない部品なので C が正しい
- **ホバーカード（富文言版）**: 中に操作を置くと 1.4.13 の要件が跳ね上がる。要るときに別部品にする
