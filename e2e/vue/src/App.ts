import { RdButton, RdDialog, RdTextField } from '@rimltempest/riml-ds-vue'
import { defineComponent, h } from 'vue'

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
        h(RdButton, { type: 'submit' }, () => '送信'),
      ]),
      h(RdDialog, { label: '送信しました' }, () => h('p', null, '確認メールを送りました。')),
      h('rd-live-region'),
    ]),
  { name: 'App' },
)
