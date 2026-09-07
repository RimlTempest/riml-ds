/**
 * `custom-elements.json`（CEM）→ Storybook の `argTypes` の純関数（ADR-0007 決定 2）。
 * story は「部品の表面」を手書きせず、ここが出した表を spread する。
 *
 * CEM は外から来るデータなので `unknown` として読み、型を確かめてから載せる。
 * 失敗しても throw しない（該当項目を飛ばす）。
 */
import type { Package } from 'custom-elements-manifest/schema'

export type ArgTypeControl = 'boolean' | 'text' | 'select' | false

export type ArgTypeTable = {
  readonly category: string
  readonly defaultValue?: { readonly summary: string }
}

export type ArgType = {
  readonly control?: ArgTypeControl
  readonly options?: readonly string[]
  readonly description?: string
  readonly action?: string
  readonly table?: ArgTypeTable
}

export type ArgTypes = Readonly<Record<string, ArgType>>

const prop = (source: unknown, key: string): unknown =>
  typeof source === 'object' && source !== null && key in source
    ? Reflect.get(source, key)
    : undefined

const readString = (source: unknown, key: string): string => {
  const value = prop(source, key)
  return typeof value === 'string' ? value : ''
}

const readList = (source: unknown, key: string): readonly unknown[] => {
  const value = prop(source, key)
  return Array.isArray(value) ? value : []
}

/** `"'a' | 'b'"` → `['a', 'b']`。1 つでもリテラルでなければ union として扱わない */
const parseOptions = (text: string): readonly string[] | undefined => {
  const parts = text.split('|').map((part) => part.trim())
  if (parts.length < 2) {
    return undefined
  }
  const literals = parts.flatMap((part) => {
    const match = /^'(?<value>[^']*)'$|^"(?<value2>[^"]*)"$/u.exec(part)
    const value = match?.groups?.['value'] ?? match?.groups?.['value2']
    return value === undefined ? [] : [value]
  })
  return literals.length === parts.length ? literals : undefined
}

const table = (category: string, defaultValue: string): ArgTypeTable =>
  defaultValue === '' ? { category } : { category, defaultValue: { summary: defaultValue } }

const described = (base: ArgType, description: string): ArgType =>
  description === '' ? base : { ...base, description }

const attributeArgType = (attribute: unknown): ArgType => {
  const typeText = readString(prop(attribute, 'type'), 'text')
  const meta = table('attributes', readString(attribute, 'default'))
  const options = parseOptions(typeText)
  if (typeText === 'boolean') {
    return described({ control: 'boolean', table: meta }, readString(attribute, 'description'))
  }
  if (options !== undefined) {
    return described(
      { control: 'select', options, table: meta },
      readString(attribute, 'description'),
    )
  }
  return described({ control: 'text', table: meta }, readString(attribute, 'description'))
}

/** 読み取り専用の行。args にはならず、docs の表にだけ出る */
const readOnlyArgType = (source: unknown, category: string): ArgType =>
  described({ control: false, table: { category } }, readString(source, 'description'))

const findDeclaration = (manifest: Package, tagName: string): unknown =>
  manifest.modules
    .flatMap((module) => module.declarations ?? [])
    .find(
      (declaration) =>
        prop(declaration, 'customElement') === true
        && readString(declaration, 'tagName') === tagName,
    )

const entriesOf = (
  declaration: unknown,
  key: string,
  category: string,
  keyOf: (name: string) => string,
): readonly (readonly [string, ArgType])[] =>
  readList(declaration, key).flatMap((item) => {
    const name = readString(item, 'name')
    return key === 'slots' || name !== ''
      ? [[keyOf(name), readOnlyArgType(item, category)] as const]
      : []
  })

/**
 * `tagName` の部品 1 つ分の `argTypes`。存在しないタグなら空オブジェクト。
 * キーは衝突しないよう接頭辞を付ける（`slot:` / `part:` / `state:`。CSS 変数は `--` で始まるので素のまま）。
 */
export const argTypesFor = (manifest: Package, tagName: string): ArgTypes => {
  const declaration = findDeclaration(manifest, tagName)
  if (declaration === undefined) {
    return {}
  }
  const attributes = readList(declaration, 'attributes').flatMap((attribute) => {
    const name = readString(attribute, 'name')
    return name === '' ? [] : [[name, attributeArgType(attribute)] as const]
  })
  const events = readList(declaration, 'events').flatMap((event) => {
    const name = readString(event, 'name')
    return name === ''
      ? []
      : [
          [
            name,
            described(
              { action: name, table: { category: 'events' } },
              readString(event, 'description'),
            ),
          ] as const,
        ]
  })
  return Object.fromEntries([
    ...attributes,
    ...events,
    ...entriesOf(declaration, 'slots', 'slots', (name) => `slot:${name === '' ? 'default' : name}`),
    ...entriesOf(declaration, 'cssParts', 'css parts', (name) => `part:${name}`),
    ...entriesOf(declaration, 'cssProperties', 'css properties', (name) => name),
    ...entriesOf(declaration, 'cssStates', 'css states', (name) => `state:${name}`),
  ])
}
