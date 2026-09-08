import { rimlDs } from '@rimltempest/riml-ds-astro'
import { defineConfig } from 'astro/config'

// integration が layers.css / tokens.css / 部品 CSS を注入する。define はダイアログの操作にだけ要る
// （experimental の部品は `experimental/<name>` のサブパスから読む。ADR-0009）
export default defineConfig({
  integrations: [
    rimlDs({
      define: [
        'button',
        'dialog',
        'live-region',
        'text-field',
        'experimental/select',
        'experimental/checkbox',
        'experimental/checkbox-group',
        'experimental/combobox',
        'experimental/command',
        'experimental/data-table',
        'experimental/input-otp',
        'experimental/menu',
        'experimental/meter',
        'experimental/popover',
        'experimental/radio-group',
        'experimental/slider',
        'experimental/tabs',
        'experimental/toggle',
        'experimental/window',
      ],
    }),
  ],
})
