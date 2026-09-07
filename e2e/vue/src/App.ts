import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-vue'
// experimental は専用サブパスからしか出ない（ADR-0009）
import { RdCheckbox, RdSelect } from '@rimltempest/riml-ds-vue/experimental'
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
        h(RdDialog, { label: '送信しました' }, () => h('p', null, '確認メールを送りました。')),
        // <select> の v-model が効いているかを e2e が読む
        h('p', { id: 'country-echo' }, country.value),
        h('rd-live-region'),
      ])
  },
  { name: 'App' },
)
