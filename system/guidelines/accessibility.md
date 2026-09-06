# アクセシビリティ（AAA）

既定は WCAG 2.2 AAA（ADR-0008）。この文書は判断の正。DESIGN.md はこの要約。

## 数値

| 項目                       | 値                                   | 固定する場所                         |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| テキストのコントラスト     | 7:1 以上（1.4.6）                    | `terrazzo check a11y/min-contrast`   |
| 非テキストのコントラスト   | 3:1 以上（1.4.11）                   | e2e axe（`color-contrast-enhanced`） |
| タッチターゲット           | 44×44 CSS px（2.5.5）                | Vitest browser（`getBoundingClientRect`）|
| フォーカスリング           | 3px + offset 2px、背景に 3:1（2.4.13）| story `Focus` の VRT                |
| 行長                       | 80ch 以下（1.4.8）                   | `measure-max` トークン               |
| 行間                       | 1.5 以上（1.4.8）                    | `type.*.lineHeight`                  |
| 文字の拡大                 | 200% で崩れない（1.4.4）             | e2e（`zoom: 2`）                     |
| リフロー                   | 320px 幅で横スクロール無し（1.4.10） | VRT 幅 360                           |
| モーション                 | 既定で無し（2.3.3）                  | `prefers-reduced-motion: no-preference` 内のみ |
| タイムアウト               | DS の部品は時間制限を持たない        | —                                    |

## 部品の必須事項

1. **名前**：対話部品は必ずアクセシブルネームを持つ。`label` 属性か `labelledBy`（要素参照）。
   どちらも無ければ `console.error` + `:state(unlabeled)`（Storybook の a11y test が落ちる）。
2. **役割**：ネイティブ要素を包む（`<button>`、`<input>`、`<dialog>`）。`role` を後付けして
   `<div>` を部品にしない。
3. **状態**：`aria-expanded` / `aria-pressed` / `aria-invalid` / `aria-busy` はネイティブの状態から
   派生させ、手で同期しない（`*.logic.ts` の純関数で属性の集合を計算し、1 箇所で反映）。
4. **キーボード**：Tab で到達、Enter / Space で操作、Esc で閉じる。矢印キーはリスト系だけ。
   `tabindex` は `0` / `-1` 以外を書かない。roving tabindex を実装しない部品は `toolbar` / `listbox`
   を名乗らない。
5. **フォーカス管理**：ダイアログは開いたら最初の対話要素へ、閉じたら開いた要素へ戻す。
   フォーカスを**消さない**（要素を `disabled` にして飛ばさない。`aria-disabled` を使う）。
6. **フォーム**：`ElementInternals` で form-associated。`required` / `pattern` / `minlength` は
   ネイティブに委ね、`setValidity` で独自検証を足す。エラー文は `aria-describedby` で結び、
   `:user-invalid` 以降にだけ表示する（入力中に怒らない）。
7. **ライブリージョン**：部品は `aria-live` を持たない。`rd-live-region` の `announce()` に渡す。
   `assertive` はエラーだけ。
8. **モーション**：`prefers-reduced-motion: no-preference` の中でだけ `transition` / `animation`
   を書く。無限ループ・自動再生・視差は置かない。
9. **色**：状態は色 + 形（アイコン・下線・太さ）+ 文言。`forced-colors: active` で全部品の
   境界と状態が見えること（story `ForcedColors` で確認）。
10. **文言**：ボタンは動詞。エラーは「何が・どうすれば」。「エラーが発生しました」は禁止。

## 検査の層

| 層                             | 何が分かるか                                   | 何が分からないか                     |
| ------------------------------ | ---------------------------------------------- | ------------------------------------ |
| `terrazzo check`               | 色の対のコントラスト                           | 描画後の重なり                       |
| Storybook addon-a11y（axe AAA）| 属性・名前・コントラスト（描画後）             | 操作の意味、読み上げ順               |
| Vitest browser + virtual screen reader | 読み上げ順・名前・状態の遷移            | 実際の SR のクセ                     |
| Playwright e2e                 | キーボード導線・フォーカス順・ズーム・幅 320   | —                                    |
| **手動（VoiceOver / NVDA）**   | 実機のクセ                                     | 自動化不可。リリース前に一巡する     |

手動確認のチェックリスト：

- [ ] VoiceOver（Safari）でフォームを埋めて送信できる
- [ ] NVDA（Firefox）でダイアログを開閉し、フォーカスが戻る
- [ ] 200% ズームで横スクロールが出ない
- [ ] Windows ハイコントラスト（強制配色）で全部品の境界が見える
- [ ] キーボードだけで全 story を操作できる

## 例外の記録

満たせない項目があるときは、部品の `*.stories.ts` の `parameters.a11y.config.rules` に
`{ id, enabled: false, reason }` を書き、`docs/accessibility-exceptions.md` に**部品名・項目・理由・
期限**を追記する。理由が「デザイン上の都合」なら例外にせずデザインを変える。
