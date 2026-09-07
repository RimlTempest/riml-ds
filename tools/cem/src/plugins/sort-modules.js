/**
 * CEM analyzer プラグイン。`custom-elements.json` の modules 配列を決定的な順序に並べ替える。
 *
 * analyzer はファイルシステムの走査順に `modules` を積むため、内容が変わらなくても実行のたびに
 * 順序が変わりうる（コミット済み `custom-elements.json` の diff がノイズになり、
 * 「gen して git diff が空か」の publish gate がランダムに落ちる）。
 *
 * 並び替え自体は純関数 `sortManifest`（隣の `core/sort-manifest.ts`）に委ねる。
 * このプラグインは `packageLinkPhase`（全モジュールの解析が終わった後）で呼び出すだけ。
 */
import { sortManifest } from '../core/sort-manifest.ts'

export const sortModules = () => ({
  name: 'riml-ds/sort-modules',
  packageLinkPhase({ customElementsManifest }) {
    const sorted = sortManifest(customElementsManifest)
    customElementsManifest.modules = sorted.modules
  },
})
