/**
 * HTML を属性順に依らない形に正規化する。`renderToString` と `markup()` は同じ木を出すが、
 * 属性の並びと boolean 属性の綴り（`required` / `required=""`）だけが違うため。
 */
const canonical = (node: Node): string => {
  if (node.nodeType === node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (!(node instanceof Element)) {
    return ''
  }
  const tag = node.tagName.toLowerCase()
  const attrs = [...node.attributes]
    .map((attr) => `${attr.name}="${attr.value}"`)
    .toSorted()
    .join(' ')
  const children = [...node.childNodes].map((child) => canonical(child)).join('')
  return `<${tag}${attrs === '' ? '' : ` ${attrs}`}>${children}</${tag}>`
}

export const normalize = (html: string): string => {
  const template = document.createElement('template')
  template.innerHTML = html
  return [...template.content.childNodes].map((child) => canonical(child)).join('')
}
