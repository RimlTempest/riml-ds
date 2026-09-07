/**
 * CEM（`custom-elements.json`）とマークアップ契約（ADR-0012）を、フレームワーク非依存の
 * 中間表現 `WrapperSpec` にする純関数。React / Vue / Svelte / Astro の生成器はこれだけを読む。
 *
 * CEM は外から来るデータなので `unknown` として読み、型を確かめてから載せる（`core/registry.ts` と同じ流儀）。
 * 契約は `library/elements/dist/<name>/index.js` から CLI が読んで渡す（`src/` は読まない。ADR-0002）。
 * 失敗しても throw しない（該当部品を飛ばす）。
 */
import type { Package } from 'custom-elements-manifest/schema'

export type PeTier = 'A' | 'B' | 'C'

/** CEM の独自フィールド `status`（ADR-0009 のライフサイクル）。知らない値は `'stable'` に倒す */
export type WrapperStatus = 'stable' | 'experimental' | 'deprecated'

/** `library/elements/src/_shared/markup.ts` の `MarkupNode` を構造的に写したもの */
export type MarkupNode =
  | {
      readonly tag: string
      readonly attrs?: Readonly<Record<string, string | boolean>>
      readonly children?: readonly MarkupNode[]
      readonly slot?: string
    }
  | { readonly text: string }
  | { readonly prop: string }
  | { readonly raw: string }

/** `library/elements/src/_shared/contract.ts` の `Contract` を構造的に写したもの */
export type Contract = {
  readonly pe: PeTier
  readonly roles: Readonly<Record<string, string>>
  readonly required: readonly string[]
  readonly tree: MarkupNode
}

/**
 * prop の型。`named` は `@rimltempest/riml-ds-elements/<subpath>` から `import type` する名前
 * （`ButtonVariant` など。CEM は union の中身を持たないので名前で参照する）。
 */
export type AttrType =
  | 'string'
  | 'boolean'
  | 'number'
  | { readonly union: readonly string[] }
  | { readonly named: string }

export type WrapperAttr = {
  readonly name: string
  readonly type: AttrType
  readonly optional: boolean
  readonly description: string
}

export type WrapperEvent = {
  readonly name: string
  /** `rd-press` → `onRdPress` */
  readonly prop: string
  /** CEM の型テキスト（`CustomEvent<...>`）をそのまま使う */
  readonly detail: string
  readonly description: string
}

export type WrapperSlot = { readonly name: string }

/**
 * `attr`: 契約の木の属性（`$prop`）。`text`: `{ prop }`。`raw`: `{ raw }`（React の children）。
 */
export type MarkupPropKind = 'attr' | 'text' | 'raw'

export type MarkupProp = {
  readonly name: string
  readonly type: AttrType
  readonly optional: boolean
  readonly kind: MarkupPropKind
}

export type WrapperSpec = {
  readonly tag: string
  readonly name: string
  readonly pascal: string
  readonly pe: PeTier
  /** ADR-0009 のライフサイクル。`experimental` は別サブパスから出す */
  readonly status: WrapperStatus
  /**
   * `@rimltempest/riml-ds-elements` の公開サブパス（`button` / `experimental/select`）。
   * import 先を組み立てるときは `name` ではなく必ずこちらを使う
   */
  readonly subpath: string
  readonly attrs: readonly WrapperAttr[]
  readonly events: readonly WrapperEvent[]
  readonly slots: readonly WrapperSlot[]
  /** ティア A/B のみ。ティア C は契約を持たない */
  readonly contract: Contract | undefined
  readonly markupProps: readonly MarkupProp[]
  /** 契約の木にあるネイティブの操作要素（`input` / `button` …）。client ラッパーがここに listener を配る */
  readonly controlTag: string | undefined
  /** `$id` が未指定のときに代わりに使う prop（`$name` があれば `'name'`） */
  readonly idFallback: string | undefined
  /** `@rimltempest/riml-ds-elements/<subpath>` から import type する名前 */
  readonly namedTypes: readonly string[]
}

const TAG_PREFIX = 'rd-'

/** HTML の boolean 属性（存在で true）。CEM に無い属性の型を決めるときに引く */
const HTML_BOOLEAN_ATTRS: ReadonlySet<string> = new Set([
  'autofocus',
  'checked',
  'disabled',
  'hidden',
  'multiple',
  'novalidate',
  'open',
  'readonly',
  'required',
  'selected',
])

/** HTML 仕様で値が決まっている属性。`<tag>.<attr>` で引く */
const HTML_ENUM_ATTRS: Readonly<Record<string, readonly string[]>> = {
  'button.type': ['button', 'submit', 'reset'],
}

/** ネイティブの操作要素。契約の木で最初に見つかったものが `controlTag` */
const CONTROL_TAGS: ReadonlySet<string> = new Set(['input', 'textarea', 'select', 'button', 'a'])

const prop = (source: unknown, key: string): unknown =>
  typeof source === 'object' && source !== null && key in source
    ? Reflect.get(source, key)
    : undefined

const readString = (source: unknown, key: string): string => {
  const value = prop(source, key)
  return typeof value === 'string' ? value : ''
}

const readArray = (source: unknown, key: string): readonly unknown[] => {
  const value = prop(source, key)
  return Array.isArray(value) ? value : []
}

const isPeTier = (value: unknown): value is PeTier =>
  value === 'A' || value === 'B' || value === 'C'

const isStatus = (value: unknown): value is WrapperStatus =>
  value === 'stable' || value === 'experimental' || value === 'deprecated'

/** CEM は外から来るデータ。`status` が無い・知らない文字列なら `'stable'` 扱い（registry.ts と同じ寛容さ） */
const readStatus = (declaration: unknown): WrapperStatus => {
  const value = prop(declaration, 'status')
  return isStatus(value) ? value : 'stable'
}

/** `experimental` は `@rimltempest/riml-ds-elements/experimental/<name>` からしか出ない（ADR-0009） */
const subpathOf = (name: string, status: WrapperStatus): string =>
  status === 'experimental' ? `experimental/${name}` : name

/** `rd-text-field` → `RdTextField` */
export const toPascal = (tag: string): string =>
  tag
    .split('-')
    .filter((part) => part !== '')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

/** `rd-press` → `onRdPress` */
export const eventProp = (name: string): string => `on${toPascal(name)}`

/** `rd-text-field` → `text-field` */
const componentName = (tag: string): string =>
  tag.startsWith(TAG_PREFIX) ? tag.slice(TAG_PREFIX.length) : tag

/** `'a' | 'b'` のような引用符つき union を取り出す。取れなければ undefined */
const parseUnion = (text: string): readonly string[] | undefined => {
  const parts = text.split('|').map((part) => part.trim())
  if (parts.length < 2) {
    return undefined
  }
  const values = parts.flatMap((part) =>
    part.length >= 2 && part.startsWith("'") && part.endsWith("'") ? [part.slice(1, -1)] : [],
  )
  return values.length === parts.length ? values : undefined
}

const parseType = (text: string): AttrType => {
  if (text === 'string' || text === 'boolean' || text === 'number') {
    return text
  }
  const union = parseUnion(text)
  if (union !== undefined) {
    return { union }
  }
  return text === '' ? 'string' : { named: text }
}

const readAttrs = (declaration: unknown): readonly WrapperAttr[] =>
  readArray(declaration, 'attributes').flatMap((attr): readonly WrapperAttr[] => {
    const name = readString(attr, 'name')
    return name === ''
      ? []
      : [
          {
            name,
            type: parseType(readString(prop(attr, 'type'), 'text')),
            optional: true,
            description: readString(attr, 'description'),
          },
        ]
  })

const readEvents = (declaration: unknown): readonly WrapperEvent[] =>
  readArray(declaration, 'events').flatMap((event): readonly WrapperEvent[] => {
    const name = readString(event, 'name')
    return name === ''
      ? []
      : [
          {
            name,
            prop: eventProp(name),
            detail: readString(prop(event, 'type'), 'text'),
            description: readString(event, 'description'),
          },
        ]
  })

const readSlots = (declaration: unknown): readonly WrapperSlot[] =>
  readArray(declaration, 'slots').map((slot) => ({ name: readString(slot, 'name') }))

/** 属性値 `'$name'` から prop 名を取り出す */
const placeholder = (value: string | boolean): string | undefined =>
  typeof value === 'string' && value.startsWith('$') ? value.slice(1) : undefined

const attrTypeFor = (
  tag: string,
  attrName: string,
  hostAttrs: readonly WrapperAttr[],
): AttrType => {
  const fromCem = hostAttrs.find((attr) => attr.name === attrName)
  if (fromCem !== undefined) {
    return fromCem.type
  }
  const enumValues = HTML_ENUM_ATTRS[`${tag}.${attrName}`]
  if (enumValues !== undefined) {
    return { union: enumValues }
  }
  return HTML_BOOLEAN_ATTRS.has(attrName) ? 'boolean' : 'string'
}

/** 要素の属性に現れる `$prop` を並び順に集める */
const attrProps = (
  node: Extract<MarkupNode, { tag: string }>,
  hostAttrs: readonly WrapperAttr[],
): readonly MarkupProp[] =>
  Object.entries(node.attrs ?? {}).flatMap(([attrName, value]): readonly MarkupProp[] => {
    const name = placeholder(value)
    return name === undefined
      ? []
      : [{ name, type: attrTypeFor(node.tag, attrName, hostAttrs), optional: true, kind: 'attr' }]
  })

/** 木を前順に歩いて `$prop` / `{prop}` / `{raw}` を集める（重複はあとで落とす） */
const collectProps = (
  node: MarkupNode,
  hostAttrs: readonly WrapperAttr[],
): readonly MarkupProp[] => {
  if ('text' in node) {
    return []
  }
  if ('prop' in node) {
    return [{ name: node.prop, type: 'string', optional: true, kind: 'text' }]
  }
  if ('raw' in node) {
    const name = placeholder(node.raw)
    return name === undefined ? [] : [{ name, type: 'string', optional: false, kind: 'raw' }]
  }
  return [
    ...attrProps(node, hostAttrs),
    ...(node.children ?? []).flatMap((child) => collectProps(child, hostAttrs)),
  ]
}

const dedupe = (props: readonly MarkupProp[]): readonly MarkupProp[] =>
  props.filter((item, index) => props.findIndex((other) => other.name === item.name) === index)

/** 契約の木で最初に見つかるネイティブの操作要素 */
const findControlTag = (node: MarkupNode): string | undefined => {
  if (!('tag' in node)) {
    return undefined
  }
  if (CONTROL_TAGS.has(node.tag)) {
    return node.tag
  }
  for (const child of node.children ?? []) {
    const found = findControlTag(child)
    if (found !== undefined) {
      return found
    }
  }
  return undefined
}

const namedTypesOf = (
  attrs: readonly WrapperAttr[],
  markupProps: readonly MarkupProp[],
): readonly string[] => {
  const names = [...attrs, ...markupProps].flatMap((item) =>
    typeof item.type === 'object' && 'named' in item.type ? [item.type.named] : [],
  )
  return [...new Set(names)].toSorted()
}

export const toWrapperSpecs = (
  manifest: Package,
  contracts: Readonly<Record<string, Contract>>,
): readonly WrapperSpec[] =>
  manifest.modules
    .flatMap((module) =>
      (module.declarations ?? []).flatMap((declaration): readonly WrapperSpec[] => {
        const tag = readString(declaration, 'tagName')
        const pe = prop(declaration, 'pe')
        if (prop(declaration, 'customElement') !== true || tag === '' || !isPeTier(pe)) {
          return []
        }
        const name = componentName(tag)
        const status = readStatus(declaration)
        const attrs = readAttrs(declaration)
        const contract = contracts[name]
        const markupProps = contract === undefined ? [] : dedupe(collectProps(contract.tree, attrs))
        const hasId = markupProps.some((item) => item.name === 'id')
        const hasName = markupProps.some((item) => item.name === 'name')
        return [
          {
            tag,
            name,
            pascal: toPascal(tag),
            pe,
            status,
            subpath: subpathOf(name, status),
            attrs,
            events: readEvents(declaration),
            slots: readSlots(declaration),
            contract,
            markupProps,
            controlTag: contract === undefined ? undefined : findControlTag(contract.tree),
            idFallback: hasId && hasName ? 'name' : undefined,
            namedTypes: namedTypesOf(attrs, markupProps),
          },
        ]
      }),
    )
    .toSorted((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))

/** 型を TypeScript のソースにする */
export const typeText = (type: AttrType): string => {
  if (typeof type === 'string') {
    return type
  }
  return 'union' in type ? type.union.map((value) => `'${value}'`).join(' | ') : type.named
}

/**
 * 契約の木で `controlTag` の直下にある `{ prop }` の名前。
 * 各フレームワークではそこが children / slot になる（`<RdButton>保存</RdButton>`）。
 */
export const childrenTextOf = (spec: WrapperSpec): string | undefined => {
  const visit = (node: MarkupNode): string | undefined => {
    if (!('tag' in node)) {
      return undefined
    }
    if (node.tag === spec.controlTag) {
      const text = (node.children ?? []).find((child) => 'prop' in child)
      return text !== undefined && 'prop' in text ? text.prop : undefined
    }
    for (const child of node.children ?? []) {
      const found = visit(child)
      if (found !== undefined) {
        return found
      }
    }
    return undefined
  }
  return spec.contract === undefined ? undefined : visit(spec.contract.tree)
}
