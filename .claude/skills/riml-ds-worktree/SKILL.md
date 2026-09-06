---
name: riml-ds-worktree
description: riml-ds の worktree 並行作業ルール。複数の作業を同時に進めるとき、新しいレーンを始めるとき、rebase が競合したとき、PR を出すときに読む。レーンごとの所有パス・依存順・共有ファイル（bun.lock / 生成物）の規約を定義する。「並行で進めたい」「worktree を作る」「コンフリクトした」「どのブランチで作業する」で発火。
---

# worktree 並行作業

レーン定義は [docs/parallel-lanes.md](../../../docs/parallel-lanes.md)、機械可読は `scripts/lanes.tsv`。

## 1. 原則

**1 レーン = 1 worktree = 1 ブランチ = 1 PR。** レーンは所有パスで分かれている。
**自分のレーンが所有していないファイルは編集しない。**

## 2. コマンド

```bash
bun run wt list                 # レーン一覧・依存・現在の worktree
bun run wt new feat/elements    # worktree 作成（bun install・lefthook 込み）
cd .claude/worktrees/feat-elements && cat LANE.md
bun run wt sync                 # main を rebase で取り込む
bun run check                   # コミット前の全チェック
bun run wt pr                   # check を通してから PR
bun run wt done feat/elements   # マージ後に片付け
```

## 3. 始める前に

1. `scripts/lanes.tsv` の depends_on が main にあるか（`git log --oneline origin/main`）
2. `chore/scaffold` は全レーンの先行条件
3. `LANE.md` の所有パスが作業を含むか。含まないならレーンの選択か `lanes.tsv` が間違い

## 4. 共有ファイルは「解決」せず「再生成」する

| ファイル                                       | 対応                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `bun.lock`                                     | `git checkout --ours bun.lock && bun install && git add bun.lock`    |
| `custom-elements.json`、`src/generated/**`、`system/tokens/dist/**`、DESIGN.md フロントマター | git 管理外か生成物。`bun run gen` で作り直す |
| ルート `package.json` / `vitest.config.ts` / `.oxlintrc.json` / `lefthook.yml` | `chore/scaffold` のみ。依存は各パッケージの `package.json` に足す |
| `e2e/__screenshots__/**`                       | `feat/storybook` のみ。他レーンで見た目が変わったら plan に「VRT 更新要」と書く |
| `DESIGN.md` 本文                               | advisor（人）が書く。executor は触らない                              |

これ以外が競合したら、レーンの切り方が間違っている。握らずに `lanes.tsv` を直してから再開する。

## 5. マージ順

```
chore/scaffold → feat/tokens → feat/css → feat/elements → { feat/storybook, feat/frameworks } → feat/release → feat/agent
chore/devops は scaffold の後、随時
```

reviewer は `--no-ff` でマージする（レーン単位の履歴を残す）。レーン内は rebase で直線に保つ。
依存レーンが main に入ったら、その日のうちに `bun run wt sync`。

## 6. エージェントに割り当てるとき

worktree に入ったエージェントに渡すもの：`LANE.md`、`docs/architecture.md`、該当 ADR、
plan、該当 skill（`riml-ds-typescript` / `riml-ds-tdd` / `riml-ds-element` / `riml-ds-css` / `riml-ds-tokens`）。
**レーンをまたぐ判断が必要になったら STOP して報告する。**
