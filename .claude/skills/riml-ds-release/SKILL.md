---
name: riml-ds-release
description: riml-ds のリリース規約。.changeset を書く、破壊的変更か判断する、@status を変える、バージョンを上げる、publish が落ちたときに読む。公開 API の定義（属性/イベント/slot/parts/CSS 変数/:state()）、semver の判定表、deprecated の手順、Trusted Publishing とゲート（publint / attw / size-limit / knip）。「これは major か」「deprecated にしたい」「publish が失敗した」「サイズ予算を超えた」で発火。
---

# riml-ds リリース規約

根拠は [ADR-0009](../../../docs/adr/0009-publishing-and-versioning.md)、手順は
[docs/publishing.md](../../../docs/publishing.md)。

## 1. 変更の種類 → semver

| 変更                                                   | レベル |
| ------------------------------------------------------ | ------ |
| 部品・トークン（semantic）・属性・イベント・slot・part・CSS 変数・状態の**追加** | minor |
| トークンの**値**の変更                                  | minor（VRT 差分を PR に添付）|
| 属性の既定値の変更                                     | major  |
| 名前の変更・削除（上のどれでも）                        | major（`deprecated` を 1 メジャー挟む） |
| イベント `detail` のフィールド削除・型変更              | major  |
| `experimental/` 以下の何でも                            | patch（semver 対象外） |
| 依存（lit）のメジャー更新                              | major  |
| バグ修正・内部リファクタ                               | patch  |

全パッケージ fixed バージョン。`0.x` の間は minor を major として扱う。

## 2. `.changeset` の書き方

```bash
bunx changeset
```

```md
---
"@rimltempest/riml-ds-elements": minor
---

`rd-button` に `size` 属性（sm / md / lg）を追加。既定は md で見た目は変わらない。
```

- 何を・なぜ・利用側が何をすべきか（major のとき）。
- 破壊的変更は `docs/migration.md` に ast-grep ルールも足す。

## 3. deprecated の手順

1. JSDoc に `@deprecated 代替は variant="ghost"。v3 で削除` を書く（CEM に載る）
2. `*.logic.ts` で旧値を新値にマップし、開発ビルドで `console.warn` を**1 回だけ**出す
3. Storybook に `Deprecated` バッジ（`@status deprecated`）
4. `.changeset` minor
5. 次のメジャーで削除 + `docs/migration.md` の codemod

## 4. publish 前のゲートが落ちたら

| ゲート        | 意味                                           | 直し方                                             |
| ------------- | ---------------------------------------------- | -------------------------------------------------- |
| `api-diff`    | CEM に破壊的変更があるのに major の changeset が無い | changeset を major に、または変更を後方互換に  |
| `gen-diff`    | 生成物が古い                                   | `bun run gen` してコミット                          |
| `publint`     | `exports` / `files` / `type` の不整合           | `package.json` を docs/publishing.md の形に          |
| `attw`        | 型解決の失敗（`node16` / `bundler`）            | `exports` に `types` を先頭で書く                   |
| `size-limit`  | 予算超過                                       | 依存を見直す。上げるなら PR に理由                  |
| `knip`        | 未使用 export / 依存                            | 消す。生成物は `knip.json` の `ignore` に            |
| `sherif`      | ワークスペース間の依存バージョン不一致          | `catalog:` に寄せる                                 |

## 5. 初回 publish と Trusted Publishing

初回はユーザーが手元で `npm publish --access public`（`.claude/settings.json` で deny。
エージェントは実行しない）。その後 npm の Web UI で trusted publisher を登録。以後は
`release.yml`（`id-token: write`）が publish する。トークンは存在しない。

## 6. リリース後

- GitHub Pages（Storybook / registry / DESIGN.md）が main マージで更新されているか
- `skills/riml-ds/SKILL.md` の「対応バージョン」を更新
- minor 以上なら手動 a11y 一巡（VoiceOver / NVDA）を CHANGELOG に記録
