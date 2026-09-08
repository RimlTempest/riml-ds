/**
 * Svelte / Astro のように「HTML にほぼそのまま写す」生成器が共有する木の書き出し（純関数）。
 * 差分（式の綴り・children の受け方）は `Dialect` で受ける。
 */
import type { MarkupNode, WrapperSpec } from './common.js'

export type Dialect = {
  /** 属性 1 つ。`name` は HTML の綴り、`expression` は既に言語の式になっている */
  readonly attr: (name: string, expression: string, shorthand: boolean) => string
  /**
   * custom element の属性。**キーがあるだけでプロパティが書かれる**言語（Svelte / Vue / React）は、
   * 未指定なら属性ごと落とさないと要素の既定値を潰す。実装しなければ `attr` と同じ扱い。
   */
  readonly customAttr?: (name: string, prop: string, isBoolean: boolean) => string
  /** `{ prop }`。`children` に置き換わる位置かどうかを受ける */
  readonly text: (prop: string, isChildren: boolean) => string
  /**
   * `{ raw }`。`name` は `$` を落とした名前。`children` は既定 slot、
   * それ以外（`trigger` / `items` / `tabs` / `panels`）は名前つき slot になる
   */
  readonly raw: (name: string) => string
}

const PRINT_WIDTH = 100

const VOID_TAGS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

/** `$prop` を式にする。boolean は未指定なら属性ごと落とす */
export const expressionFor = (spec: WrapperSpec, value: string): string => {
  const name = value.slice(1)
  const reference = name === 'id' && spec.idFallback !== undefined ? 'controlId' : name
  const declared = spec.markupProps.find((item) => item.name === name)
  return declared?.type === 'boolean' ? `${reference} || undefined` : reference
}

const attrSource = (
  spec: WrapperSpec,
  dialect: Dialect,
  tag: string,
  name: string,
  value: string | boolean,
): string => {
  if (typeof value === 'boolean') {
    return value ? name : ''
  }
  if (!value.startsWith('$')) {
    return `${name}="${value}"`
  }
  const prop = value.slice(1)
  const reference = prop === 'id' && spec.idFallback !== undefined ? 'controlId' : prop
  const isBoolean = spec.markupProps.find((item) => item.name === prop)?.type === 'boolean'
  if (tag.includes('-') && dialect.customAttr !== undefined) {
    return dialect.customAttr(name, reference, isBoolean)
  }
  const expression = expressionFor(spec, value)
  return dialect.attr(name, expression, expression === name)
}

const inlineOf = (
  dialect: Dialect,
  node: MarkupNode,
  childrenText: string | undefined,
): string | undefined => {
  if ('text' in node) {
    return node.text
  }
  if ('prop' in node) {
    return dialect.text(node.prop, node.prop === childrenText)
  }
  if ('raw' in node) {
    return dialect.raw(node.raw.startsWith('$') ? node.raw.slice(1) : node.raw)
  }
  return undefined
}

export const renderTree = (
  spec: WrapperSpec,
  dialect: Dialect,
  node: MarkupNode,
  childrenText: string | undefined,
  depth: number,
  root: boolean,
): string => {
  const pad = '  '.repeat(depth)
  const inline = inlineOf(dialect, node, childrenText)
  if (inline !== undefined) {
    return `${pad}${inline}`
  }
  if (!('tag' in node)) {
    return ''
  }
  const slot = node.slot === undefined ? [] : [`slot="${node.slot}"`]
  const own = Object.entries(node.attrs ?? {})
    .map(([name, value]) => attrSource(spec, dialect, node.tag, name, value))
    .filter((pair) => pair !== '')
  const classAttr =
    node.tag.includes('-') && dialect.customAttr !== undefined
      ? dialect.customAttr('class', 'className', false)
      : dialect.attr('class', 'className', false)
  const pairs = [...slot, ...own, ...(root ? [classAttr] : [])]
  const children = node.children ?? []
  const selfClosing = VOID_TAGS.has(node.tag) || children.length === 0
  const open = `<${node.tag}${pairs.map((pair) => ` ${pair}`).join('')}`
  const inlineChildren = children.map((child) => inlineOf(dialect, child, childrenText))
  const allInline = inlineChildren.every((child) => child !== undefined)
  const oneLine = selfClosing
    ? `${pad}${open} />`
    : `${pad}${open}>${inlineChildren.join('')}</${node.tag}>`
  if ((selfClosing || allInline) && oneLine.length <= PRINT_WIDTH) {
    return oneLine
  }
  const openLines =
    `${pad}${open}`.length + (selfClosing ? 3 : 1) <= PRINT_WIDTH
      ? [`${pad}${open}${selfClosing ? ' />' : '>'}`]
      : [
          `${pad}<${node.tag}`,
          ...pairs.map((pair) => `${pad}  ${pair}`),
          `${pad}${selfClosing ? '/>' : '>'}`,
        ]
  if (selfClosing) {
    return openLines.join('\n')
  }
  return [
    ...openLines,
    ...children.map((child) => renderTree(spec, dialect, child, childrenText, depth + 1, false)),
    `${pad}</${node.tag}>`,
  ].join('\n')
}
