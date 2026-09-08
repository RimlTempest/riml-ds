/** 6 部品の CEM 断片と契約。生成器のテストが共有する（実物の写し）。`rd-select` / `rd-menu` が `@status experimental` */
import type { Package } from 'custom-elements-manifest/schema'
import type { Contract } from '../../src/wrappers/core/common.js'

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

export const manifest: Package = {
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/button/button.element.js',
      declarations: [
        declaration('rd-button', {
          pe: 'A',
          attributes: [
            { name: 'variant', type: { text: 'ButtonVariant' } },
            { name: 'loading', type: { text: 'boolean' } },
          ],
          events: [
            {
              name: 'rd-press',
              type: { text: 'CustomEvent<Record<string, never>>' },
              description: '子の click で発火',
            },
          ],
        }),
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/text-field/text-field.element.js',
      declarations: [
        declaration('rd-text-field', {
          pe: 'A',
          attributes: [
            { name: 'hint', type: { text: 'string' } },
            { name: 'error', type: { text: 'string' } },
          ],
        }),
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/dialog/dialog.element.js',
      declarations: [
        declaration('rd-dialog', {
          pe: 'B',
          attributes: [
            { name: 'open', type: { text: 'boolean' } },
            { name: 'dismissible', type: { text: 'boolean' } },
          ],
          events: [
            {
              name: 'rd-dismiss',
              type: { text: "CustomEvent<{ reason: 'esc' | 'backdrop' | 'api' }>" },
              description: '閉じたときに発火',
            },
          ],
          slots: [{ name: '' }, { name: 'label' }, { name: 'actions' }],
        }),
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/select/select.element.js',
      declarations: [
        declaration('rd-select', {
          pe: 'A',
          status: 'experimental',
          attributes: [
            { name: 'hint', type: { text: 'string' } },
            { name: 'error', type: { text: 'string' } },
          ],
        }),
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/menu/menu.element.js',
      declarations: [
        declaration('rd-menu', {
          pe: 'B',
          status: 'experimental',
          attributes: [
            { name: 'placement', type: { text: "'start' | 'end'" } },
            { name: 'label', type: { text: 'string' } },
          ],
          events: [
            {
              name: 'rd-select',
              type: { text: 'CustomEvent<{ index: number; href: string }>' },
              description: '項目を選んだときに発火',
            },
          ],
          slots: [{ name: '' }, { name: 'trigger' }],
        }),
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/live-region/live-region.element.js',
      declarations: [
        declaration('rd-live-region', {
          pe: 'C',
          events: [
            {
              name: 'rd-announce',
              type: {
                text: "CustomEvent<{ message: string; politeness: 'polite' | 'assertive' }>",
              },
              description: '読み上げを積んだときに発火',
            },
          ],
        }),
      ],
    },
  ],
}

export const contracts: Readonly<Record<string, Contract>> = {
  button: {
    pe: 'A',
    roles: { control: ':scope > button, :scope > a[href]' },
    required: ['control'],
    tree: {
      tag: 'rd-button',
      attrs: { variant: '$variant', loading: '$loading' },
      children: [{ tag: 'button', attrs: { type: '$type' }, children: [{ prop: 'label' }] }],
    },
  },
  'text-field': {
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
  },
  select: {
    pe: 'A',
    roles: { label: ':scope > label', control: ':scope > select' },
    required: ['label', 'control'],
    tree: {
      tag: 'rd-select',
      attrs: { hint: '$hint', error: '$error', value: '$defaultValue' },
      children: [
        { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
        {
          tag: 'select',
          attrs: { id: '$id', name: '$name', required: '$required' },
          children: [{ raw: '$children' }],
        },
      ],
    },
  },
  menu: {
    pe: 'B',
    roles: { trigger: ':scope > [slot="trigger"]', list: ':scope > [popover]' },
    required: ['trigger', 'list'],
    tree: {
      tag: 'rd-menu',
      attrs: { placement: '$placement', label: '$label' },
      children: [
        { raw: '$trigger' },
        { tag: 'div', attrs: { popover: '', id: '$id' }, children: [{ raw: '$items' }] },
      ],
    },
  },
  dialog: {
    pe: 'B',
    roles: { label: ':scope > [slot="label"]' },
    required: ['label'],
    tree: {
      tag: 'rd-dialog',
      attrs: { open: '$open', dismissible: '$dismissible' },
      children: [{ tag: 'h2', slot: 'label', children: [{ prop: 'label' }] }, { raw: '$children' }],
    },
  },
}
