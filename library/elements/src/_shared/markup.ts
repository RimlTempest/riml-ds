/**
 * マークアップ契約の木（純データ）と、それを HTML 文字列にする純関数（ADR-0012）。
 * Storybook・e2e・各フレームワークのラッパー生成器が**同じ木**から出力する唯一の入力。
 */

export type MarkupNode =
  | {
      readonly tag: string
      readonly attrs?: Readonly<Record<string, string | boolean>>
      readonly children?: readonly MarkupNode[]
      readonly slot?: string
    }
  | { readonly text: string }
  /** props[prop] をテキストとして差し込む */
  | { readonly prop: string }
  /**
   * **エスケープせずに**差し込む生 HTML。`'$name'` なら props[name] を生のまま入れる。
   * ティア B の `children`（利用側が組み立てた信頼済みの HTML 断片）専用。
   * 利用者入力をここに通さないこと（XSS になる）。テキストは `{ text }` / `{ prop }` を使う。
   */
  | { readonly raw: string }

export type MarkupTree = MarkupNode

export type MarkupProps = Readonly<Record<string, string | boolean | undefined>>

/** 内容を持たない要素。閉じタグを書かない */
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

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/** `'$name'` は props[name] を指す。それ以外はそのままの値 */
const resolve = (value: string | boolean, props: MarkupProps): string | boolean | undefined =>
  typeof value === 'string' && value.startsWith('$') ? props[value.slice(1)] : value

const renderAttrs = (
  attrs: Readonly<Record<string, string | boolean>> | undefined,
  slot: string | undefined,
  props: MarkupProps,
): string => {
  const pairs = Object.entries(attrs ?? {}).map(([name, raw]) => ({
    name,
    value: resolve(raw, props),
  }))
  const all = slot === undefined ? pairs : [{ name: 'slot', value: slot }, ...pairs]
  return all
    .map(({ name, value }) => {
      if (value === undefined || value === false) {
        return ''
      }
      // boolean 属性は存在で true（`required` / `disabled`）
      return value === true ? ` ${name}` : ` ${name}="${escapeHtml(value)}"`
    })
    .join('')
}

const renderText = (value: string | boolean | undefined): string =>
  value === undefined ? '' : escapeHtml(typeof value === 'boolean' ? String(value) : value)

/** 属性値もテキストも必ずエスケープする。未指定の `$prop` は属性ごと省く */
export const renderMarkup = (tree: MarkupTree, props: MarkupProps): string => {
  if ('text' in tree) {
    return escapeHtml(tree.text)
  }
  if ('prop' in tree) {
    return renderText(props[tree.prop])
  }
  if ('raw' in tree) {
    const value = resolve(tree.raw, props)
    // エスケープしない。信頼済みの HTML 断片だけを渡す契約（型の JSDoc を参照）
    return typeof value === 'string' ? value : ''
  }
  const open = `<${tree.tag}${renderAttrs(tree.attrs, tree.slot, props)}>`
  if (VOID_TAGS.has(tree.tag)) {
    return open
  }
  const inner = (tree.children ?? []).map((child) => renderMarkup(child, props)).join('')
  return `${open}${inner}</${tree.tag}>`
}
