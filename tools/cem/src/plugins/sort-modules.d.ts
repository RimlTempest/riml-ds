/**
 * `sort-modules.js` の型。analyzer が渡してくる `packageLinkPhase` の引数のうち、
 * このプラグインが読む部分だけをダックタイプで宣言する（`jsdoc-tags.d.ts` と同じ方針）。
 */
import type { Package } from 'custom-elements-manifest/schema'

export type PackageLinkPhaseParams = {
  readonly customElementsManifest: Package
}

export type SortModulesPlugin = {
  readonly name: string
  readonly packageLinkPhase: (params: PackageLinkPhaseParams) => void
}

export declare const sortModules: () => SortModulesPlugin
