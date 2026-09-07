import type { Package } from 'custom-elements-manifest/schema'
import { describe, expect, it } from 'vitest'
import type { Contract } from '../../src/wrappers/core/common.js'
import { eventProp, toPascal, toWrapperSpecs } from '../../src/wrappers/core/common.js'

const declaration = (
  tagName: string,
  extra: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> & { readonly kind: 'class'; readonly name: string } => ({
  kind: 'class',
  name: 'Rd',
  customElement: true,
  tagName,
  ...extra,
})

const manifest = (
  entries: readonly (readonly [string, Readonly<Record<string, unknown>>])[],
): Package => ({
  schemaVersion: '1.0.0',
  modules: entries.map(([tagName, extra]) => ({
    kind: 'javascript-module',
    path: `src/${tagName.replace('rd-', '')}/x.element.js`,
    declarations: [declaration(tagName, extra)],
  })),
})

const buttonContract: Contract = {
  pe: 'A',
  roles: { control: ':scope > button, :scope > a[href]' },
  required: ['control'],
  tree: {
    tag: 'rd-button',
    attrs: { variant: '$variant', loading: '$loading' },
    children: [{ tag: 'button', attrs: { type: '$type' }, children: [{ prop: 'label' }] }],
  },
}

const textFieldContract: Contract = {
  pe: 'A',
  roles: { label: ':scope > label', control: ':scope > input, :scope > textarea' },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-text-field',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: '$type',
          required: '$required',
          autocomplete: '$autocomplete',
          value: '$defaultValue',
        },
      },
    ],
  },
}

const dialogContract: Contract = {
  pe: 'B',
  roles: { label: ':scope > [slot="label"]' },
  required: ['label'],
  tree: {
    tag: 'rd-dialog',
    attrs: { open: '$open', dismissible: '$dismissible' },
    children: [{ tag: 'h2', slot: 'label', children: [{ prop: 'label' }] }, { raw: '$children' }],
  },
}

const buttonCem: Readonly<Record<string, unknown>> = {
  pe: 'A',
  attributes: [
    { name: 'variant', type: { text: 'ButtonVariant' }, default: "'primary'" },
    { name: 'loading', type: { text: 'boolean' }, default: 'false' },
  ],
  events: [
    {
      name: 'rd-press',
      type: { text: 'CustomEvent<Record<string, never>>' },
      description: '子の click で発火',
    },
  ],
}

const textFieldCem: Readonly<Record<string, unknown>> = {
  pe: 'A',
  attributes: [
    { name: 'hint', type: { text: 'string' }, default: "''" },
    { name: 'error', type: { text: 'string' }, default: "''" },
  ],
}

const dialogCem: Readonly<Record<string, unknown>> = {
  pe: 'B',
  attributes: [
    { name: 'open', type: { text: 'boolean' }, default: 'false' },
    { name: 'dismissible', type: { text: 'boolean' }, default: 'true' },
  ],
  events: [
    { name: 'rd-dismiss', type: { text: "CustomEvent<{ reason: 'esc' }>" }, description: '閉じた' },
  ],
  slots: [{ name: '' }, { name: 'label' }, { name: 'actions' }],
}

const liveRegionCem: Readonly<Record<string, unknown>> = { pe: 'C' }

describe('toPascal', () => {
  it('タグ名を PascalCase の部品名にする', () => {
    expect(toPascal('rd-text-field')).toBe('RdTextField')
    expect(toPascal('rd-button')).toBe('RdButton')
  })
})

describe('eventProp', () => {
  it('rd-press を onRdPress にする', () => {
    expect(eventProp('rd-press')).toBe('onRdPress')
    expect(eventProp('rd-dismiss')).toBe('onRdDismiss')
  })
})

describe('toWrapperSpecs', () => {
  it('CEM の属性・イベントと契約の木から button の仕様を作る', () => {
    const [spec] = toWrapperSpecs(manifest([['rd-button', buttonCem]]), { button: buttonContract })
    expect(spec?.pascal).toBe('RdButton')
    expect(spec?.pe).toBe('A')
    expect(spec?.attrs).toEqual([
      { name: 'variant', type: { named: 'ButtonVariant' }, optional: true, description: '' },
      { name: 'loading', type: 'boolean', optional: true, description: '' },
    ])
    expect(spec?.events).toEqual([
      {
        name: 'rd-press',
        prop: 'onRdPress',
        detail: 'CustomEvent<Record<string, never>>',
        description: '子の click で発火',
      },
    ])
    expect(spec?.markupProps).toEqual([
      { name: 'variant', type: { named: 'ButtonVariant' }, optional: true, kind: 'attr' },
      { name: 'loading', type: 'boolean', optional: true, kind: 'attr' },
      {
        name: 'type',
        type: { union: ['button', 'submit', 'reset'] },
        optional: true,
        kind: 'attr',
      },
      { name: 'label', type: 'string', optional: true, kind: 'text' },
    ])
    expect(spec?.controlTag).toBe('button')
    expect(spec?.namedTypes).toEqual(['ButtonVariant'])
  })

  it('HTML の boolean 属性は boolean、$id は name で代替する', () => {
    const [spec] = toWrapperSpecs(manifest([['rd-text-field', textFieldCem]]), {
      'text-field': textFieldContract,
    })
    expect(spec?.markupProps.map((markupProp) => markupProp.name)).toEqual([
      'hint',
      'error',
      'id',
      'label',
      'name',
      'type',
      'required',
      'autocomplete',
      'defaultValue',
    ])
    const required = spec?.markupProps.find((markupProp) => markupProp.name === 'required')
    expect(required?.type).toBe('boolean')
    const hint = spec?.markupProps.find((markupProp) => markupProp.name === 'hint')
    expect(hint?.type).toBe('string')
    expect(spec?.idFallback).toBe('name')
    expect(spec?.controlTag).toBe('input')
  })

  it('ティア B は raw を children として持ち、slot を CEM から引く', () => {
    const [spec] = toWrapperSpecs(manifest([['rd-dialog', dialogCem]]), { dialog: dialogContract })
    expect(spec?.pe).toBe('B')
    expect(spec?.markupProps).toContainEqual({
      name: 'children',
      type: 'string',
      optional: false,
      kind: 'raw',
    })
    expect(spec?.slots).toEqual([{ name: '' }, { name: 'label' }, { name: 'actions' }])
  })

  it('ティア C は契約が無く markupProps が空', () => {
    const [spec] = toWrapperSpecs(manifest([['rd-live-region', liveRegionCem]]), {})
    expect(spec?.pe).toBe('C')
    expect(spec?.contract).toBeUndefined()
    expect(spec?.markupProps).toEqual([])
    expect(spec?.controlTag).toBeUndefined()
  })

  it('部品名の昇順で返す（生成が冪等になる）', () => {
    const specs = toWrapperSpecs(
      manifest([
        ['rd-text-field', textFieldCem],
        ['rd-button', buttonCem],
        ['rd-dialog', dialogCem],
      ]),
      { button: buttonContract, dialog: dialogContract, 'text-field': textFieldContract },
    )
    expect(specs.map((spec) => spec.name)).toEqual(['button', 'dialog', 'text-field'])
  })
})
