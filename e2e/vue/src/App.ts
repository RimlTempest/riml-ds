import { RdButton, RdCheckbox, RdDialog, RdSelect, RdTextField } from '@rimltempest/riml-ds-vue'
import { defineComponent, h } from 'vue'

/** 4 フレームワークで同じ選択肢を出す */
const countries = () => [
  h('option', { value: '' }, '選択してください'),
  h('option', { value: 'jp' }, '日本'),
  h('option', { value: 'us' }, 'アメリカ'),
]

/** React / Svelte / Astro と同じ 1 ページ */
export const App = defineComponent(
  () => () =>
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
        h(RdSelect, { label: '国', name: 'country' }, countries),
        h(RdCheckbox, { label: 'お知らせを受け取る', name: 'news', defaultValue: 'yes' }),
        h(RdButton, { type: 'submit' }, () => '送信'),
      ]),
      h(RdDialog, { label: '送信しました' }, () => h('p', null, '確認メールを送りました。')),
      h('rd-live-region'),
    ]),
  { name: 'App' },
)
