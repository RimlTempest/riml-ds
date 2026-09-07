/**
 * CEM (`custom-elements.json`) の modules 配列は analyzer がファイルシステムを走査した順に並ぶため、
 * 内容が同じでも実行のたびに順序が変わりうる（コミット済みファイルの diff がノイズになる）。
 * ここは純関数: `path` / `declarations[].name` / `exports[].name` で並び替えて決定的にするだけ。
 * 入力は外から来るデータだが、CEM の形は analyzer が保証しているので throw しない
 * （欠けているフィールドは並び替えをスキップするだけ）。
 */
import type { Declaration, Export, Module, Package } from 'custom-elements-manifest/schema'

const byName = <T extends { readonly name: string }>(a: T, b: T): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0

const sortModule = (module: Module): Module => {
  if (module.kind !== 'javascript-module') {
    return module
  }
  const declarations: readonly Declaration[] | undefined = module.declarations
  const exports: readonly Export[] | undefined = module.exports
  return {
    ...module,
    ...(declarations === undefined ? {} : { declarations: declarations.toSorted(byName) }),
    ...(exports === undefined ? {} : { exports: exports.toSorted(byName) }),
  }
}

const byPath = (a: Module, b: Module): number => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)

export const sortManifest = (manifest: Package): Package => ({
  ...manifest,
  modules: manifest.modules.map(sortModule).toSorted(byPath),
})
