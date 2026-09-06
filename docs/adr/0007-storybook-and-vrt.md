# 0007: Storybook 10 を唯一のショーケースにし、VRT は Playwright で無料に収める

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0008, ADR-0010, ADR-0011, [testing.md](../testing.md)

## 文脈

Storybook 10.6 は ESM 専用で、`@storybook/web-components-vite`、addon-vitest（Playwright
Chromium で story を実描画してテスト）、addon-a11y（axe、`wcag2aaa` タグ指定可、
`a11y.test: 'error'` で失敗にできる）、**addon-mcp**（`/mcp` エンドポイント：story 一覧・docs・
テスト実行）を持つ。

VRT は Chromatic が無料 5000 スナップショット/月（Chrome のみ）、Lost Pixel は 2026-04 に
アーカイブ、Percy / Applitools は有料。Playwright の `toHaveScreenshot` は
`mcr.microsoft.com/playwright:<ver>-noble` の Docker イメージで実行すればフォント・
レンダリング差が消え、ベースラインを Git にコミットできる。

## 決定

1. **Storybook 10（web-components-vite）を唯一のショーケース**にする。React / Vue / Svelte 版の
   Storybook は作らない。各フレームワークの確認は `e2e/<fw>/` の最小アプリと Playwright で行う。
2. story は **CSF3 + autodocs**。args は CEM から生成した `argTypes` を `tools/cem` で供給する。
   1 部品につき最低：`Default`、全 variant、`Disabled`、`Invalid`（該当時）、`RTL`、`Dense`、
   `ForcedColors`、`ReducedMotion` の各 story。
3. **addon-vitest + addon-a11y** を CI で回す。axe のタグは `wcag2a wcag2aa wcag2aaa wcag21a
   wcag21aa wcag22aa best-practice`。`a11y.test: 'error'`。**除外ルールは story ごとに理由を
   `parameters.a11y.config.rules[].reason` に書く**（markuplint の `// eslint-disable` に相当）。
4. **VRT は Playwright `toHaveScreenshot`**。Storybook の静的出力を `http-server` で配信し、
   各 story の `iframe.html?id=...` を撮る。Docker イメージを `e2e/Dockerfile` で
   **バージョン固定**、ベースラインは `e2e/__screenshots__/` にコミット。
   `maxDiffPixelRatio: 0.001`。ライト/ダーク × 幅 360 / 1024 の 4 枚。
5. **addon-mcp** を dev 時に有効化し、`.mcp.json` に `http://localhost:6006/mcp` を登録する。
6. 静的出力は GitHub Pages（ADR-0011）。PR ごとのプレビューは作らない（Pages は 1 環境）。
   代わりに PR の CI で VRT の差分画像を artifact に添付する。

## 理由

- ショーケースが複数あると必ず片方が腐る。WC の Storybook を見れば全フレームワークの
  描画結果が分かる（描画は同じ shadow DOM）。
- Chromatic の 5000/月は「12 部品 × 8 story × 4 条件 × PR 数」で早期に枯れる。
  Playwright + Docker はゼロ円で、ベースラインの差分が PR に出る。
- addon-vitest は「story がテストケース」を実現する。story と test の二重管理が消える。
- addon-mcp で、開発中のエージェントが「いまある story」「その docs」「テスト結果」を
  自分で引ける。

## 捨てた選択肢

- **Chromatic** — 無料枠が小さく Chrome のみ。有料化の経路（ADR-0011）。
- **Histoire / Ladle** — WC 対応が弱い。addon-mcp / addon-a11y 相当がない。
- **フレームワークごとの Storybook** — 保守 4 倍。
- **VRT なし** — トークン変更の視覚回帰は目視で見つからない。
- **ベースラインをコミットしない（毎回 main と比較）** — CI 時間が 2 倍。

## 影響

- `apps/storybook/.storybook/main.ts` / `preview.ts` は `feat/storybook` レーンの所有。
- story の `parameters.a11y` 除外は PR レビューで **理由の妥当性を見る**。除外の合計数は
  `scripts/guard.sh` で上限（部品数 × 1）を設ける。
- スクリーンショットの更新は `bun run vrt:update`（Docker 内）だけで行う。ローカルの macOS
  で撮った画像はコミットしない（CI の guard が OS を判別してエラーにする）。
