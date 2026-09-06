---
name: riml-ds-architecture
description: riml-ds の構造と配置規約。「どこに置くか迷う」「新しい部品・トークン・パッケージ・ツールを足す」「system と library のどちらか分からない」「依存の向きが正しいか」「フレームワーク対応を増やす」ときに読む。ADR の要点と、変更の種類ごとの手順を持つ。
---

# riml-ds アーキテクチャ

全体像は [docs/architecture.md](../../../docs/architecture.md)。判断の根拠は `docs/adr/`。

## 1. どこに置くか

| 変えたいもの                                  | 場所                                      | ADR  |
| --------------------------------------------- | ----------------------------------------- | ---- |
| 色・余白・角丸・時間・フォントの**値**         | `system/tokens/src/**/*.tokens.json`      | 0003 |
| 値の**役割**（新しい semantic）               | `system/tokens/src/semantic/`             | 0003 |
| ダーク / 高コントラスト / 密度での違い        | `system/tokens/src/modes/`                | 0003 |
| ブランド（qrcc / noter）の色                  | `system/tokens/src/themes/<brand>/`       | 0003 |
| reset / base / utility / print の CSS         | `system/css/src/`                         | 0004 |
| 「どう見せるべきか」「なぜ」の判断            | `system/guidelines/*.md` → DESIGN.md 本文 | 0010 |
| 部品                                          | `library/elements/src/<name>/`            | 0002 |
| 実験的な部品                                  | `library/elements/src/experimental/<name>/` | 0009 |
| React / Vue / Svelte の型・ラッパー           | 書かない。`tools/cem` の生成器を直す      | 0002 |
| React 固有の糖衣（`use client` 等）           | `library/react/src/`（生成物以外）        | 0002 |
| lint ルール                                   | `tools/lint/`                             | 0006 |
| CEM の後処理・ラッパー生成                    | `tools/cem/`                              | 0002 |
| DESIGN.md フロントマター生成                  | `tools/design-md/`                        | 0010 |
| MCP のリソース・ツール                        | `tools/mcp/`                              | 0010 |
| story                                         | 部品の隣 `*.stories.ts`                   | 0007 |
| VRT / a11y e2e                                | `e2e/vrt/`、`e2e/a11y/`                   | 0007 |
| フレームワーク別 e2e                          | `e2e/<fw>/`                               | 0002 |
| 利用側向けの手順                              | `skills/riml-ds/SKILL.md`                 | 0010 |
| 保守側向けの手順                              | `.claude/skills/riml-ds-*/`               | —    |

**system か library か迷ったら**：「フレームワークも Web Components も無い世界でも意味があるか」。
あるなら `system/`。

## 2. 依存の向き（CI `guard` が落とす）

```
system/tokens → system/css → library/elements → library/{react,vue,svelte,astro}
                                    ↓
                               tools/cem → tools/mcp, apps/storybook
```

- `system/*` は `library/*` を import しない。
- `library/elements` は `lit` + `@rimltempest/riml-ds-tokens` だけ。`@lit-labs/*` は ADR を書いてから。
- ラッパーは `custom-elements.json` だけを読む。`library/elements/src` を読まない。
- `tools/*` はどこからも import されない。
- パッケージ間は `@rimltempest/riml-ds-<name>` の公開サブパス経由のみ。相対パスで隣に手を伸ばさない。

## 3. 変更の種類ごとの手順

### トークンを足す / 変える

1. `system/tokens/src/**` を編集（`$description` 必須）
2. `bun run --filter @rimltempest/riml-ds-tokens check` → `build`
3. `bun run gen`（DESIGN.md フロントマター）
4. Storybook の `Tokens` docs と 6 条件 story を確認、VRT 差分を見る
5. `.changeset`：名前の追加は minor、名前の変更・削除は major、値の変更は minor

### 部品を足す

1. `docs/proposals/<name>.md`（1 ページ：用途・既存で足りない理由・API 案・a11y の論点）
2. `library/elements/src/experimental/<name>/` に `riml-ds-element` skill の構成で作る
3. `bun run gen`（CEM → ラッパー → registry）
4. story 8 種、Vitest browser、`e2e/react` と `e2e/vue` で動作確認
5. stable 昇格は別 PR（`@status stable`、`experimental/` から移動、`exports` に追加）

### フレームワーク対応を足す（例: Solid）

1. `library/solid/` を作る。`package.json` と `src/index.ts`（手書きは薄い糖衣のみ）
2. `tools/cem/src/generators/solid.ts` を書く（入力は CEM のみ）
3. `e2e/solid/` に最小アプリ（Vite）と Playwright テスト（5 部品が描画・操作できる）
4. `docs/architecture.md` の表、`scripts/lanes.tsv`、`skills/riml-ds/SKILL.md` のフレームワーク別節を更新
5. ADR-0002 に追記（新しい ADR は不要）

### Baseline の見直し（四半期）

1. `docs/baseline.md` の Newly を MDN で確認
2. Widely に上がったものは `@supports` を外す PR（1 機能 1 PR）
3. Wait から Newly に上がったものは「使うか」を判断して表に書く

## 4. やってはいけない設計

- 部品の中に **トークン値をコピー**する（shadow 内 `:host { --local: oklch(…) }`）。`--rd-*` を参照する。
- 部品ごとに `aria-live` を持つ。`rd-live-region` に流す。
- ラッパーを手書きする。生成器を直す。
- `library/elements` の中で `fetch` / `localStorage` を触る。部品は I/O を持たない。
  必要なら利用側が属性で渡す。
- 「ページ」の責務（ルーティング・テーマ切替 UI・WebMCP 登録）を部品に入れる。
- `packages/` ディレクトリを作る。`system/` と `library/` の意図が消える。
