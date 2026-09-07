/**
 * CEM（`custom-elements.json`）2 版の差分から**破壊的変更**を機械的に判定する純関数。
 * 判定表は ADR-0009「公開 API の定義」をそのまま写したもの:
 *
 * - 属性 / プロパティ・イベント・slot・CSS parts・CSS 変数・カスタム状態・メソッドの
 *   名前変更・削除は major（名前変更は「削除 + 追加」として出る）
 * - 属性の型の狭め・既定値の変更は major。型の広げは minor（addition）
 * - イベント `detail` のフィールド削除・型変更は major。フィールド追加は minor
 * - `@status experimental` の部品は semver の対象外（base 側が experimental なら丸ごと無視）
 * - `stable`/`deprecated` → `experimental` の後退は major。`deprecated` 化そのものは minor
 * - PE ティアの後退（A → B/C、B → C）は JS 無しで壊れるので major。強化は minor
 *
 * CEM は analyzer が出す外部データなので、独自フィールド（`pe` / `status`）を含めすべて
 * `unknown` として読み、形を確かめてから使う。ドメイン層なので throw しない。
 */
import type { Package } from 'custom-elements-manifest/schema'

export type MemberKind =
  | 'attribute'
  | 'event'
  | 'slot'
  | 'cssPart'
  | 'cssProperty'
  | 'cssState'
  | 'method'

export type Breaking =
  | { readonly kind: 'element-removed'; readonly tag: string }
  | {
      readonly kind: 'member-removed'
      readonly tag: string
      readonly member: MemberKind
      readonly name: string
    }
  | {
      readonly kind: 'attribute-type-narrowed'
      readonly tag: string
      readonly name: string
      readonly from: string
      readonly to: string
    }
  | {
      readonly kind: 'attribute-default-changed'
      readonly tag: string
      readonly name: string
      readonly from: string
      readonly to: string
    }
  | {
      readonly kind: 'event-detail-changed'
      readonly tag: string
      readonly name: string
      readonly from: string
      readonly to: string
    }
  | {
      readonly kind: 'status-regressed'
      readonly tag: string
      readonly from: string
      readonly to: string
    }
  | {
      readonly kind: 'pe-tier-changed'
      readonly tag: string
      readonly from: string
      readonly to: string
    }

export type ApiDiff = {
  readonly breaking: readonly Breaking[]
  readonly additions: readonly string[]
}

export type BumpLevel = 'major' | 'minor' | 'patch'
export type Bump = { readonly name: string; readonly level: BumpLevel }

/* ---------------------------------------------------------------- 読み取り */

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

/** `{ text: "..." }`（CEM の Type）の中身 */
const readTypeText = (source: unknown): string => readString(prop(source, 'type'), 'text')

type NamedApi = { readonly name: string; readonly type: string; readonly default: string }

const readNamed = (source: unknown, key: string): readonly NamedApi[] =>
  readList(source, key)
    .map((entry): NamedApi => ({
      name: readString(entry, 'name'),
      type: readTypeText(entry),
      default: readString(entry, 'default'),
    }))
    .filter((entry) => entry.name !== '')

/** slot の既定 slot は `name: ""`。名前が空でも公開 API なので `(default)` として扱う */
const readSlots = (source: unknown): readonly string[] =>
  readList(source, 'slots').map((entry) => {
    const name = readString(entry, 'name')
    return name === '' ? '(default)' : name
  })

const readNames = (source: unknown, key: string): readonly string[] =>
  readNamed(source, key).map((entry) => entry.name)

/** 公開メソッドだけ。`#private` と `privacy: private/protected` は API ではない */
const readMethods = (source: unknown): readonly string[] =>
  readList(source, 'members')
    .filter((member) => prop(member, 'kind') === 'method')
    .map((member) => ({ name: readString(member, 'name'), privacy: readString(member, 'privacy') }))
    .filter(
      (member) =>
        member.name !== ''
        && !member.name.startsWith('#')
        && member.privacy !== 'private'
        && member.privacy !== 'protected',
    )
    .map((member) => member.name)

type Surface = {
  readonly tag: string
  readonly status: string
  readonly pe: string
  readonly attributes: readonly NamedApi[]
  readonly events: readonly NamedApi[]
  readonly slots: readonly string[]
  readonly cssParts: readonly string[]
  readonly cssProperties: readonly string[]
  readonly cssStates: readonly string[]
  readonly methods: readonly string[]
}

const surfaces = (manifest: Package): ReadonlyMap<string, Surface> =>
  new Map(
    manifest.modules.flatMap((module) =>
      (module.declarations ?? []).flatMap((declaration): readonly [string, Surface][] => {
        const tag = readString(declaration, 'tagName')
        if (prop(declaration, 'customElement') !== true || tag === '') {
          return []
        }
        return [
          [
            tag,
            {
              tag,
              status: readString(declaration, 'status'),
              pe: readString(declaration, 'pe'),
              attributes: readNamed(declaration, 'attributes'),
              events: readNamed(declaration, 'events'),
              slots: readSlots(declaration),
              cssParts: readNames(declaration, 'cssParts'),
              cssProperties: readNames(declaration, 'cssProperties'),
              cssStates: readNames(declaration, 'cssStates'),
              methods: readMethods(declaration),
            },
          ],
        ]
      }),
    ),
  )

/* ------------------------------------------------------------------ 型比較 */

/** `'a' | 'b'` → `["'a'", "'b'"]`。union でない型は 1 要素の集合として同じ規則で比べる */
const unionMembers = (text: string): ReadonlySet<string> =>
  new Set(
    text
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part !== ''),
  )

const isSubsetOf = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
  [...a].every((item) => b.has(item))

type TypeChange = 'same' | 'widened' | 'narrowed'

const compareTypes = (from: string, to: string): TypeChange => {
  if (from === to) {
    return 'same'
  }
  const before = unionMembers(from)
  const after = unionMembers(to)
  return isSubsetOf(before, after) ? 'widened' : 'narrowed'
}

/** `CustomEvent<{ x: number; y: string }>` → `{ x: 'number', y: 'string' }`。読めなければ undefined */
const detailFields = (text: string): ReadonlyMap<string, string> | undefined => {
  const inner = /^\s*\w+<\s*\{(.*)\}\s*>\s*$/s.exec(text)
  if (inner === null) {
    return undefined
  }
  const body = inner[1] ?? ''
  const fields = body
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => part.split(':'))
  if (fields.some((parts) => parts.length < 2)) {
    return undefined
  }
  return new Map(
    fields.map((parts): readonly [string, string] => [
      (parts[0] ?? '').trim().replace(/\?$/, ''),
      parts.slice(1).join(':').trim(),
    ]),
  )
}

type DetailChange = 'same' | 'field-added' | 'changed'

const compareDetails = (from: string, to: string): DetailChange => {
  if (from === to) {
    return 'same'
  }
  const before = detailFields(from)
  const after = detailFields(to)
  if (before === undefined || after === undefined) {
    return 'changed'
  }
  const kept = [...before].every(([name, type]) => after.get(name) === type)
  return kept ? 'field-added' : 'changed'
}

/* -------------------------------------------------------------- PE ティア */

const PE_RANK: Readonly<Record<string, number>> = { A: 0, B: 1, C: 2 }

const peRank = (tier: string): number => PE_RANK[tier] ?? -1

/* ---------------------------------------------------------------- 差分本体 */

const MEMBER_LISTS: readonly (readonly [MemberKind, (surface: Surface) => readonly string[]])[] = [
  ['slot', (surface) => surface.slots],
  ['cssPart', (surface) => surface.cssParts],
  ['cssProperty', (surface) => surface.cssProperties],
  ['cssState', (surface) => surface.cssStates],
  ['method', (surface) => surface.methods],
]

const byName = (a: NamedApi, b: NamedApi): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0

const find = (list: readonly NamedApi[], name: string): NamedApi | undefined =>
  list.find((entry) => entry.name === name)

const diffAttributes = (base: Surface, head: Surface): ApiDiff => {
  const breaking: Breaking[] = []
  const additions: string[] = []
  for (const attribute of base.attributes) {
    const next = find(head.attributes, attribute.name)
    if (next === undefined) {
      breaking.push({
        kind: 'member-removed',
        tag: base.tag,
        member: 'attribute',
        name: attribute.name,
      })
      continue
    }
    const typeChange = compareTypes(attribute.type, next.type)
    if (typeChange === 'narrowed') {
      breaking.push({
        kind: 'attribute-type-narrowed',
        tag: base.tag,
        name: attribute.name,
        from: attribute.type,
        to: next.type,
      })
    }
    if (typeChange === 'widened') {
      additions.push(`${base.tag}: attribute "${attribute.name}" の型を ${next.type} に広げた`)
    }
    if (attribute.default !== next.default) {
      breaking.push({
        kind: 'attribute-default-changed',
        tag: base.tag,
        name: attribute.name,
        from: attribute.default,
        to: next.default,
      })
    }
  }
  for (const attribute of head.attributes.toSorted(byName)) {
    if (find(base.attributes, attribute.name) === undefined) {
      additions.push(`${base.tag}: attribute "${attribute.name}" を追加`)
    }
  }
  return { breaking, additions }
}

const diffEvents = (base: Surface, head: Surface): ApiDiff => {
  const breaking: Breaking[] = []
  const additions: string[] = []
  for (const event of base.events) {
    const next = find(head.events, event.name)
    if (next === undefined) {
      breaking.push({ kind: 'member-removed', tag: base.tag, member: 'event', name: event.name })
      continue
    }
    const change = compareDetails(event.type, next.type)
    if (change === 'changed') {
      breaking.push({
        kind: 'event-detail-changed',
        tag: base.tag,
        name: event.name,
        from: event.type,
        to: next.type,
      })
    }
    if (change === 'field-added') {
      additions.push(`${base.tag}: event "${event.name}" の detail にフィールドを追加`)
    }
  }
  for (const event of head.events.toSorted(byName)) {
    if (find(base.events, event.name) === undefined) {
      additions.push(`${base.tag}: event "${event.name}" を追加`)
    }
  }
  return { breaking, additions }
}

const diffMembers = (base: Surface, head: Surface): ApiDiff => {
  const breaking: Breaking[] = []
  const additions: string[] = []
  for (const [member, pick] of MEMBER_LISTS) {
    const before = pick(base)
    const after = new Set(pick(head))
    for (const name of before) {
      if (!after.has(name)) {
        breaking.push({ kind: 'member-removed', tag: base.tag, member, name })
      }
    }
    const beforeSet = new Set(before)
    for (const name of [...after].toSorted()) {
      if (!beforeSet.has(name)) {
        additions.push(`${base.tag}: ${member} "${name}" を追加`)
      }
    }
  }
  return { breaking, additions }
}

const diffLifecycle = (base: Surface, head: Surface): ApiDiff => {
  const breaking: Breaking[] = []
  const additions: string[] = []
  if (head.status === 'experimental' && base.status !== 'experimental') {
    breaking.push({
      kind: 'status-regressed',
      tag: base.tag,
      from: base.status,
      to: head.status,
    })
  }
  if (base.pe !== head.pe) {
    if (peRank(head.pe) > peRank(base.pe)) {
      breaking.push({ kind: 'pe-tier-changed', tag: base.tag, from: base.pe, to: head.pe })
    } else {
      additions.push(`${base.tag}: PE ティアを ${base.pe} から ${head.pe} に強化`)
    }
  }
  return { breaking, additions }
}

const diffElement = (base: Surface, head: Surface): ApiDiff => {
  const parts = [
    diffAttributes(base, head),
    diffEvents(base, head),
    diffMembers(base, head),
    diffLifecycle(base, head),
  ]
  return {
    breaking: parts.flatMap((part) => part.breaking),
    additions: parts.flatMap((part) => part.additions),
  }
}

/** `@status experimental` は semver の対象外（ADR-0009） */
const isExperimental = (surface: Surface): boolean => surface.status === 'experimental'

export const diffManifests = (base: Package, head: Package): ApiDiff => {
  const before = surfaces(base)
  const after = surfaces(head)
  const breaking: Breaking[] = []
  const additions: string[] = []

  for (const tag of [...before.keys()].toSorted()) {
    const baseSurface = before.get(tag)
    if (baseSurface === undefined || isExperimental(baseSurface)) {
      continue
    }
    const headSurface = after.get(tag)
    if (headSurface === undefined) {
      breaking.push({ kind: 'element-removed', tag })
      continue
    }
    const element = diffElement(baseSurface, headSurface)
    breaking.push(...element.breaking)
    additions.push(...element.additions)
  }

  for (const tag of [...after.keys()].toSorted()) {
    const headSurface = after.get(tag)
    if (headSurface !== undefined && !before.has(tag) && !isExperimental(headSurface)) {
      additions.push(`${tag}: 部品を追加`)
    }
  }

  return { breaking, additions }
}

/* ------------------------------------------------------- changeset の判定 */

const LEVEL_RANK: Readonly<Record<BumpLevel, number>> = { patch: 0, minor: 1, major: 2 }

/**
 * `.changeset/*.md` のフロントマターから `"pkg": level` を読む。純粋な文字列処理。
 * 空の changeset（フロントマターが空）は 0 件を返す。
 */
export const parseChangesetBumps = (source: string): readonly Bump[] => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n?---/.exec(source)
  if (frontmatter === null) {
    return []
  }
  return (frontmatter[1] ?? '').split('\n').flatMap((line): readonly Bump[] => {
    const matched = /^\s*(?:"([^"]+)"|'([^']+)'|([^\s:'"]+))\s*:\s*(major|minor|patch)\s*$/.exec(
      line,
    )
    if (matched === null) {
      return []
    }
    const name = matched[1] ?? matched[2] ?? matched[3] ?? ''
    const level = matched[4]
    if (level !== 'major' && level !== 'minor' && level !== 'patch') {
      return []
    }
    return [{ name, level }]
  })
}

/**
 * 破壊的変更があるのに、それを宣言する changeset が無ければ true（= CI を落とす）。
 * 全パッケージ fixed なので、どのパッケージの bump でも版は揃って上がる（ADR-0009）。
 * `0.x` の間は minor が major 扱いなので minor で足りる。
 */
export const missingChangeset = (input: {
  readonly breaking: readonly Breaking[]
  readonly bumps: readonly { readonly level: BumpLevel }[]
  readonly zeroMajor: boolean
}): boolean => {
  if (input.breaking.length === 0) {
    return false
  }
  const required = input.zeroMajor ? LEVEL_RANK.minor : LEVEL_RANK.major
  return !input.bumps.some((bump) => LEVEL_RANK[bump.level] >= required)
}

/** 破壊的変更 1 件を人が読む 1 行に。CLI と GitHub Actions の注釈で使う */
export const describeBreaking = (breaking: Breaking): string => {
  switch (breaking.kind) {
    case 'element-removed':
      return `${breaking.tag}: 部品を削除`
    case 'member-removed':
      return `${breaking.tag}: ${breaking.member} "${breaking.name}" を削除`
    case 'attribute-type-narrowed':
      return `${breaking.tag}: attribute "${breaking.name}" の型を狭めた（${breaking.from} → ${breaking.to}）`
    case 'attribute-default-changed':
      return `${breaking.tag}: attribute "${breaking.name}" の既定値を変えた（${breaking.from} → ${breaking.to}）`
    case 'event-detail-changed':
      return `${breaking.tag}: event "${breaking.name}" の detail を変えた（${breaking.from} → ${breaking.to}）`
    case 'status-regressed':
      return `${breaking.tag}: @status が後退した（${breaking.from} → ${breaking.to}）`
    case 'pe-tier-changed':
      return `${breaking.tag}: PE ティアが後退した（${breaking.from} → ${breaking.to}）`
  }
}
