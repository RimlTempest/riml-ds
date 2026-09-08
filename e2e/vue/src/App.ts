import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-vue'
// experimental は専用サブパスからしか出ない（ADR-0009）
import {
  RdCheckbox,
  RdCheckboxGroup,
  RdInputOtp,
  RdMenu,
  RdMeter,
  RdPopover,
  RdRadioGroup,
  RdSelect,
  RdSlider,
  RdTabs,
  RdWindow,
} from '@rimltempest/riml-ds-vue/experimental'
import { defineComponent, h, ref } from 'vue'

/** 4 フレームワークで同じ選択肢を出す */
const countries = () => [
  h('option', { value: '' }, '選択してください'),
  h('option', { value: 'jp' }, '日本'),
  h('option', { value: 'us' }, 'アメリカ'),
]

/** React / Svelte / Astro と同じ 1 ページ。`#country-echo` だけ Vue の v-model 用（plan 011） */
export const App = defineComponent(
  () => {
    const country = ref('')
    return () =>
      h('main', null, [
        h('h1', null, 'お問い合わせ'),
        h('form', { id: 'contact', method: 'get', action: '/thanks.html' }, [
          h(RdTextField, {
            label: 'メール',
            name: 'email',
            type: 'email',
            required: true,
            hint: '確認メールを送ります',
          }),
          h(
            RdSelect,
            {
              label: '国',
              name: 'country',
              modelValue: country.value,
              'onUpdate:modelValue': (value: string) => {
                country.value = value
              },
            },
            countries,
          ),
          h(RdCheckbox, { label: 'お知らせを受け取る', name: 'news', defaultValue: 'yes' }),
          h(RdButton, { type: 'submit' }, () => '送信'),
        ]),
        h(RdDialog, { label: '送信しました', placement: 'end' }, () =>
          h('p', null, '確認メールを送りました。'),
        ),
        h(RdMeter, {
          id: 'disk',
          label: 'ディスク使用量',
          value: '3.2',
          max: '10',
          text: '3.2 GB / 10 GB',
        }),
        h(RdWindow, { title: 'バックアップの設定', collapsible: true }, () =>
          h('p', null, '毎晩 3 時に実行します。'),
        ),
        // <select> の v-model が効いているかを e2e が読む
        h('p', { id: 'country-echo' }, country.value),
        h(RdRadioGroup, { label: 'プラン' }, () => [
          h('label', null, [
            h('input', { type: 'radio', id: 'plan-free', name: 'plan', value: 'free' }),
            '無料',
          ]),
          h('label', null, [
            h('input', { type: 'radio', id: 'plan-pro', name: 'plan', value: 'pro' }),
            '有料',
          ]),
        ]),
        h(RdSlider, {
          id: 'volume',
          label: '音量',
          name: 'volume',
          defaultValue: '3',
          min: '0',
          max: '10',
        }),
        h(
          RdTabs,
          { label: 'ドキュメント' },
          {
            tabs: () => [
              h('a', { href: '#overview' }, '概要'),
              h('a', { href: '#usage' }, '使い方'),
            ],
            panels: () => [
              h('div', { id: 'overview' }, h('p', null, 'この部品の概要。')),
              h('div', { id: 'usage' }, h('p', null, '使い方の説明。')),
            ],
          },
        ),
        h(
          RdMenu,
          { label: '操作', id: 'row-actions' },
          {
            trigger: () =>
              h(
                'rd-button',
                { slot: 'trigger' },
                h('button', { type: 'button', popovertarget: 'row-actions' }, '操作'),
              ),
            items: () => [
              h('a', { href: '/thanks.html' }, '複製'),
              h('button', { type: 'button' }, '削除'),
            ],
          },
        ),
        h(
          RdPopover,
          { id: 'filters', label: '絞り込み' },
          {
            trigger: () =>
              h(
                'rd-button',
                { slot: 'trigger' },
                h('button', { type: 'button', popovertarget: 'filters' }, '絞り込み'),
              ),
            default: () => h('p', null, '条件を選ぶと一覧がその場で変わる。'),
          },
        ),
        h(RdCheckboxGroup, { label: 'タグ' }, () => [
          h('label', null, [
            h('input', { type: 'checkbox', id: 'tag-work', name: 'tags', value: 'a' }),
            '仕事',
          ]),
          h('label', null, [
            h('input', { type: 'checkbox', id: 'tag-private', name: 'tags', value: 'b' }),
            '私用',
          ]),
        ]),
        h(RdInputOtp, { label: '確認コード' }, () => [
          h('input', {
            type: 'text',
            inputmode: 'numeric',
            pattern: '[0-9]',
            maxlength: '1',
            id: 'code-1',
            name: 'code-1',
            'aria-label': '1 桁目',
            title: '0〜9 の数字 1 文字',
            required: true,
            autocomplete: 'one-time-code',
          }),
          h('input', {
            type: 'text',
            inputmode: 'numeric',
            pattern: '[0-9]',
            maxlength: '1',
            id: 'code-2',
            name: 'code-2',
            'aria-label': '2 桁目',
            title: '0〜9 の数字 1 文字',
            required: true,
          }),
        ]),
        h('rd-live-region'),
      ])
  },
  { name: 'App' },
)
