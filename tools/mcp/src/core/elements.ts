/**
 * `library/elements/custom-elements.json`（CEM）を読むだけの純関数。
 * 使用例は ADR-0012 の PE ティアで決まる：ティア A/B はマークアップ契約の `markup(既定 props)`、
 * ティア C は空タグ。フレームワーク別の例は同じ props から機械的に組み立てる。
 */
import type { Result } from './result.js'
import { err, isRecord, ok, stringOr } from './result.js'

export type ElementSummary = {
  readonly tag: string
  readonly name: string
  readonly status: string
  readonly pe: string
  readonly summary: string
}

export type ElementMember = {
  readonly name: string
  readonly description: string
  readonly type: string
  readonly default: string
}

export type ElementFrameworkExamples = {
  readonly html: string
  readonly react: string | undefined
  readonly reactClient: string
  readonly vue: string | undefined
  readonly svelte: string | undefined
  readonly astro: string | undefined
}

export type ElementDoc = ElementSummary & {
  readonly description: string
  readonly attributes: readonly ElementMember[]
  readonly events: readonly ElementMember[]
  readonly slots: readonly ElementMember[]
  readonly cssParts: readonly ElementMember[]
  readonly cssProperties: readonly ElementMember[]
  readonly cssStates: readonly ElementMember[]
  readonly dependsOn: readonly string[]
  readonly examples: ElementFrameworkExamples
}

/** マークアップ契約から先に描いておいた使用例。配線（`src/examples.ts`）が渡す */
export type ElementExample = {
  readonly html: string
  readonly props: Readonly<Record<string, string | boolean>>
}

export type ElementExampleMap = Readonly<Record<string, ElementExample>>

export type ElementError =
  | { readonly kind: 'not-a-manifest'; readonly received: string }
  | { readonly kind: 'unknown-tag'; readonly tag: string }

type Declaration = Readonly<Record<string, unknown>>

const declarationsOf = (manifest: unknown): Result<readonly Declaration[], ElementError> => {
  if (!isRecord(manifest) || !Array.isArray(manifest['modules'])) {
    return err({ kind: 'not-a-manifest', received: typeof manifest })
  }
  const declarations = manifest['modules'].flatMap((module: unknown) => {
    if (!isRecord(module) || !Array.isArray(module['declarations'])) {
      return []
    }
    return module['declarations'].filter(
      (declared: unknown): declared is Declaration =>
        isRecord(declared) && declared['customElement'] === true,
    )
  })
  return ok(declarations)
}

const summaryOf = (declared: Declaration): ElementSummary => ({
  tag: stringOr(declared['tagName'], ''),
  name: stringOr(declared['name'], ''),
  status: stringOr(declared['status'], 'unknown'),
  pe: stringOr(declared['pe'], ''),
  summary: stringOr(declared['summary'], ''),
})

const membersOf = (value: unknown): readonly ElementMember[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isRecord).map((entry) => {
    const type = entry['type']
    return {
      name: stringOr(entry['name'], ''),
      description: stringOr(entry['description'], ''),
      type: isRecord(type) ? stringOr(type['text'], '') : '',
      default: stringOr(entry['default'], ''),
    }
  })
}

const dependsOnOf = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((entry: unknown) => typeof entry === 'string') : []

export const listElements = (
  manifest: unknown,
): Result<readonly ElementSummary[], ElementError> => {
  const declarations = declarationsOf(manifest)
  if (!declarations.ok) {
    return declarations
  }
  return ok(
    declarations.value
      .map(summaryOf)
      .filter((element) => element.tag !== '')
      .toSorted((left, right) => left.tag.localeCompare(right.tag)),
  )
}

/** `rd-button` → `RdButton` */
const componentName = (tag: string): string =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

/** `rd-button` → `button`（Astro のファイル名・registry の name） */
const baseName = (tag: string): string => (tag.startsWith('rd-') ? tag.slice(3) : tag)

/**
 * `@status experimental` の部品は専用サブパスからしか出ない（ADR-0009）。CEM の `status` は
 * 外から来る文字列なので、`'experimental'` に一致しなければ stable 扱いにする。
 * 規則は `tools/cem/src/wrappers/core/common.ts` の `subpathOf` と同じ（依存は作らず写す）。
 */
const isExperimental = (status: string): boolean => status === 'experimental'

/** ラッパーパッケージの入口。stable は root、experimental は `/experimental` */
const wrapperEntry = (framework: string, status: string): string =>
  `@rimltempest/riml-ds-${framework}${isExperimental(status) ? '/experimental' : ''}`

/** React の `'use client'` 版。stable は `/client`、experimental は `/client/experimental` */
const reactClientEntry = (status: string): string =>
  `@rimltempest/riml-ds-react/client${isExperimental(status) ? '/experimental' : ''}`

/** Astro は部品ごとにファイルを配る。`rd-select`（experimental）→ `experimental/select.astro` */
const astroEntry = (tag: string, status: string): string =>
  `@rimltempest/riml-ds-astro/${isExperimental(status) ? 'experimental/' : ''}${baseName(tag)}.astro`

/** `rd-press` → `onRdPress` */
const eventPropName = (eventName: string): string => `on${componentName(eventName)}`

const renderAttrs = (props: Readonly<Record<string, string | boolean>>): string =>
  Object.entries(props)
    .filter(([name]) => name !== 'children')
    .map(([name, value]) => {
      if (value === false) {
        return ''
      }
      return value === true ? ` ${name}` : ` ${name}="${value}"`
    })
    .join('')

const renderTag = (
  component: string,
  props: Readonly<Record<string, string | boolean>>,
  extraAttrs: string,
): string => {
  const children = props['children']
  const attrs = `${renderAttrs(props)}${extraAttrs}`
  return typeof children === 'string'
    ? `<${component}${attrs}>${children}</${component}>`
    : `<${component}${attrs} />`
}

const frameworkExamples = (
  tag: string,
  summary: ElementSummary,
  events: readonly ElementMember[],
  example: ElementExample | undefined,
): ElementFrameworkExamples => {
  const { pe, status } = summary
  const component = componentName(tag)
  const props = example?.props ?? {}
  const element = renderTag(component, props, '')
  const first = events[0]
  const clientElement = renderTag(
    component,
    props,
    first === undefined ? '' : ` ${eventPropName(first.name)}={handle}`,
  )
  const wrapped = pe === 'C' ? undefined : element

  return {
    html: example?.html ?? `<${tag}></${tag}>`,
    react:
      wrapped === undefined
        ? undefined
        : [
            `import { ${component} } from '${wrapperEntry('react', status)}'`,
            '',
            '// サーバーコンポーネント（RSC）からそのまま使える。イベントが要るなら client 版へ',
            `export const Example = () => ${wrapped}`,
          ].join('\n'),
    reactClient: [
      "'use client'",
      `import { ${component} } from '${reactClientEntry(status)}'`,
      '',
      `export const Example = () => ${clientElement}`,
    ].join('\n'),
    vue:
      wrapped === undefined
        ? undefined
        : [
            '<script setup lang="ts">',
            `import { ${component} } from '${wrapperEntry('vue', status)}'`,
            '</script>',
            '',
            '<template>',
            `  ${wrapped}`,
            '</template>',
          ].join('\n'),
    svelte:
      wrapped === undefined
        ? undefined
        : [
            '<script>',
            `  import { ${component} } from '${wrapperEntry('svelte', status)}'`,
            '</script>',
            '',
            wrapped,
          ].join('\n'),
    astro:
      wrapped === undefined
        ? undefined
        : ['---', `import ${component} from '${astroEntry(tag, status)}'`, '---', '', wrapped].join(
            '\n',
          ),
  }
}

export const getElement = (
  manifest: unknown,
  examples: ElementExampleMap,
  tag: string,
): Result<ElementDoc, ElementError> => {
  const declarations = declarationsOf(manifest)
  if (!declarations.ok) {
    return declarations
  }
  const declared = declarations.value.find((entry) => stringOr(entry['tagName'], '') === tag)
  if (declared === undefined) {
    return err({ kind: 'unknown-tag', tag })
  }
  const summary = summaryOf(declared)
  const events = membersOf(declared['events'])
  return ok({
    ...summary,
    description: stringOr(declared['description'], ''),
    attributes: membersOf(declared['attributes']),
    events,
    slots: membersOf(declared['slots']),
    cssParts: membersOf(declared['cssParts']),
    cssProperties: membersOf(declared['cssProperties']),
    cssStates: membersOf(declared['cssStates']),
    dependsOn: dependsOnOf(declared['dependsOn']),
    examples: frameworkExamples(tag, summary, events, examples[tag]),
  })
}
