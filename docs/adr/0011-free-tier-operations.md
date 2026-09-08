# 0011: 無料枠で運用する（GitHub Pages、有料 SaaS なし）

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0007, ADR-0009

## 文脈

qrcc / noter と同じく **費用ゼロ**が絶対条件。デザインシステムに一般的な有料 SaaS：
Chromatic（VRT / Storybook ホスティング）、Percy、Figma、Zeroheight、Supernova、npm Pro
（private packages）。

GitHub の public リポジトリは Actions の実行時間が無制限、Pages が無料、Dependabot / CodeQL が
無料。private だと Actions 2000 分/月。

## 決定

1. **GitHub リポジトリは public。** Actions 無制限・Pages・CodeQL を使う。
   > **注記（2026-09-07、ユーザー決定）**: 最初の実装期間中は **private** で進め、plan 010（CI / Pages）の
   > Pages 配線の直前に public へ切り替える。private の間は Actions 2,000 分/月に収める（`release.yml` の
   > `paths` フィルタ、`affected.sh`、Docker ジョブの `timeout-minutes`）。切替はユーザーが
   > `gh repo edit --visibility public` で行う（plan 010 Step 5）。
2. **Storybook / registry.json / DESIGN.md の配布は GitHub Pages**（`https://www.riml.work/riml-ds/`。ユーザーサイトの CNAME 配下）。
   カスタムドメインは任意（後で `ds.riml4i.com` を CNAME しても費用ゼロ）。
3. **VRT は Playwright + Docker、ベースラインをコミット**（ADR-0007）。Chromatic は使わない。
4. **npm は public scope、Trusted Publishing**（ADR-0009）。private packages は持たない。
5. **有料 SaaS を導入する場合は ADR を書き、無料枠の上限と超過時の挙動を明記する。**
   従量課金が止められないサービス（上限設定不可）は入れない。
6. CI の実行時間を守る：`bun install` キャッシュ、Playwright ブラウザは Docker イメージから
   （ダウンロードしない）、VRT と a11y は変更のあったパッケージだけ（Turborepo は使わず
   `git diff --name-only` で判定する `scripts/affected.sh`）。
7. Pages のデプロイは main へのマージ時のみ。PR プレビューは artifact（VRT 差分画像・
   Storybook の zip）で代替。

## 理由

- public にすることで唯一の実費（Actions 分）が消える。デザインシステムは公開して困る情報を
  持たない（トークン・部品・ガイドライン）。
- Pages は静的配信だけで十分。Storybook の静的出力は数十 MB に収まる。
- VRT のベースラインをコミットするのは「外部ストレージを持たない」ため。

## 捨てた選択肢

- **private リポジトリ** — Actions 2000 分/月は VRT を含めると 1 か月で枯れる。
- **Chromatic 無料枠** — 5000/月は超える（ADR-0007）。超えると止まるが、止まる前に依存が生まれる。
- **Cloudflare Pages / Workers で配信** — 無料だが、DS は Cloudflare に寄せる理由がない。
  利用側（qrcc / noter）が Cloudflare なのは別の話。GitHub Pages のほうが CI と近い。
- **Vercel** — 無料枠はあるが商用制限あり。GitHub に閉じるほうが依存が少ない。

## 影響

- `.github/workflows/`：`ci.yml`（check / test / a11y / vrt / guard）、`pages.yml`（main →
  Storybook + registry + DESIGN.md）、`release.yml`（changesets → npm）。
- リポジトリ設定（ユーザーが行う）：Pages のソースを Actions に、`main` の branch protection
  （CI 必須）、Dependabot 有効。
- 秘密情報は一切持たない。`.env` は存在しない前提で lefthook の secrets grep を残す。
