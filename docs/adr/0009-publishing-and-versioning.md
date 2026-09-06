# 0009: 公開 API の定義・semver・ライフサイクル・Trusted Publishing

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0002, ADR-0011, [publishing.md](../publishing.md), [governance.md](../governance.md)

## 文脈

利用者は qrcc / noter（自分）から始まり、npm 公開（ユーザー決定：public scope）で第三者に
広がる可能性がある。Web Components の「破壊的変更」は TypeScript の型だけでは捕まらない
（属性名・イベント名・slot 名・CSS parts・CSS 変数は文字列）。

npm はクラシックトークンを 2025-11 に廃止し、CI からの publish は **Trusted Publishing
（OIDC）** が標準。provenance は自動付与される。ただし**最初の publish は人手**（パッケージが
存在しないと trusted publisher を設定できない）。

## 決定

### 公開 API の定義

部品の公開 API は **CEM（`custom-elements.json`）に載る以下のもの**：

| 種別          | 例                          | 破壊的変更になる操作                   |
| ------------- | --------------------------- | -------------------------------------- |
| 属性 / プロパティ | `variant`, `disabled`   | 名前変更・削除・型の狭め・既定値変更   |
| イベント      | `rd-change`（`detail` の形）| 名前変更・`detail` のフィールド削除    |
| slot          | `default`, `icon-start`     | 名前変更・削除                         |
| CSS parts     | `::part(control)`           | 名前変更・削除                         |
| CSS 変数      | `--rd-button-padding`       | 名前変更・削除                         |
| カスタム状態  | `:state(open)`              | 名前変更・削除                         |
| メソッド      | `focus()`, `checkValidity()`| 署名変更・削除                         |

トークンの公開 API は `tokens.json` に載る **semantic 層のトークン名**。base 層の名前は
公開 API ではない（部品からも参照禁止、ADR-0003）。

見た目の変更（色の値・余白の値）は **minor**。名前を消す・意味を変えるのが major。

### ライフサイクル（`@status`）

CEM の `@status` タグに 4 段階：

- `experimental` — 名前も API も変わり得る。`@riml-ds/elements/experimental/*` からのみ export。
  semver の対象外。
- `stable` — 上表に従う。
- `deprecated` — 1 メジャー後に削除。CEM の `@deprecated` に **代替と削除予定バージョン** を書く。
  実行時は `console.warn` を開発ビルドで 1 回だけ出す。
- `removed` — CHANGELOG と `docs/migration.md` に codemod（ast-grep）を残す。

experimental → stable の条件：story 8 種（ADR-0007）、AAA の自動検査が通る、Vitest browser
テストがある、2 つ以上のフレームワークの e2e で動く、`docs/` にガイドラインがある。

### バージョニング

- **全パッケージを同じバージョンで固定（fixed）**。`@riml-ds/tokens@2.x` と
  `@riml-ds/elements@2.x` は組み合わせ保証。changesets の `fixed` を使う。
- major は年 1 回まで。deprecated 期間は最短 1 メジャー。
- `0.x` の間（最初の外部利用者が出るまで）は minor を major 扱いにする。

### Publish

- **changesets** で `.changeset/*.md` → `version` PR → マージで `publish` ワークフロー。
- **npm Trusted Publishing**（GitHub Actions、`id-token: write`）。トークンを Secrets に置かない。
- **初回 publish はユーザーが手元で行う**（`npm publish --access public`）。その後 npm の
  Web UI で trusted publisher（repo / workflow 名）を設定する。手順は
  [publishing.md](../publishing.md)。
- publish 前のゲート：`publint`、`attw --pack`、`size-limit`、`knip`、生成物（CEM / ラッパー）が
  最新であることの検証（生成して diff ゼロ）。

### パッケージ形態

- ESM のみ、`"type": "module"`。バンドルしない（Lit の公開ガイドに従う）。
- `exports` は部品ごと：`"./button"`, `"./button/define"`, `"./tokens.css"`。ワイルドカード
  `"./*"` は使わない（公開範囲が曖昧になる）。
- `sideEffects: ["./dist/**/define.js", "./dist/**/*.css"]`。
- `customElements: "custom-elements.json"`。
- 型は `isolatedDeclarations` で `tsgo` が出す `.d.ts`。tsdown は `tools/mcp`（CLI）だけ。

## 理由

- 文字列 API を「表」で定義しておかないと、破壊的変更の判定が人の記憶になる。CEM の diff を
  CI で取れば **機械的に判定**できる（`tools/cem/diff`）。
- fixed バージョンは、利用側が「どの組み合わせが動くか」を考えなくてよい。一人運用で
  独立バージョンの互換表を維持するのは不可能。
- Trusted Publishing はトークン流出の経路をなくす。無料。

## 捨てた選択肢

- **独立バージョン** — 互換表の保守が破綻。
- **npm トークンを GitHub Secrets に置く** — 廃止済み・漏洩経路。
- **バンドルして配る** — Lit が重複し、利用側の tree-shaking が効かない。
- **`"./*"` の exports** — 内部ファイルが公開 API に見える。

## 影響

- CI の `api-diff` ジョブ：main の CEM と PR の CEM を比較し、破壊的変更に `.changeset` の
  `major` が無ければ失敗。
- `docs/migration.md` は削除ごとに ast-grep ルールを追記する。
- `experimental/` 以下の部品は Storybook で `Experimental` バッジを出す。
