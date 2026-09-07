# 0005: `class` は `*.element.ts` に限って許す

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0002, ADR-0006, [riml-ds-typescript](../../.claude/skills/riml-ds-typescript/SKILL.md)

## 文脈

qrcc / noter は `class` を禁止している（関数と `Result<T, E>`、依存は引数で受ける）。
理由は、状態と振る舞いが暗黙に結合し、テストで差し替えにくく、`this` の扱いをエージェントが
間違えるから。noter では Durable Object のために `**/durable-objects/*.ts` だけ例外にした。

Custom Elements は `HTMLElement` を継承する **class でしか定義できない**。Lit も同じ。

## 決定

1. `class` は **`library/elements/src/**/*.element.ts` だけ**で許す。oxlint の `riml-ds/no-class`
   がそれ以外のパスで落とす。
2. `*.element.ts` は**薄い殻**にする。許すのは：
   - `static properties` / 標準デコレータ（`@property` + `accessor`）による反応的プロパティの宣言
   - `static styles`、`static formAssociated`、`static shadowRootOptions`
   - `render()`（テンプレートを返すだけ）
   - ライフサイクル（`connectedCallback` 等）から **`*.logic.ts` の純関数を呼ぶ**こと
   - `ElementInternals` の取得と `states` / `setFormValue` / `setValidity` の呼び出し
3. **禁止**：`*.element.ts` に条件分岐を伴うロジック、値の検証、ARIA 属性の計算、
   文字列整形を書くこと。それらは `*.logic.ts` に置き、`*.logic.test.ts` で node 環境で
   テストする。`class` の中の private メソッドは 10 行を超えたら logic に出す。
4. デコレータは **TC39 標準デコレータ（`accessor` 付き）**を使う。TypeScript の
   `experimentalDecorators` は有効にしない。TS 7 で標準デコレータの出力に問題が出た場合は
   `static properties` に落とす（plan 004 の spike で決める。決定はここに追記する）。

   **追記（2026-09-07、plan 004 の spike）：`static properties` に落とした。** `tsc`（TS 7.0.2）は標準デコレータを
   正しく emit する（`tslib` の `__esDecorate` / `__runInitializers`）が、Vitest browser が使う Vite 8 / rolldown（oxc）は
   デコレータと `accessor` を変換せずに素通しし、Chromium が `SyntaxError` になる。`rolldown/experimental` の
   `transform` を各オプションで叩いても変換されなかった。`experimentalDecorators` には逃げていない。
   書き方は次で固定する（exemplar: `library/elements/src/button/button.element.ts`）：

   ```ts
   static override properties: PropertyDeclarations = { variant: {}, loading: { type: Boolean, reflect: true } }
   declare variant: ButtonVariant
   declare loading: boolean
   constructor() { super(); this.variant = 'primary'; this.loading = false }
   ```

   `declare` が要るのは `useDefineForClassFields` がクラスフィールドを `[[Define]]` で定義し、Lit の accessor を
   上書きしてしまうため。初期値は constructor で代入する。サイズ（lit 込み・brotli）は `static properties` 5.35 kB /
   標準デコレータ 6.25 kB。`importHelpers: true` + `tslib` は据え置き（helper が出ないので 0 バイト）。
   rolldown / oxc が標準デコレータを変換できるようになったら、この項を新しい ADR で置き換える。
5. `*.element.ts` 以外で `class` が必要になったら、まず「関数 + クロージャ」で書けないか、
   次に「標準 API が class を要求しているか」を問う。必要なら **ADR を起こして**パスを足す。

## 理由

- 標準 API が class を要求する場所だけを、ファイル名で機械的に判別できる。
- ロジックを純関数に出すと、DOM を立てずに大半のテストが書け、Vitest browser の枚数が減る
  （CI 時間 = 無料枠）。
- 「殻は薄く」を lint で強制できないぶん、`riml-ds-element` skill と PR テンプレのチェック
  項目で補う。

## 捨てた選択肢

- **class を全面解禁** — qrcc / noter で確立した規約（関数・DI・Result）が崩れ、エージェントの
  出力品質が落ちた実績がある。
- **関数から `customElements.define` に class 式を渡す** — 結局 class を書いている。
  読みにくくなるだけ。
- **Lit を捨てて関数型 WC ライブラリ（Haunted / Atomico）** — 保守者が少ない。CEM / Storybook
  のエコシステムが Lit 前提。

## 影響

- oxlint プラグイン `tools/lint/oxlint-plugin/index.js`：`no-class` は
  `filename.endsWith('.element.ts')` で免除。
- `riml-ds-element` skill の必須構成：`<name>.element.ts` / `.logic.ts` / `.styles.ts` /
  `.define.ts` / `.stories.ts` / `.test.ts` / `.logic.test.ts` / `index.ts`。
- レビュー観点：`*.element.ts` の行数（目安 150 行以下）と `if` の数（目安 5 以下）。
