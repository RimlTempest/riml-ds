# 0008: AAA を既定にし、`ElementInternals` を第一の手段にする

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0003, ADR-0004, ADR-0007, [accessibility.md](../accessibility.md)

## 文脈

qrcc / noter は WCAG 2.2 AAA を「なるべく守る」目標で運用し、axe（`wcag2aaa` タグ）と
Playwright の e2e で固定してきた。Web Components では追加の論点がある：Shadow DOM を
またぐ `aria-labelledby` の ID 参照が効かない、フォーム部品がネイティブ `<form>` に乗らない、
`:focus-visible` の描き方が shadow 内で閉じる。

2026-09 時点の Baseline：`ElementInternals`（`formAssociated`、`setValidity`、`states`）、
ARIAMixin の要素反映（`ariaLabelledByElements` 等）、`delegatesFocus`、`:state()`（Newly）、
`inert`、`<dialog>`、popover（Newly）。Reference Target と Scoped Custom Element Registries は
Baseline 外。

## 決定

1. **既定は AAA。** コントラスト 7:1（テキスト）/ 3:1（非テキスト、UI 部品の境界）、
   ターゲット 44×44 CSS px、フォーカス表示 3px + offset 2px で背景に対し 3:1、
   モーションは既定で無効（`prefers-reduced-motion: no-preference` で有効化）、
   色だけで状態を伝えない（形・文言・アイコンを併用）、行長 80ch 以下、行間 1.5 以上。
   AAA を満たせない部品は **作らない**か、`@status experimental` で公開しない。
2. **フォーム部品は `ElementInternals` で form-associated にする。** `setFormValue` /
   `setValidity` / `validationMessage` / `checkValidity()` を実装し、ネイティブの
   `<form>` の送信・リセット・`:user-invalid` に乗る。独自の `value` イベントだけで
   完結させない。
3. **状態は `ElementInternals.states`**（`:state(open)` / `:state(invalid)`）。属性反映（`open`）
   は公開 API として併用するが、スタイルは `:state()` を主にし、`@supports selector(:state(x))`
   の外では属性セレクタにフォールバックする。
4. **ラベル付けは shadow をまたがない設計にする。** テキスト部品は `label` 属性を必須にし、
   shadow 内で `<label for>` を完結させる。外部ラベルを使いたい場合は `ariaLabelledByElements`
   （要素参照）を受け取る `labelledBy` プロパティを提供する。ID 文字列の `aria-labelledby`
   は shadow をまたげないため**受け取らない**。
5. **`delegatesFocus: true`** を既定にし、ホスト要素の `focus()` が内部の操作対象へ届くようにする。
   フォーカスリングは `:host(:focus-visible)` ではなく内部要素の `:focus-visible` に描く
   （ホストに描くと部品の外形に依存して 3:1 を満たせないことがある）。
6. **ライブリージョンは 1 部品（`<rd-live-region>`）に集約**し、他の部品は自分で
   `aria-live` を持たない（多重読み上げを防ぐ）。
7. 自動検査（axe）は AAA タグを含めて **story ごと** に回す（ADR-0007）。自動化できない項目
   （読み上げ順・操作の意味）は `@guidepup/virtual-screen-reader` で Vitest 内に固定し、
   VoiceOver / NVDA の手動確認は `docs/accessibility.md` の一覧に残す。

## 理由

- AAA を「後で」にすると、色・サイズ・モーションの決定がすべてやり直しになる。トークン
  段階（ADR-0003 の lint）で固定するのが最も安い。
- `ElementInternals` はネイティブフォームとの統合を **標準の手段** で実現する唯一の方法。
  独自イベントだけの部品は React / Vue のフォームライブラリで二重配線になる。
- `:state()` は class の付け替えより速く、利用側から `rd-dialog:state(open)` で参照できる
  **公開 API** になる（ADR-0009）。
- Reference Target を待たずに shadow 内ラベルで完結させれば、いま動く。

## 捨てた選択肢

- **AA を既定にして AAA は任意** — 既存 2 リポジトリの基準を下げることになる。
- **Light DOM（shadow を使わない）で ID 参照を通す** — スタイルのカプセル化が消え、
  利用側の CSS と衝突する。フォーム部品だけ light DOM にする案も、境界が二重になり保守不能。
- **Reference Target に依存** — Baseline 外。Chrome のみ。
- **各部品が `aria-live` を持つ** — 多重読み上げの実害を noter で経験済み。

## 影響

- `system/guidelines/accessibility.md` にチェックリスト。部品 PR のテンプレに転記する。
- `library/elements` のテンプレート（`riml-ds-element` skill）に `ElementInternals` の取得と
  `delegatesFocus` を含める。
- Storybook の `Invalid` story は `checkValidity()` が false を返し `:user-invalid` が
  描かれることを interaction test で確認する。
