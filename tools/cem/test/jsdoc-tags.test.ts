import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClassDoc, JsdocComment } from '../src/plugins/jsdoc-tags.js'
import { jsdocTags } from '../src/plugins/jsdoc-tags.js'

const CLASS_DECLARATION = 264
const ts = { SyntaxKind: { ClassDeclaration: CLASS_DECLARATION } }

const tag = (
  name: string,
  comment: string,
): { tagName: { getText: () => string }; comment: string } => ({
  tagName: { getText: () => name },
  comment,
})

/** class 宣言 1 つぶんの analyzePhase を回し、書き換えられた classDoc を返す */
const analyze = (tags: readonly ReturnType<typeof tag>[]): ClassDoc => {
  const classDoc: ClassDoc = { name: 'RdButton' }
  const jsDoc: readonly JsdocComment[] = [{ tags }]
  jsdocTags().analyzePhase({
    ts,
    node: { kind: CLASS_DECLARATION, name: { getText: () => 'RdButton' }, jsDoc },
    moduleDoc: { declarations: [classDoc] },
  })
  return classDoc
}

afterEach(() => {
  process.exitCode = undefined
  vi.restoreAllMocks()
})

describe('jsdocTags', () => {
  it('@status と @summary を宣言に載せる', () => {
    const doc = analyze([
      tag('status', 'stable'),
      tag('summary', '操作の起点。primary は画面に 1 つ'),
    ])
    expect(doc.status).toBe('stable')
    expect(doc.summary).toBe('操作の起点。primary は画面に 1 つ')
  })

  it('@pe A|B|C を pe に載せる', () => {
    expect(analyze([tag('pe', 'A')]).pe).toBe('A')
    expect(analyze([tag('pe', 'C')]).pe).toBe('C')
  })

  it('@state と @dependency を cssStates / dependsOn にする', () => {
    const doc = analyze([
      tag('state', 'loading - 読み込み中'),
      tag('state', 'malformed - 契約に合わない子'),
      tag('dependency', 'rd-live-region'),
    ])
    expect(doc.cssStates).toEqual([
      { name: 'loading', description: '読み込み中' },
      { name: 'malformed', description: '契約に合わない子' },
    ])
    expect(doc.dependsOn).toEqual(['rd-live-region'])
  })

  it('@pe が A|B|C 以外なら console.error して非 0 終了にする', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const doc = analyze([tag('pe', 'X')])
    expect(doc.pe).toBeUndefined()
    expect(spy).toHaveBeenCalledOnce()
    expect(process.exitCode).toBe(1)
  })
})
