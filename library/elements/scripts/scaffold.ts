/**
 * 部品の雛形を作る（`bun run scaffold:element <name> --pe A|B|C`）。
 *
 * 出すファイルは `.claude/skills/riml-ds-element/SKILL.md` §1.1 のファイル構成そのまま
 * （ティア A は 11 / B は 12 / C は 9）。中身は TDD の出発点：`it.todo` 入りのテスト、
 * `@pe` / `@status experimental` / `@summary TODO` 入りの element、契約の骨。
 * 生成直後に `bun run check` が通る（`it.todo` は許容）。
 *
 * 既にディレクトリがあれば何も書かずに終わる（上書きしない）。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type Tier = 'A' | 'B' | 'C'

type Names = {
  /** `text-field` */
  readonly name: string
  /** `rd-text-field` */
  readonly tag: string
  /** `TextField` */
  readonly pascal: string
  /** `textField` */
  readonly camel: string
}

type GeneratedFile = { readonly path: string; readonly content: string }

type Parsed =
  | { readonly kind: 'ok'; readonly name: string; readonly tier: Tier }
  | { readonly kind: 'error'; readonly message: string }

const USAGE = 'usage: bun run scaffold:element <name> --pe A|B|C   (name は kebab-case)'

const NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u

const isTier = (value: string): value is Tier => value === 'A' || value === 'B' || value === 'C'

export const parseArgs = (argv: readonly string[]): Parsed => {
  const flag = argv.indexOf('--pe')
  const tier = flag === -1 ? '' : (argv[flag + 1] ?? '')
  const name = argv.find((arg, index) => !arg.startsWith('-') && index !== flag + 1) ?? ''
  if (name === '' || !NAME_PATTERN.test(name)) {
    return { kind: 'error', message: `部品名が kebab-case ではない: "${name}"\n${USAGE}` }
  }
  if (!isTier(tier)) {
    return {
      kind: 'error',
      message: `--pe は A|B|C のいずれか（受け取った値: "${tier}"）\n${USAGE}`,
    }
  }
  return { kind: 'ok', name, tier }
}

export const namesOf = (name: string): Names => {
  const parts = name.split('-')
  const pascal = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  const [head = '', ...rest] = parts
  return {
    name,
    tag: `rd-${name}`,
    pascal,
    camel: `${head}${rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`,
  }
}

/* -------------------------------------------------------------------------- */
/* テンプレート                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `scripts/guard.sh` は `*.element.ts` 以外の全 .ts で `class` の宣言行を落とす（ADR-0005）。
 * 雛形の中の宣言は式に逃がして書き、この生成器自身が引っかからないようにする。
 */
const CLASS = 'class'

const contractFile = ({ tag, pascal }: Names, tier: Tier): string =>
  tier === 'A'
    ? `/**
 * \`${tag}\` のマークアップ契約（ティア A、ADR-0012）。
 * ネイティブ要素は**利用側が light DOM に書く**。部品は生成しない。
 * TODO: roles と tree をこの部品の形に書き換える。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input',
  },
  required: ['label', 'control'],
  tree: {
    tag: '${tag}',
    attrs: { hint: '$hint' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      { tag: 'input', attrs: { id: '$id', name: '$name', required: '$required' } },
    ],
  },
} as const satisfies Contract

export type ${pascal}MarkupProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  readonly required?: boolean
  readonly hint?: string
}

export const markup = (props: ${pascal}MarkupProps): string => renderMarkup(contract.tree, props)
`
    : `/**
 * \`${tag}\` のマークアップ契約（ティア B、ADR-0012）。
 * 枠だけが shadow にあり、見出しと本文はすべて slot（light DOM）。
 * TODO: roles と tree をこの部品の形に書き換える。
 */
import type { Contract } from '../_shared/contract.js'
import { renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'B',
  roles: { label: ':scope > [slot="label"]' },
  required: ['label'],
  tree: {
    tag: '${tag}',
    attrs: { open: '$open' },
    children: [
      { tag: 'h2', slot: 'label', children: [{ prop: 'label' }] },
      // children は生 HTML。利用側が組み立てた信頼済みの断片だけを渡す
      { raw: '$children' },
    ],
  },
} as const satisfies Contract

export type ${pascal}MarkupProps = {
  readonly label: string
  /** 本文。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  readonly open?: boolean
}

export const markup = (props: ${pascal}MarkupProps): string => renderMarkup(contract.tree, props)
`

const LOGIC_INPUT: Readonly<Record<Tier, string>> = {
  A: '{ readonly malformed: boolean }',
  B: '{ readonly open: boolean; readonly malformed: boolean }',
  C: '{ readonly open: boolean }',
}

const LOGIC_BODY: Readonly<Record<Tier, string>> = {
  A: `  input.malformed ? new Set(['malformed']) : new Set<string>()`,
  B: `  input.malformed ? new Set(['malformed']) : input.open ? new Set(['open']) : new Set<string>()`,
  C: `  input.open ? new Set(['open']) : new Set<string>()`,
}

const logicFile = ({ tag }: Names, tier: Tier): string =>
  `/**
 * \`${tag}\` の純関数。DOM を触らない。\`*.element.ts\` はここを呼ぶだけ（ADR-0005）。
 * TODO: 部品の判断をここに書き、\`*.logic.test.ts\` から先にテストする（red → green）。
 */

export type StateInput = ${LOGIC_INPUT[tier]}

/** 属性と契約の状態を \`:state()\` の集合にする */
export const computeStates = (input: StateInput): ReadonlySet<string> =>
${LOGIC_BODY[tier]}
`

const LOGIC_TEST_CASES: Readonly<Record<Tier, string>> = {
  A: `    expect([...computeStates({ malformed: true })]).toEqual(['malformed'])
    expect([...computeStates({ malformed: false })]).toEqual([])`,
  B: `    expect([...computeStates({ open: true, malformed: true })]).toEqual(['malformed'])
    expect([...computeStates({ open: true, malformed: false })]).toEqual(['open'])`,
  C: `    expect([...computeStates({ open: true })]).toEqual(['open'])
    expect([...computeStates({ open: false })]).toEqual([])`,
}

const logicTestFile = ({ name }: Names, tier: Tier): string =>
  `import { describe, expect, it } from 'vitest'
import { computeStates } from './${name}.logic.js'

describe('computeStates', () => {
  it('属性と契約の状態を :state() の集合にする', () => {
${LOGIC_TEST_CASES[tier]}
  })

  // oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
  it.todo('TODO: この部品の判断をテストから書く（red → green）')
})
`

const elementA = ({ name, tag, pascal }: Names): string =>
  `import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract } from './${name}.contract.js'
import { computeStates } from './${name}.logic.js'

/**
 * TODO: 部品の役割を 1〜2 文で書く。ネイティブ要素を子として包む（ティア A、ADR-0012）。
 * JS が無くても動く。部品が足すのは \`:state()\` と強化ノードだけ。
 *
 * @summary TODO
 * @status experimental
 * @pe A
 *
 * @csspart hint - 補足文言
 * @state malformed - 契約の子が無い
 */
export ${CLASS} Rd${pascal} extends LitElement {
  static override properties: PropertyDeclarations = { hint: {} }

  declare hint: string

  #internals = this.attachInternals()
  #contractOk = false

  constructor() {
    super()
    this.hint = ''
  }

  /** light DOM に描く。既存の子は消さず、強化ノードだけを末尾に足す（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(\`[${tag}] 契約の子が必要（不足: \${result.roles.join(', ')}）\`)
    }
    this.#contractOk = result.kind === 'ok'
  }

  override updated(): void {
    syncStates(this.#internals, computeStates({ malformed: !this.#contractOk }))
  }

  /** 強化ノード。TODO: この部品が足すものに書き換える */
  override render(): TemplateResult {
    return html\`\${this.hint === '' ? nothing : html\`<p part="hint">\${this.hint}</p>\`}\`
  }
}
`

const elementB = ({ name, tag, pascal }: Names): string =>
  `import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract } from './${name}.contract.js'
import { computeStates } from './${name}.logic.js'
import { styles } from './${name}.styles.js'

const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, delegatesFocus: true, serializable: true }

/**
 * TODO: 部品の役割を 1〜2 文で書く。枠だけが shadow にあり内容はすべて slot（ティア B、ADR-0012）。
 * JS が無いときは \`:not(:defined)\` の CSS が受け、内容がそのまま読める。
 *
 * @summary TODO
 * @status experimental
 * @pe B
 *
 * @slot - 本文
 * @slot label - 見出し。省略不可
 * @csspart control - shadow の枠
 * @csspart label - 見出しの入れ物
 * @state open - 開いている
 * @state malformed - slot="label" の子が無い
 */
export ${CLASS} Rd${pascal} extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  static override properties: PropertyDeclarations = { open: { type: Boolean, reflect: true } }

  declare open: boolean

  #internals = this.attachInternals()
  #contractOk = false

  constructor() {
    super()
    this.open = false
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(\`[${tag}] slot="label" の子が必要（不足: \${result.roles.join(', ')}）\`)
    }
    this.#contractOk = result.kind === 'ok'
  }

  override updated(): void {
    syncStates(this.#internals, computeStates({ open: this.open, malformed: !this.#contractOk }))
  }

  override render(): TemplateResult {
    return html\`<div part="control">
      <div part="label"><slot name="label"></slot></div>
      <slot></slot>
    </div>\`
  }
}
`

const elementC = ({ name, pascal }: Names): string =>
  `import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncStates } from '../_shared/internals.js'
import { computeStates } from './${name}.logic.js'
import { styles } from './${name}.styles.js'

/** \`serializable: true\` が無いと描画後 HTML（markuplint）に shadow の中身が出ない */
const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, serializable: true }

/**
 * TODO: 部品の役割を 1〜2 文で書く。shadow 完結（ティア C、ADR-0012）。
 * JS が無いときは何も起きない（害が無い）。
 *
 * @summary TODO
 * @status experimental
 * @pe C
 *
 * @slot - 内容
 * @csspart control - shadow の枠
 * @state open - 開いている
 */
export ${CLASS} Rd${pascal} extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  static override properties: PropertyDeclarations = { open: { type: Boolean, reflect: true } }

  declare open: boolean

  #internals = this.attachInternals()

  constructor() {
    super()
    this.open = false
  }

  override updated(): void {
    syncStates(this.#internals, computeStates({ open: this.open }))
  }

  override render(): TemplateResult {
    return html\`<div part="control"><slot></slot></div>\`
  }
}
`

const elementFile = (names: Names, tier: Tier): string => {
  switch (tier) {
    case 'A':
      return elementA(names)
    case 'B':
      return elementB(names)
    case 'C':
      return elementC(names)
  }
}

const cssFile = ({ tag }: Names, tier: Tier): string =>
  tier === 'A'
    ? `@layer rd.components {
  ${tag} {
    display: block;
  }

  /* TODO: セレクタは \`${tag} > <native>\` の 1 段に留める（利用側のクラスを仮定しない） */
  ${tag} > input {
    display: block;
    min-block-size: var(--rd-sizing-target-min);
    padding-block: var(--rd-space-2);
    padding-inline: var(--rd-space-3);
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-strong);
    border-radius: var(--rd-radius-md);
    background: var(--rd-color-surface-default);
    color: var(--rd-color-text-default);
    font: inherit;
  }

  ${tag} > input:focus-visible {
    outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color);
    outline-offset: var(--rd-focus-ring-offset);
  }

  ${tag} > [part='hint'] {
    margin-block: var(--rd-space-1) 0;
    color: var(--rd-color-text-muted);
    font: var(--rd-type-small);
  }

  @media (forced-colors: active) {
    ${tag} > input {
      border-color: FieldText;
    }

    ${tag} > input:focus-visible {
      outline-color: Highlight;
    }
  }
}
`
    : `@layer rd.components {
  /* 定義前（JS が無い / 遅い）の見え方だけ。枠は \`<name>.styles.ts\`（ADR-0012 ティア B） */
  ${tag}:not(:defined) {
    display: block;
    padding: var(--rd-space-4);
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-default);
    border-radius: var(--rd-radius-lg);
    background: var(--rd-color-surface-raised);
    color: var(--rd-color-text-default);
  }

  ${tag}:not(:defined) > [slot='label'] {
    margin-block: 0 var(--rd-space-4);
    font: var(--rd-type-heading-2);
  }
}
`

const stylesFile = (): string =>
  `import { css, type CSSResult } from 'lit'

/** TODO: 枠の見た目だけ。トークン以外の生値は書かない（ADR-0004） */
export const styles: CSSResult = css\`
  @layer rd.components {
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part='control'] {
      padding: var(--rd-space-4);
      border-width: var(--rd-border-width-default);
      border-style: solid;
      border-color: var(--rd-color-border-default);
      border-radius: var(--rd-radius-lg);
      background: var(--rd-color-surface-raised);
      color: var(--rd-color-text-default);
      font: inherit;
    }

    @media (forced-colors: active) {
      [part='control'] {
        border-color: CanvasText;
      }
    }
  }
\`
`

const defineFile = ({ name, tag, pascal }: Names): string =>
  `import { Rd${pascal} } from './${name}.element.js'

declare global {
  // HTMLElementTagNameMap の宣言マージは interface でしか書けない（riml-ds-typescript の type 既定の例外）
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface HTMLElementTagNameMap {
    '${tag}': Rd${pascal}
  }
}

customElements.define('${tag}', Rd${pascal})
`

const FIXTURE: Readonly<Record<Tier, (names: Names) => string>> = {
  A: ({ tag }) => `'<${tag}><label for="a">ラベル</label><input id="a" name="a"></${tag}>'`,
  B: ({ tag }) => `'<${tag}><h2 slot="label">見出し</h2><p>本文</p></${tag}>'`,
  C: ({ tag }) => `'<${tag}></${tag}>'`,
}

const testFile = (names: Names, tier: Tier): string => {
  const { name, pascal, tag } = names
  const style =
    tier === 'C' ? '' : `  await loadStyle('/library/elements/src/${name}/${name}.css')\n`
  const first =
    tier === 'C'
      ? `it('shadow に枠が描かれる', async () => {
  const el = await fixtureOf(Rd${pascal}, FIXTURE)
  expect(el.shadowRoot?.querySelector('[part=control]')).not.toBeNull()
})`
      : `it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(Rd${pascal}, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})`
  return `import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { Rd${pascal} } from './${name}.element.js'
// ${tag} を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './${name}.define.js'

const FIXTURE = ${FIXTURE[tier](names)}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
${style}})

afterEach(() => {
  cleanupFixtures()
})

${first}

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: この部品の振る舞いをテストから書く（red → green）')
`
}

const srTestFile = ({ name, tag }: Names): string =>
  `import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, it } from 'vitest'
import { cleanupFixtures } from '../../test/fixture.js'
// ${tag} を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './${name}.define.js'

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

// oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
it.todo('TODO: 仮想スクリーンリーダーで読み上げ内容を固定する（対話部品は必須）')
`

const STORY_TAIL = `export const Dark: Story = { globals: { scheme: 'dark' } }

export const Dense: Story = { globals: { density: 'compact' } }

export const RTL: Story = { globals: { dir: 'rtl' } }

export const ForcedColors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の \`forcedColors: "active"\` でだけ検証する（\`e2e/vrt/forced.spec.ts\`）。'
          + 'CSS のメディア特性はページの JS から切り替えられないので、Storybook 上では見た目が変わらない。',
      },
    },
  },
}

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playwright の \`reducedMotion: "reduce"\` でだけ検証する（\`e2e/vrt/reduced.spec.ts\`）。'
          + 'Storybook 上では見た目が変わらない。',
      },
    },
  },
}
`

const storiesFile = ({ name, tag, pascal, camel }: Names, tier: Tier): string => {
  if (tier === 'C') {
    return `// oxlint-disable import/no-unassigned-import -- define は副作用 import が正しい形
/**
 * TODO: story を 8 種そろえる（riml-ds-element skill §5）。ティア C は shadow 完結なので
 * 要素をそのまま置き、\`@rd-shadow\` の \`shadowText\` で中身を見る。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { argTypes } from '@rd-argtypes'
import { queryShadow } from '@rd-shadow'
import { expect } from 'storybook/test'
import './${name}.define.js'

type Args = { readonly open: boolean }

const meta: Meta<Args> = {
  title: 'Components/${pascal}',
  component: '${tag}',
  tags: ['autodocs'],
  argTypes: { ...argTypes['${tag}'] },
  args: { open: false },
  render: (args) => html\`<${tag} ?open=\${args.open}>TODO</${tag}>\`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('${tag}')
    await expect(queryShadow(host, '[part="control"]')).not.toBeNull()
  },
}

/** TODO: 全 variant を並べる */
export const Variants: Story = { args: { open: true } }

/** TODO: 無効状態。該当しない部品なら消してよい（skill §5） */
export const Disabled: Story = {}

/** TODO: 検証に通らない状態。該当しない部品なら消してよい（skill §5） */
export const Invalid: Story = {}

${STORY_TAIL}`
  }
  const args =
    tier === 'A'
      ? `{ id: 'sb-${name}', label: 'ラベル', name: '${name}' }`
      : `{ label: '見出し', children: '<p>本文</p>' }`
  const play =
    tier === 'A'
      ? `    await expect(within(canvasElement).getByLabelText('ラベル')).toBeInTheDocument()`
      : `    await expect(within(canvasElement).getByRole('heading', { name: '見出し' })).toBeInTheDocument()`
  return `// oxlint-disable import/no-unassigned-import -- define と CSS は副作用 import が正しい形
/**
 * TODO: story を 8 種そろえる（riml-ds-element skill §5）。\`markup()\` から描く（ADR-0012 §5）。
 */
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { argTypes } from '@rd-argtypes'
import { expect, within } from 'storybook/test'
import './${name}.define.js'
import './${name}.css'
import { ${camel}Markup, type ${pascal}MarkupProps } from './index.js'

type Args = ${pascal}MarkupProps

const meta: Meta<Args> = {
  title: 'Components/${pascal}',
  component: '${tag}',
  tags: ['autodocs'],
  argTypes: { ...argTypes['${tag}'] },
  args: ${args},
  render: (args) => html\`\${unsafeHTML(${camel}Markup(args))}\`,
}

// oxlint-disable-next-line import/no-default-export -- CSF の meta は default export
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvasElement }) => {
${play}
  },
}

/** TODO: 全 variant を並べる */
export const Variants: Story = {}

/** TODO: 無効状態。該当しない部品なら消してよい（skill §5） */
export const Disabled: Story = {}

/** TODO: 検証に通らない状態。該当しない部品なら消してよい（skill §5） */
export const Invalid: Story = {}

${STORY_TAIL}`
}

const indexFile = ({ name, pascal, camel }: Names, tier: Tier): string =>
  tier === 'C'
    ? `export { Rd${pascal} } from './${name}.element.js'
`
    : `export { contract as ${camel}Contract, markup as ${camel}Markup } from './${name}.contract.js'
export type { ${pascal}MarkupProps } from './${name}.contract.js'
export { Rd${pascal} } from './${name}.element.js'
`

/** 契約のテスト。node project で回す（DOM を立てず querySelector だけを差し替える）。toggle / checkbox-group が手本 */
const contractTestFile = ({ name, tag, pascal }: Names, tier: Tier): string => {
  const requiredRoles = tier === 'A' ? "['label', 'control']" : "['label']"
  const missingRole = tier === 'A' ? 'control' : 'label'
  const presentSelectors =
    tier === 'A'
      ? "[contract.roles['label'] ?? '', contract.roles['control'] ?? '']"
      : "[contract.roles['label'] ?? '']"
  const markupCall =
    tier === 'A'
      ? "markup({ id: 'f', label: '見出し', name: 'f' })"
      : "markup({ label: '見出し', children: '<p>本文</p>' })"
  const markupExpect =
    tier === 'A'
      ? `'<${tag}><label for="f">見出し</label><input id="f" name="f"></${tag}>'`
      : `'<${tag}><h2 slot="label">見出し</h2><p>本文</p></${tag}>'`
  return `import { describe, expect, it } from 'vitest'
import { checkContract, type ContractHost } from '../_shared/contract.js'
import { contract, markup } from './${name}.contract.js'

/** DOM を立てずに querySelector だけを差し替える（node project で回すため） */
const hostWith = (present: readonly string[]): ContractHost<string> => ({
  querySelector: (selector) => (present.includes(selector) ? selector : null),
})

describe('markup', () => {
  // TODO: roles / tree を書き換えたら期待値も直す（${pascal}MarkupProps の形に合わせる）
  it('契約の tree どおりの HTML を返す', () => {
    const expected = ${markupExpect}
    expect(${markupCall}).toBe(expected)
  })

  it('文言をエスケープする', () => {
    expect(${markupCall.replace("'見出し'", "'<b>x</b>'")}).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})

describe('contract', () => {
  it('必須の役割が揃っていれば ok', () => {
    expect(contract.required).toEqual(${requiredRoles})
    expect(checkContract(hostWith(${presentSelectors}), contract).kind).toBe('ok')
  })

  it('必須の役割が無ければ missing になり、無い役割名が返る', () => {
    expect(checkContract(hostWith([]), contract)).toEqual({
      kind: 'missing',
      roles: ${requiredRoles},
    })
  })

  // oxlint-disable-next-line vitest/warn-todo -- 雛形。実装のときに本物のテストへ置き換える
  it.todo('${missingRole} だけ欠けた場合を足す（部品の形が決まってから）')
})
`
}

/** skill §1.1 のファイル構成。ティア A は 11 / B は 12 / C は 9 ファイル */
export const filesFor = (names: Names, tier: Tier): readonly GeneratedFile[] => {
  const { name } = names
  const contract: readonly GeneratedFile[] =
    tier === 'C'
      ? []
      : [
          { path: `${name}.contract.ts`, content: contractFile(names, tier) },
          { path: `${name}.contract.test.ts`, content: contractTestFile(names, tier) },
        ]
  const css: readonly GeneratedFile[] =
    tier === 'C' ? [] : [{ path: `${name}.css`, content: cssFile(names, tier) }]
  const styles: readonly GeneratedFile[] =
    tier === 'A' ? [] : [{ path: `${name}.styles.ts`, content: stylesFile() }]
  return [
    ...contract,
    { path: `${name}.logic.ts`, content: logicFile(names, tier) },
    { path: `${name}.logic.test.ts`, content: logicTestFile(names, tier) },
    { path: `${name}.element.ts`, content: elementFile(names, tier) },
    ...css,
    ...styles,
    { path: `${name}.define.ts`, content: defineFile(names) },
    { path: `${name}.test.ts`, content: testFile(names, tier) },
    { path: `${name}.sr.test.ts`, content: srTestFile(names) },
    { path: `${name}.stories.ts`, content: storiesFile(names, tier) },
    { path: 'index.ts', content: indexFile(names, tier) },
  ]
}

const srcDir = fileURLToPath(new URL('../src', import.meta.url))

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2))
  if (parsed.kind === 'error') {
    process.stderr.write(`scaffold: ${parsed.message}\n`)
    process.exitCode = 1
    return
  }
  const names = namesOf(parsed.name)
  const dir = join(srcDir, parsed.name)
  // `recursive: false` の mkdir は既存ディレクトリで reject する（成功時の解決値は undefined）
  const exists = await mkdir(dir, { recursive: false }).then(
    () => false,
    () => true,
  )
  if (exists) {
    process.stderr.write(`scaffold: ${dir} は既にある。上書きしない\n`)
    process.exitCode = 1
    return
  }
  const files = filesFor(names, parsed.tier)
  await Promise.all(files.map(async (file) => writeFile(join(dir, file.path), file.content)))
  process.stdout.write(
    `scaffold: ${names.tag}（ティア ${parsed.tier}）${files.length} ファイル → library/elements/src/${parsed.name}/\n`,
  )
  process.stdout.write(
    '次の手順: 1) *.logic.test.ts を書く（red） 2) 実装（green） 3) package.json の exports に'
      + ` "./experimental/${parsed.name}" を足す 4) bun run gen && bun run check\n`,
  )
}

await main()
