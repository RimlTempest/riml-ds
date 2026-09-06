# riml-ds

qrcc / noter をはじめ、riml のプロダクト群が共有する **デザインシステム**と
**コンポーネントライブラリ**。1 つの monorepo だが、両者は別物として分けて管理する。

- **デザインシステム**（`system/`）: 判断の記録。トークン（W3C DTCG JSON）、基礎 CSS、
  ガイドライン、`DESIGN.md`。**コードが唯一の正**で、Figma は使わない。
- **コンポーネントライブラリ**（`library/`）: システムの実装。Lit の Web Components を
  唯一のソースにし、React / Vue / Svelte / Astro 向けは **Custom Elements Manifest から生成**する。

npm 公開スコープ `@rimltempest/riml-ds-*`、カスタム要素の接頭辞 `rd-`、CSS 変数の接頭辞 `--rd-`。
**無料で運用しきる**（GitHub Actions 公開リポジトリ枠・GitHub Pages・npm 公開パッケージのみ。
有料 SaaS のビジュアルリグレッションや Figma 連携は使わない）。

## 作業を始める前に読むもの

| 状況                                         | 読むスキル             |
| -------------------------------------------- | ---------------------- |
| どこに置くか迷う・パッケージ境界を越える     | `riml-ds-architecture` |
| TS を書く・直す                              | `riml-ds-typescript`   |
| CSS・トークン参照・レイヤ・Baseline 判定     | `riml-ds-css`          |
| トークンを足す・変える・テーマを作る         | `riml-ds-tokens`       |
| Web Component（`rd-*`）を書く・直す          | `riml-ds-element`      |
| 機能追加・バグ修正（必ず red → green）       | `riml-ds-tdd`          |
| リリース・非推奨化・破壊的変更               | `riml-ds-release`      |
| 並行作業・worktree・コンフリクト             | `riml-ds-worktree`     |
| UI・UX の見直し                              | `better-interface`     |
| 「いま標準で何ができるか」を引く             | `modern-web-guidance`（`bunx` で実行） |

設計の背景は `docs/architecture.md` と `docs/adr/`。見た目の正は `DESIGN.md`。

## 絶対に守ること

- **`any` / `as`（`as const` を除く）/ `!` / `enum` を書かない。** `.oxlintrc.json` の
  `riml-ds/*` ルールが落とす。回避せず設計を直す。
- **`class` は `library/elements/src/**/*.element.ts` だけ。** カスタム要素はプラットフォームが
  class を要求するので、ここだけ例外（ADR-0005）。ロジックは隣の `*.logic.ts` に純関数で書く。
- **色・寸法・時間・角丸の生値を CSS に書かない。** すべて `--rd-*` トークンを参照する。
  `stylelint-declaration-strict-value` が落とす（ADR-0004）。
- **トークンの正は `system/tokens/src/**/*.tokens.json`（DTCG 2025.10）だけ。**
  `tokens.css` / `tokens.ts` / `DESIGN.md` のフロントマターは生成物。手で直さない。
- **ラッパー（`library/react` など）を手で書かない。** `custom-elements.json` から生成する（ADR-0002）。
  生成物は `src/generated/` に置き、コミットしない。
- **公開 API は「属性・プロパティ・イベント・スロット・CSS part・CSS 変数・`:state()`」。**
  これらを変える／消すのは破壊的変更。`@deprecated` を 1 メジャー挟む（ADR-0009）。
- **Baseline「Widely available」にない機能は `@supports` / 機能検出で段階的に使う。**
  一覧は `docs/baseline.md`。「Wait」の列にあるものは使わない。
- **AAA を既定にする。** 本文コントラスト 7:1、ターゲット 44×44、`prefers-reduced-motion`
  で動きは既定オフ、色だけで状態を伝えない（`docs/accessibility.md`）。
- **実装より先に失敗するテストを書く。**
- **自分のレーンが所有していないファイルを編集しない**（`scripts/lanes.tsv`）。
- **`library/elements` は他のパッケージに依存しない**（`lit` と `@rimltempest/riml-ds-tokens` の CSS だけ）。
  逆方向（`system/*` → `library/*`）の依存も禁止。

## コマンド

```bash
bun run dev          # Storybook（apps/storybook）
bun run build        # tokens → elements(CEM) → wrappers → storybook-static の順
bun run check        # fmt + lint(oxlint/stylelint/markuplint) + typecheck + tokens check + publint
bun run test         # Vitest（node + browser プロジェクト + story tests）
bun run a11y         # Playwright + axe-core（AAA タグ込み）
bun run vrt          # Playwright スクリーンショット比較（Docker 内で更新）
bun run wt list      # 並行作業レーン一覧
```

コミット前に `bun run check`。lefthook が staged ファイル単位で自動実行する。

## コミット規約

Conventional Commits（lefthook の `commit-msg` が検証する）。scope はパッケージ名か領域。

```
feat(elements): add rd-dialog with light dismiss
fix(tokens): raise accent lightness to keep 7:1 on dark surfaces
docs(adr): record wrapper generation decision
```

## ツールチェーン

`mise.toml` で node / bun を固定。新しい環境では:

```bash
mise install && bun install && bunx lefthook install
```

Lint は oxlint（JS/TS）+ stylelint 17（CSS）+ markuplint（HTML/ストーリーの描画結果）、
フォーマットは oxfmt。ESLint / Prettier は使わない（ADR-0006）。TypeScript は 7（Go 実装）。
