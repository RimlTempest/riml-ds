/**
 * 生成物に乗らない手書き部分（ADR-0002 §決定 3）。全部品を `app.component()` に登録する。
 * `<rd-*>` を直接書く場合の `compilerOptions.isCustomElement` は利用側の設定（skills/riml-ds §3）。
 */
import type { App, Plugin } from 'vue'
import { rdComponents } from './generated/index.js'

export const rdDesignSystem: Plugin = {
  install: (app: App): void => {
    for (const [name, component] of Object.entries(rdComponents)) {
      app.component(name, component)
    }
  },
}
