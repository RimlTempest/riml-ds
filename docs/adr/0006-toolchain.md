# 0006: TypeScript 7 + oxc、CSS は stylelint 17、HTML は markuplint

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0004, ADR-0005, qrcc ADR-0006（oxlint / oxfmt 採用）

## 文脈

qrcc / noter は ESLint / Prettier を使わず、oxlint + oxfmt + TypeScript 7（Go 実装、
`typescript-go` は 2026-09-01 に本体へ統合）で揃えている。独自ルール（no-class / no-type-assertion /
no-enum）は oxlint の JS プラグイン（alpha）で書いた実績がある。

追加で必要なもの：CSS の lint（生値禁止・論理プロパティ・Baseline）、HTML の lint（Storybook
で描画した DOM）。oxfmt は CSS の整形に対応した。stylelint 17.15 は論理プロパティ・単位・
キーワードの組み込みルールを持つ。markuplint は lit-html のパーサを持たない。

## 決定

| 対象                   | ツール                                           | 備考                                                     |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| TS / JS の lint        | **oxlint** + JS プラグイン `riml-ds/*`           | `no-any` / `no-type-assertion`（`as const` 除く）/ `no-non-null-assertion` / `no-enum` / `no-class`（`*.element.ts` 除く）/ `no-default-export`（`*.stories.ts` 除く） |
| TS / JS / CSS / JSON / MD の整形 | **oxfmt**                              | Prettier は入れない                                      |
| 型検査                 | **TypeScript 7**（`tsgo`）                       | `strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `isolatedDeclarations` |
| CSS の lint            | **stylelint 17** + `stylelint-declaration-strict-value` + `postcss-lit` | `.css` と `*.styles.ts`。設定は `tools/lint`      |
| HTML の lint           | **markuplint**（`tools/markuplint`、TS 6 に隔離）| Storybook の静的出力から story ごとの HTML を吐いて検査  |
| 未使用 / 依存不整合    | **knip** / **sherif**                            | CI                                                       |
| パッケージ健全性       | **publint** / **@arethetypeswrong/cli** / **size-limit** | CI（publish 前）                                  |
| Git hooks              | **lefthook**                                     | pre-commit: fmt/lint/terrazzo check/secrets grep; pre-push: typecheck/test; commit-msg: Conventional Commits |
| ランタイム固定         | **mise**（node / bun / rust は不要）             | `mise.toml`                                              |

- markuplint は TS 7 で動かないプログラマティック API を使うため、noter と同じく
  `tools/markuplint/`（TypeScript 6 固定の独立 workspace）に隔離し、CLI 経由で呼ぶ。
- lit-html のテンプレートは markuplint できないので、**描画後の DOM**を検査対象にする
  （Storybook の各 story を Playwright で開き `outerHTML` を出力 → markuplint）。
  Shadow DOM の中身は `getHTML({ serializableShadowRoots: true })` で展開して含める。

## 理由

- 既存 2 リポジトリと同じ道具なら、skills と lefthook をそのまま移植できる。
- oxlint / oxfmt は Rust 製で速く、pre-commit で全ファイルを回しても待たない。
- CSS の規約（ADR-0004）は oxlint では書けない。stylelint の `declaration-strict-value` が
  唯一の実績あるトークン強制手段。
- 描画後 DOM の検査は、テンプレートの静的解析より**正確**（条件分岐後の実物を見る）。

## 捨てた選択肢

- **ESLint（typescript-eslint + eslint-plugin-lit + eslint-plugin-wc）** — 既存規約に反する。
  `eslint-plugin-lit` の価値（`no-invalid-html` 等）は Vitest browser の実描画テストで代替。
- **Biome** — CSS は整形のみで lint の拡張性がない。JS プラグインもない。
- **lit-analyzer** — TS 7 の Language Service プラグイン API に未対応。将来再評価。
- **markuplint を TS 7 で無理に動かす** — noter で失敗済み。

## 影響

- `.oxlintrc.json` はルートに 1 つ。`jsPlugins: ["./tools/lint/oxlint-plugin/index.js"]`。
- `tools/lint` は `@riml-ds/lint` として公開し、利用側が同じ stylelint 設定を
  `extends: "@riml-ds/lint/stylelint"` で使えるようにする。
- oxlint JS プラグインが alpha のまま壊れた場合の退路：同じルールを **ast-grep**（YAML）で
  書き直す。ルールは `tools/lint/rules/*.yml` にも二重に置き、CI で両方回す（片方が壊れても
  もう片方が守る）。
