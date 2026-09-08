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

## 7. reviewer が並行レーンを main に取り込むときの手順（事故から学んだ規則）

並行する部品レーン（`feat/<element>` 同士）は、`e2e/**` の一覧・`package.json` の `exports`・
`.size-limit.json`・`tools/mcp/src/examples.ts`・`library/react/test/markup.test.tsx` に**同じ場所へ 1 ブロックずつ足す**ので、
2 本目以降を取り込むときは必ず競合する。「握らない」の原則（§4）は executor 向けで、reviewer は
worktree 側で `git merge main --no-commit` してから **union（HEAD 側 → main 側の順）** で解く。

1. **union は両側に共通する行を落とす。** 競合の前後にある `import {` の開き、`} as const` の閉じ、
   関数呼び出しの `})}\`,\n  ),` のような閉じ、JSON の要素境界（`"limit": "12 KB"\n  },\n  {`）、
   `describe` の閉じ `})\n  })\n}` が消える。解いたあとは**必ず**:
   - `bunx oxfmt --check <解いた .ts/.tsx>` → 構文エラーの位置が出る
   - JSON は `python3 -c "import json; json.load(open(...))"` **だけでは足りない**（要素境界が落ちると
     キー重複の「有効な JSON」になり、後ろのエントリが前のエントリを上書きする）。
     `.size-limit.json` は `bunx size-limit --json` で**新しい部品の行が出るか**を見る
   - `markup.test.tsx` の同じモジュールからの `import` が 2 行に割れていないか
   - `custom-elements.json` / `tools/cem/registry.json` は解かず `bun run gen` で作り直す
2. **`git push` は main のチェックアウトからだけ叩く。** worktree の中で push すると lefthook の
   pre-push（vitest）が `GIT_DIR` を export した状態で走り、子プロセスで `git init` するテストが
   **本物のリポジトリを壊す**（2026-09-09 に `core.bare = true` になった事故。`scripts/guard.test.ts` は
   `GIT_*` を落とすよう直したが、規則としても守る）
3. **Docker の VRT と `bun run pe` / `bun run a11y` / `bun run e2e:frameworks` を同時に回さない。**
   `page.goto` が 30 秒でタイムアウトし、無関係な story が落ちる。VRT の失敗は
   `bash scripts/vrt.sh --project vrt-light-360 --grep "a|b"` で当該 story だけ撮り直す
4. **CI の fmt-lint は build より前に走る**ので `library/*/src/generated/**` が無い。テストで生成物の
   barrel（`../src/experimental.js`）を `import * as ns` して `ns.RdX` と書くと `import/namespace` が落ちる。
   **名前付き import**（`import { RdX } from '../src/experimental.js'`）にする
5. 取り込み後の worktree で `bun install --frozen-lockfile; git checkout -q bun.lock`、`bun run build && bun run gen`、
   `bun run check`、`bun run test` を通してから e2e 系へ進む。main への `--no-ff` マージは
   **main のチェックアウトで**行い、そこで `build && gen`、`bash scripts/guard.sh` を再度通す
