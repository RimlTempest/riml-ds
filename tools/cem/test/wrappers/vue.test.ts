import { describe, expect, it } from 'vitest'
import { toWrapperSpecs } from '../../src/wrappers/core/common.js'
import { vueFiles } from '../../src/wrappers/core/vue.js'
import { contracts, manifest } from './fixtures.js'

const files = vueFiles(toWrapperSpecs(manifest, contracts))
const find = (path: string): string => files.find((file) => file.path === path)?.content ?? ''

describe('vueFiles', () => {
  it('契約の木を defineComponent + h() で描く（SFC を使わない）', () => {
    const source = find('button.ts')
    expect(source).toContain(`import { defineComponent, h } from 'vue'`)
    expect(source).toContain(
      `import type { ButtonVariant } from '@rimltempest/riml-ds-elements/button'`,
    )
    expect(source).toContain(
      `h('rd-button', { ...(props.variant === undefined ? {} : { variant: props.variant })`,
    )
    expect(source).toContain(`...(props.loading === true ? { loading: true } : {})`)
    expect(source).toContain(
      `h('button', { type: props.type }, slots['default']?.() ?? props.label)`,
    )
    expect(source).not.toContain(' as ')
  })

  it('ティア A のフォーム部品は v-model（modelValue / update:modelValue）を受ける', () => {
    const source = find('text-field.ts')
    expect(source).toContain('readonly modelValue?: string')
    expect(source).toContain(`emits: ['update:modelValue']`)
    expect(source).toContain(`emit('update:modelValue', target.value)`)
    expect(source).toContain('value: props.modelValue ?? props.defaultValue')
    // <label for> と <input id> は id が無ければ name を使う
    expect(source).toContain('const controlId = props.id ?? props.name')
  })

  it('<select> / <textarea> でも v-model が効く（HTMLInputElement だけを見ない）', () => {
    const source = find('select.ts')
    expect(source).toContain('HTMLInputElement')
    expect(source).toContain('HTMLSelectElement')
    expect(source).toContain('HTMLTextAreaElement')
    expect(source).toContain(`emit('update:modelValue', target.value)`)
  })

  it('ティア B の raw は既定 slot になる', () => {
    const source = find('dialog.ts')
    expect(source).toContain(`h('h2', { slot: 'label' }, props.label)`)
    expect(source).toContain("slots['default']?.()")
  })

  it('名前つきの raw は名前つきの slot になり、既定 slot に潰れない', () => {
    const source = find('menu.ts')
    expect(source).toContain("slots['trigger']?.()")
    expect(source).toContain("slots['items']?.()")
    expect(source).not.toContain("slots['default']")
  })

  it('ハイフンを含む属性はキーを引用する（h() の引数が構文エラーにならない）', () => {
    const source = find('toggle.ts')
    expect(source).toContain(`'aria-pressed': props.pressed`)
    expect(source).not.toContain('aria-pressed: props.pressed')
    // 識別子として書ける名前はそのまま（既存の生成物を変えない）
    expect(source).toContain(`type: 'button'`)
  })

  it('experimental の部品は root の index に出ず、./experimental の index に出る', () => {
    // ADR-0009: プラグインが登録するのは stable だけ。experimental は利用側が個別に登録する
    const index = find('index.ts')
    expect(index).not.toContain('RdSelect')
    expect(index).toContain('export const rdComponents = { RdButton, RdDialog, RdTextField }')
    const experimental = find('experimental.ts')
    expect(experimental).toContain("import { RdSelect } from './select.js'")
    expect(experimental).toContain(
      'export const rdExperimentalComponents = { RdMenu, RdSelect, RdToggle }',
    )
    expect(experimental).not.toContain('RdButton')
  })

  it('型は GlobalComponents と IntrinsicElementAttributes を広げ、ティア C は部品にならない', () => {
    expect(files.some((file) => file.path === 'live-region.ts')).toBe(false)
    const source = find('elements.ts')
    expect(source).toContain(`declare module 'vue'`)
    expect(source).toContain('interface GlobalComponents')
    expect(source).toContain('interface IntrinsicElementAttributes')
    expect(source).toContain(`'rd-live-region': Record<string, never>`)
    expect(source).toContain(`'rd-button': { variant?: ButtonVariant; loading?: boolean }`)
  })
})
