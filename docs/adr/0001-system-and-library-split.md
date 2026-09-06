# 0001: デザインシステムとコンポーネントライブラリを分ける

- 状態: Accepted
- 日付: 2026-09-07
- 関連: [architecture.md](../architecture.md), ADR-0002, ADR-0003

## 文脈

qrcc（TanStack Start + React）と noter（同）は、それぞれ `--qrcc-*` / `--noter-*` の CSS 変数と
手書きの React コンポーネントを持つ。今後 Vue / Svelte / Astro / Lit のプロジェクトも増える。
「見た目と判断」（色・余白・文言・a11y の基準）は全部で共有したいが、「実装」（React の
`<Button>`）は共有できない相手がいる。

「デザインシステム」と「コンポーネントライブラリ」は別物である。前者は判断の体系、後者は
その実装の一つ。同一視すると、実装を差し替えられない・トークンだけ欲しい相手に React を
押しつける・ドキュメントが実装の都合で歪む、が起きる。

## 決定

同じリポジトリ（Bun workspaces）に **`system/` と `library/` の 2 領域**を置き、

- `system/` = デザインシステム。トークン（`@rimltempest/riml-ds-tokens`）、基盤 CSS（`@rimltempest/riml-ds-css`）、
  ガイドライン（prose）。**フレームワークも Web Components も知らない。**
- `library/` = コンポーネントライブラリ。`system/` を消費して部品を実装する。
  `library/elements`（Lit）と、そこから生成する各フレームワーク向けパッケージ。

依存は `system → library` の一方向のみ。`system/*` から `library/*` を import した時点で CI が落ちる。

## 理由

- **片方だけ採用できる。** qrcc が既存の React 実装を維持しつつ `@rimltempest/riml-ds-tokens` だけ
  乗り換える移行が可能（[migration.md](../migration.md)）。
- **判断の寿命は実装より長い。** フレームワークが変わってもトークンとガイドラインは残る。
- **エージェントにとって境界が明瞭。** 「見た目を変える → `system/`」「動きを変える → `library/`」。
  DESIGN.md は `system/` から生成し、`custom-elements.json` は `library/` から生成する。
- **単一リポジトリ**にするのは、トークン変更が部品に及ぶ影響を同じ PR・同じ CI で見たいから。
  別リポジトリだとバージョンの噛み合わせが運用負担になる（一人運用では致命的）。

## 捨てた選択肢

- **単一パッケージ `@rimltempest/riml-ds-ui` に全部入れる** — トークンだけ欲しい相手に Lit が付いてくる。
- **リポジトリを 2 つに分ける** — 変更の同時性が失われ、無料枠の CI を 2 倍消費する。
- **Figma を「システム」、コードを「ライブラリ」とする** — ユーザー決定により Figma は持たない
  （ADR-0003）。コードが唯一の正。

## 影響

- ディレクトリ名は `system/` / `library/` に固定。`packages/` は作らない（意図が消える）。
- `tools/lint` の依存方向チェック（`scripts/guard.sh`）：`system/**` の import 文に
  `@rimltempest/riml-ds-elements|react|vue|svelte|astro` または `../library` が現れたら失敗。
- ガイドラインの本文は `system/guidelines/`。DESIGN.md はそれを要約したものであり、
  矛盾したら `system/guidelines/` を正とする。
