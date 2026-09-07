import { rimlDs } from '@rimltempest/riml-ds-astro'
import { defineConfig } from 'astro/config'

// integration が layers.css / tokens.css / 部品 CSS を注入する。define はダイアログの操作にだけ要る
export default defineConfig({
  integrations: [rimlDs({ define: ['button', 'dialog', 'live-region', 'text-field'] })],
})
