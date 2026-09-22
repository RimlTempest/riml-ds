# 公開手順

## 初回（ユーザーが手元で行う）

npm の Trusted Publishing はパッケージが存在してからしか設定できない。

```bash
bun run release:check                         # 先にゲートを手元で通す
bun scripts/prepare-publish.ts                # workspace:* を実際の版範囲に書き換える（必須）
npm login                                     # ブラウザで認証
for d in system/tokens system/css library/elements library/react library/vue \
         library/svelte library/astro tools/lint tools/mcp; do
  (cd "$d" && npm publish --access public --provenance=false) || break
done
git checkout -- '*/*/package.json'            # 書き換えはコミットしない
```

**`bun scripts/prepare-publish.ts` を飛ばさない。** `npm publish` は `workspace:*` を書き換えないので、
飛ばすとどのパッケージマネージャからもインストールできない版が出る（0.2.0 / 0.3.0 で起きた。下の
「workspace: の書き換え」）。この手順は**初回と非常時だけ**で、通常の公開は CI（`release.yml`）が行う。

**`--provenance=false` を必ず付ける。** `publishConfig.provenance: true` は CI の OIDC でだけ効き、
手元から publish すると npm が `EUSAGE: Automatic provenance generation not supported for provider: null`
で**止まる**（2026-09-20 に遭遇）。手元からの初回だけは来歴無しになるが、以後は CI が付ける。
`package.json` の `publishConfig` は変えない（CI がそれを使う）。

その後 npmjs.com の各パッケージ → Settings → **Trusted Publisher** → GitHub Actions に
Organization `RimlTempest` / Repository `riml-ds` / Workflow filename `release.yml` /
**Environment `npm`** を登録する（`release.yml` の publish ジョブは `environment: npm` で動く）。
Environment まで登録すると、その environment から出た OIDC トークンでしか publish できなくなる。
GitHub の Settings → Environments → `npm` では、Deployment branches を `main` だけに絞る
（公開 PR 以外のブランチのワークフローが publish できないようにする）。
既に Environment を空欄で登録してあるパッケージも、`npm` を入れて保存し直す。
あわせて GitHub の Settings → Actions → General → Workflow permissions で
「Read and write permissions」と「Allow GitHub Actions to create and approve pull requests」を ON にする
（`changesets/action/version` が Version PR を作るために必要）。Secrets は追加しない。
npm はユーザー名スコープ `@rimltempest`（既存）を使い、パッケージ名は `riml-ds-<name>`。org は作らない（ユーザー決定 2026-09-07）。

## 以後（自動）

1. PR に `.changeset/*.md`（`bun run changeset`）。破壊的変更（`bun run api-diff` が検出）には
   `0.x` の間は `minor`、`1.0` 以降は `major` の changeset が要る。
2. main にマージすると `release.yml`（`.changeset/**` / `**/package.json` / CHANGELOG の変更で発火）が
   `changesets/action/select-mode@v2` で状態を判定し、changeset が残っていれば **Version PR** を作る／更新する
   （`changesets/action/version@v2`）。
3. Version PR をマージすると同じワークフローが `publish` モードになり、`bun run release:check` →
   `bun scripts/prepare-publish.ts`（`workspace:*` の書き換え）→ `bun scripts/check-packed.ts`（tarball の検査）→
   `changesets/action/publish`。`permissions: id-token: write`。npm トークンは無い。provenance は自動。
   この順番は `scripts/publish-order.test.ts` が固定している。
4. GitHub Release・タグ・CHANGELOG は changesets が書く。
5. 手順「初回」が終わるまで publish モードは 404 / 403 で落ちる。これは想定どおり。

## ゲート（`release.yml` の publish 前）

`bun run release:check` が一括で回す:

```
bun run build
bun run gen && bun run design-md   # CEM → ラッパー → registry.json → DESIGN.md。git diff ゼロを検証
bash scripts/release-check.sh      # 公開パッケージ全部に publint --strict と attw --profile esm-only
                                   # （.css / .astro の入口は型を持たないので attw の対象から外す）
bunx size-limit
bunx knip                          # 除外の理由は scripts/release-check.sh 先頭のコメント
bunx sherif
bun scripts/check-packed.ts        # 公開する tarball に workspace: / link: / file: / catalog: が残っていないか
```

CI の `release-check` ジョブはさらに `bun run smoke:install` を回す（下の「公開物の smoke」）。

## workspace: の書き換え

各 `package.json` は、ほかの riml-ds パッケージを `workspace:*` で指す（bun の workspace でだけ通じる）。
公開物には実際の版範囲が要るが、changesets の `publish` は bun を知らず `npm publish` を使い、
`npm publish` は `workspace:` を書き換えない。0.2.0 と 0.3.0 はそのまま公開され、
`@rimltempest/riml-ds-{css,elements,react,vue,svelte,astro,mcp}` はインストールできなかった
（`Workspace dependency "@rimltempest/riml-ds-elements" not found`）。0.3.1 で直した。

`bun scripts/prepare-publish.ts` の規則（`scripts/publish-manifest.ts`）:

| 指定                  | dependencies / optional / dev | peerDependencies |
| --------------------- | ----------------------------- | ---------------- |
| `workspace:*`         | `<版>`（完全一致）            | `^<版>`          |
| `workspace:^` / `~`   | `^<版>` / `~<版>`             | 同左             |
| `workspace:<範囲>`    | `<範囲>`                      | 同左             |

peer だけ `^` にするのは、完全一致の peer だと利用側が patch を 1 つ上げただけで peer 不一致になり、
重複インストールを招くため（全パッケージ fixed バージョンなので、同じ版どうしで揃う）。

## 公開物の smoke

`bun run smoke:install` は、公開する tarball を**リポジトリの外の新しいプロジェクト**に入れて確かめる
（`scripts/install-smoke.ts`）。利用側の代表として rimltools（qrcc / noter）と同じ bun + React 19.3 +
Vite 8.3 を固定する。

1. tarball だけを指定して `bun install` が通る
2. `renderToString` で `<rd-button>` が出る（サーバでの描画）
3. `vite build` が通る（`'use client'` の入口・`define`・CSS を含む）

tarball は registry に無い版（`--version 0.0.0-smoke`）で作る。既存の版と同じ番号だと、bun が peer を
registry の公開物で解決し、手元の tarball ではないものを検査してしまう。`overrides` で riml-ds を
tarball に固定するのも不可（依存指定を上書きするので、`workspace:*` が残っていても通ってしまう）。

## CHANGELOG と公開物のずれ（0.2.0 / 0.3.0）

0.2.0 は手元から手動で公開した（上の「初回」）。そのときの作業ツリーに、あとで 0.3.0 の CHANGELOG に
書かれた変更（`rd-radio-group`、`.rd-window` など）が既に入っていたため、**0.2.0 と 0.3.0 の公開物は
版の注記を除いて同じ中身**になっている。公開済みの CHANGELOG は書き換えない（利用側の差分の根拠を
変えないため）。以後は Version PR のマージからだけ公開するので、このずれは起きない。

`bun run guard` の検査 13 が、公開パッケージの `publishConfig.access: public` /
`publishConfig.provenance: true` と `@rimltempest/riml-ds-` プレフィックスを固定する。

## サイズ予算（`size-limit`）

| パッケージ / 入口                        | 予算（brotli） |
| ---------------------------------------- | -------------- |
| `@rimltempest/riml-ds-tokens/tokens.css`             | 6 KB           |
| `@rimltempest/riml-ds-css`（全部）                   | 8 KB           |
| `@rimltempest/riml-ds-elements/button/define`（lit 込み）| 12 KB      |
| `@rimltempest/riml-ds-elements/dialog/define`        | 14 KB          |
| `@rimltempest/riml-ds-react`（button のみ import）   | 13 KB          |

超えたら CI が落ちる。上げるときは PR で理由を書く。

## パッケージの形

```jsonc
{
  "name": "@rimltempest/riml-ds-elements",
  "type": "module",
  "sideEffects": ["./dist/**/define.js"],
  "customElements": "custom-elements.json",
  "exports": {
    "./button": { "types": "./dist/button/index.d.ts", "default": "./dist/button/index.js" },
    "./button/define": "./dist/button/define.js",
    "./custom-elements.json": "./custom-elements.json"
  },
  "files": ["dist", "custom-elements.json", "README.md"],
  "publishConfig": { "access": "public", "provenance": true }
}
```
