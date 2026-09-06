# 0002: Lit を唯一のソースにし、各フレームワーク向けは CEM から生成する

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0001, ADR-0005, ADR-0009, [architecture.md](../architecture.md) §2

## 文脈

利用側は React 19（qrcc / noter）に加え、Vue / Svelte / Astro / Lit が予定されている。
選択肢は「フレームワークごとに実装する」「ヘッドレスなロジックを共有して各フレームワークで薄い
UI を書く」「Web Components を 1 つ書いて全部で使う」の 3 つ。

調査の要点（2026-09）：

- React 19 は custom-elements-everywhere で 16/16。属性・プロパティ・イベントの受け渡しに
  `@lit/react` は必須ではない（型と `onXxx` の糖衣のために使う）。
- Vue 3.5 は `compilerOptions.isCustomElement` と `.prop` 修飾子で問題なし。
- Svelte 5 / Astro 5 は摩擦ゼロ。Astro は `client:*` すら不要。
- Zag / Ark UI は Web Components を出力しない。Mitosis は出力の質が不安定。
  Stencil は独自コンパイラで Lit より重くエコシステムが縮小。
- Lit 3.x は 5KB、`@lit/context` / `@lit/task` は安定。`@lit-labs/ssr` は Labs のまま。
- Custom Elements Manifest（CEM）は Storybook・VS Code・ラッパー生成器（wc-toolkit）の共通入力になっている。

## 決定

1. **部品の実装は `library/elements`（Lit 3、`rd-` プレフィックス）だけに書く。**
2. **`custom-elements.json`（CEM）を API の正とし、React / Vue / Svelte の型・ラッパーは
   CEM から生成する**（`tools/cem`、wc-toolkit の生成器を使い、足りない分は自作）。
   生成物は `library/<fw>/src/generated/` に出力し **コミットしない**（`.gitignore`）。
3. 手書きするのは、生成物に乗らない部分だけ。React の `use client` 境界、Vue プラグイン、
   Astro integration、そして各フレームワークの e2e。
4. SSR は **Declarative Shadow DOM + クライアント描画へのフォールバック**。`@lit-labs/ssr` は
   Labs を出るまで採用しない。`:not(:defined)` で定義前のレイアウトを固定して FOUC を抑える。

## 理由

- **一度書けば全部で動く**のは Web Components だけ。ヘッドレス共有案は「薄い UI」が
  フレームワークの数だけ増え、一人で保守できない。
- **CEM を正にすると、ラッパーの手書きミスが構造的に消える。** JSDoc（`@slot` / `@csspart` /
  `@cssprop` / `@event` / `@status`）を書けば、Storybook の docs 表・React 型・MCP の応答が
  同じ出典から出る。
- Lit は標準の上の薄い層で、Lit 自体が消えても Web Components は残る。

## 捨てた選択肢

- **フレームワーク別実装** — 5 倍の保守。見た目の差が必ず出る。
- **Zag / Ark（ステートマシン共有）** — WC を出さない。React 以外は自前で描画層を書く必要。
- **Stencil** — 独自コンパイラに依存。Lit より生成物が重い。
- **`@lit-labs/ssr` を今使う** — Labs のまま。壊れたときに一人で直せない。
- **ラッパー生成物をコミットする** — 生成器を直したときに差分が爆発し、レビュー不能になる。
  代わりに CI で「生成 → typecheck → 公開時に同梱」を行う。

## 影響

- `library/elements/src/<name>/` の配置と `index.ts` / `define.ts` の分離は
  [riml-ds-element](../../.claude/skills/riml-ds-element/SKILL.md) skill が規定する。
- 公開 API は CEM に載るものだけ（ADR-0009）。CEM に載らない public メソッドは
  `@internal` とし、次のメジャーで消せる。
- React 側では `@lit/react` の `createComponent` を CEM から生成する。イベント名は
  `rd-change` → `onRdChange` の機械的変換。
- 依存は `lit` のみ。`@lit-labs/*` を入れるときは ADR を書く。
