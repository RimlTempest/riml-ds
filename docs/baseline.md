# Baseline 判断表

**Widely** は無条件に使う。**Newly** は `@supports` / `'x' in window` で囲み、無い場合の見た目を
決める。**Wait** は使わない（ADR-0004）。判定は MDN のバッジ（2026-09 時点）。四半期ごとに見直す。

## CSS

| 機能                                | 状態   | 使い方                                                            |
| ----------------------------------- | ------ | ----------------------------------------------------------------- |
| `@layer`                            | Widely | 全 CSS のレイヤー宣言                                             |
| ネスト                              | Widely | 部品 CSS                                                          |
| `@container`（size）                | Widely | 部品内のレイアウト切替                                            |
| `:has()`                            | Widely | 親要素の状態表現                                                  |
| `oklch()` / `color-mix()`           | Widely | トークン値・hover の混色                                          |
| `subgrid`                           | Widely | 表形式の整列                                                      |
| `light-dark()`                      | Widely | トークンのライト/ダーク                                           |
| `<dialog>` / `<search>` / `inert`   | Widely | rd-dialog、検索領域、背後の無効化                                 |
| `:user-invalid`                     | Widely | 入力欄のエラー表示                                                |
| `forced-colors` / `prefers-reduced-motion` / `prefers-contrast` | Widely | モード |
| `adoptedStyleSheets`                | Widely | Lit の既定                                                        |
| Declarative Shadow DOM              | Widely | SSR 出力                                                          |
| `ElementInternals`                  | Widely | form-associated、`states`                                         |
| `:state()`                          | Newly  | `@supports selector(:state(x))`。外では `[open]` 属性セレクタ    |
| `@property`                         | Newly  | 型付き変数（アニメーション用）。無くても動く                      |
| `@starting-style` + `transition-behavior: allow-discrete` | Newly | dialog / popover の入場。無ければ瞬時表示 |
| `popover` 属性                      | Newly  | rd-tooltip / rd-menu（plan 009）。無ければ `<dialog>` 非モーダルに退避 |
| Invoker Commands（`commandfor`）    | Newly  | 使わない（JS 1 行で足りる。属性が増えると CEM が濁る）            |
| `field-sizing: content`             | Newly  | rd-textarea。無ければ固定行数                                     |
| 縦向きのフォーム部品（`writing-mode: vertical-lr` の `<input type=range>`） | Newly | rd-slider の `orientation="vertical"`。`@supports selector(:state(vertical))` の中。無ければ横向き |
| `text-wrap: balance` / `pretty`     | Newly  | 見出し / 段落。無ければ通常折返し                                 |
| `text-box-trim`                     | Newly  | 見出しの上下トリム。無ければ `line-height` で近似                 |
| anchor positioning                  | Newly  | rd-tooltip の位置。無ければ Floating UI **ではなく**下固定        |
| `scrollbar-gutter: stable`          | Newly  | ページ骨格                                                        |
| `scrollbar-width` / `scrollbar-color` | Newly | .rd-scroll-area / .rd-carousel の細いスクロールバー。無ければ既定の見た目 |
| `content-visibility: auto`          | Newly  | 長いリスト。無くても正しい                                        |
| `@scope`                            | Newly  | 使わない（Shadow DOM で足りる）                                   |
| `sibling-index()`                   | Newly  | 使わない（stagger アニメーション自体を置かない）                  |
| scroll-driven animations            | Wait   | 使わない                                                          |
| `interpolate-size` / `calc-size()`  | Wait   | 使わない（高さアニメーションは grid-template-rows で）           |
| masonry                             | Wait   | 使わない                                                          |
| `if()` / `@function`                | Wait   | 使わない                                                          |
| `corner-shape`                      | Wait   | 使わない                                                          |
| customizable `<select>`             | Wait   | rd-select は Wait 解除まで作らない                                |
| view transitions                    | バッジ無し | 使わない（利用側の責務）                                      |
| `overscroll-behavior`               | 要確認 | MDN は limited 表示。使う前に再確認                              |

## JS / DOM

| 機能                                    | 状態   | 使い方                                                        |
| --------------------------------------- | ------ | ------------------------------------------------------------- |
| ARIAMixin 要素反映（`ariaLabelledByElements`） | Widely | shadow 越しのラベル参照                                  |
| `delegatesFocus`                        | Widely | 既定 on                                                       |
| `getHTML({ serializableShadowRoots })`  | Widely | markuplint 用の DOM 出力                                      |
| Navigation API                          | Newly  | 使わない（DS の責務外）                                       |
| Scoped Custom Element Registries        | Wait   | 使わない。名前衝突は `rd-` プレフィックスで避ける             |
| Reference Target                        | Wait   | 使わない（ADR-0008）                                          |
| WebMCP（`document.modelContext`）       | OT     | 使わない。フォーム属性の透過で利用側に委ねる（ADR-0010）      |

## 運用

- `browserslist`: `baseline widely available`。
- 「Newly → Widely」に上がったら `@supports` を外す PR を出す（`plans/` の保守計画で四半期ごと）。
- 表に無い機能を使いたいときは、この表に行を足す PR を先に出す。
