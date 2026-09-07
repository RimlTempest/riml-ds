/**
 * CEM analyzer プラグイン。riml-ds が使う JSDoc タグを custom-elements.json に載せる。
 * `@summary` / `@slot` / `@csspart` / `@cssprop` / `@event` は analyzer 標準。ここでは riml-ds 固有分を足す。
 *
 * - `@status stable`        → `status`
 * - `@summary …`           → `summary`（標準と同じ値を明示的に置く）
 * - `@pe A|B|C`            → `pe`（それ以外は console.error して非 0 終了）
 * - `@state name - desc`   → `cssStates: [{ name, description }]`（CEM 拡張）
 * - `@dependency rd-x`     → `dependsOn: ['rd-x']`
 *
 * 型は隣の `jsdoc-tags.d.ts`（analyzer が渡す TS AST のうち読む部分だけ）。
 */

const PE_TIERS = new Set(['A', 'B', 'C'])

/** TS の JSDoc タグ comment は string か NodeArray。文字列だけを見る */
const commentText = (comment) => (typeof comment === 'string' ? comment.trim() : '')

/** `name - description` を分ける。`-` が無ければ全体を name にする */
const splitNamed = (text) => {
  const separator = text.indexOf('-')
  if (separator === -1) {
    return { name: text.trim(), description: '' }
  }
  return {
    name: text.slice(0, separator).trim(),
    description: text.slice(separator + 1).trim(),
  }
}

export const jsdocTags = () => ({
  name: 'riml-ds/jsdoc-tags',
  analyzePhase({ ts, node, moduleDoc }) {
    if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
      return
    }
    const className = node.name?.getText()
    const classDoc = moduleDoc.declarations?.find((declaration) => declaration.name === className)
    if (classDoc === undefined) {
      return
    }

    const cssStates = []
    const dependsOn = []

    for (const jsDoc of node.jsDoc ?? []) {
      for (const tag of jsDoc.tags ?? []) {
        const text = commentText(tag.comment)
        switch (tag.tagName.getText()) {
          case 'status':
            classDoc.status = text
            break
          case 'summary':
            classDoc.summary = text
            break
          case 'pe':
            if (PE_TIERS.has(text)) {
              classDoc.pe = text
            } else {
              console.error(
                `[riml-ds/jsdoc-tags] ${className}: @pe は A|B|C のいずれかが必要（受け取った値: "${text}"）`,
              )
              process.exitCode = 1
            }
            break
          case 'state':
            cssStates.push(splitNamed(text))
            break
          case 'dependency':
            dependsOn.push(text)
            break
          default:
            break
        }
      }
    }

    if (cssStates.length > 0) {
      classDoc.cssStates = cssStates
    }
    if (dependsOn.length > 0) {
      classDoc.dependsOn = dependsOn
    }
  },
})
