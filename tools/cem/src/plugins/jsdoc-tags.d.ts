/**
 * `jsdoc-tags.js` の型。analyzer が渡してくる TS AST のうち、このプラグインが読む部分だけを
 * ダックタイプで宣言する（`typescript` の型は 7.0 の JS API が無いため参照しない）。
 */

export type PeTier = 'A' | 'B' | 'C'

export type CssState = { readonly name: string; readonly description: string }

export type JsdocTag = {
  readonly tagName: { readonly getText: () => string }
  readonly comment?: unknown
}

export type JsdocComment = { readonly tags?: readonly JsdocTag[] | undefined }

export type ClassNode = {
  readonly kind: number
  readonly name?: { readonly getText: () => string } | undefined
  readonly jsDoc?: readonly JsdocComment[] | undefined
}

/** analyzer が作った class の宣言。プラグインはここに riml-ds 独自のフィールドを足す */
export type ClassDoc = {
  readonly name: string
  status?: string
  summary?: string
  pe?: PeTier
  /** CEM 拡張。ラッパー生成器は無視してよい */
  cssStates?: readonly CssState[]
  dependsOn?: readonly string[]
}

export type ModuleDoc = { readonly declarations?: readonly ClassDoc[] | undefined }

export type TsLike = { readonly SyntaxKind: { readonly ClassDeclaration: number } }

export type AnalyzePhaseParams = {
  readonly ts: TsLike
  readonly node: ClassNode
  readonly moduleDoc: ModuleDoc
}

export type JsdocTagsPlugin = {
  readonly name: string
  readonly analyzePhase: (params: AnalyzePhaseParams) => void
}

export declare const jsdocTags: () => JsdocTagsPlugin
