# レビュー用チェックリスト

## 禁止事項

- [ ] `any` / `as`（`as const` 以外）/ `!` / `enum` が無い
- [ ] `class` は `*.element.ts` だけ。その中に判断（if/switch）が 5 個以下、150 行以下
- [ ] `default export` は `*.stories.ts` と設定ファイルだけ
- [ ] `*.logic.ts` / `tools/*` に `throw` が無い

## 型

- [ ] ID・トークンパス・CSS 変数名は Branded 型
- [ ] 状態は discriminated union。フラットな optional の組み合わせで表していない
- [ ] `switch` の `default` に `const _: never` がある
- [ ] export する関数は戻り値の型を明示している（`isolatedDeclarations`）

## 依存

- [ ] 時計・`matchMedia`・`requestAnimationFrame`・fs・fetch を引数で受け取っている
- [ ] `Deps` の型は利用側で定義し、使わないメンバーが無い
- [ ] 配線は composition root（`main.ts` / `*.element.ts` の constructor）だけ

## 境界

- [ ] `library/elements` は `lit` と `@rimltempest/riml-ds-tokens` 以外に依存していない
- [ ] `system/*` から `library/*` を import していない
- [ ] `*.logic.ts` が DOM の実体（`document` / `window`）に触っていない
- [ ] 他パッケージの内部パス（`../../react/src`）に手を伸ばしていない

## テスト

- [ ] 先に落ちるテストがあった（コミット順で分かる）
- [ ] `Result` の `err` 枝をテストしている
- [ ] union のメンバーごとにテストがある
- [ ] テストサイズが適切（`riml-ds-tdd`）
