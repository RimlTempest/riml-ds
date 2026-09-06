# 並行レーン

`scripts/lanes.tsv` が正。`bun run wt list` で一覧、`bun run wt new <branch>` で worktree を作る
（`.claude/worktrees/<branch>`）。レーンが所有するパスだけを編集する（CLAUDE.md）。

```
chore/scaffold ──┬── feat/tokens ──┬── feat/css ──┬── feat/elements ──┬── feat/storybook ──┐
                 │                 │              │                    ├── feat/frameworks ─┼── feat/release ── feat/agent
                 └── chore/devops ─┴──────────────┴────────────────────┴─────────────────────┘
```

| レーン           | 所有パス                                                             | 依存                    |
| ---------------- | -------------------------------------------------------------------- | ----------------------- |
| chore/scaffold   | ルート設定、`tools/lint`、`tools/markuplint`、`scripts/`             | —                       |
| feat/tokens      | `system/tokens`、`tools/design-md`、`DESIGN.md` フロントマター       | scaffold                |
| feat/css         | `system/css`                                                         | tokens                  |
| feat/elements    | `library/elements`、`tools/cem`                                      | css                     |
| feat/storybook   | `apps/storybook`、`e2e/vrt`、`e2e/a11y`                              | elements                |
| feat/frameworks  | `library/{react,vue,svelte,astro}`、`e2e/{react,vue,svelte,astro}`   | elements                |
| feat/release     | `.changeset`、`.github/workflows/release.yml`、`docs/publishing.md`  | frameworks, storybook   |
| feat/agent       | `tools/mcp`、`skills/`、`AGENTS.md`                                  | release                 |
| chore/devops     | `.github/workflows/{ci,pages}.yml`、`e2e/Dockerfile`、`scripts/affected.sh` | scaffold         |

共有ファイル（`package.json` ルート、`bun.lock`、`vitest.config.ts`）は **scaffold レーンの所有**。
他レーンが依存を足すときは自パッケージの `package.json` にだけ書き、ルートの lock 更新は
マージ時に reviewer が行う。
