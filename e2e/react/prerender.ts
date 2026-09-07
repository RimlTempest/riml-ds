/** ビルド後の dist/index.html に SSR 出力を差し込む（JS 無しでも同じ HTML が出ることを固定する） */
import { readFile, writeFile } from 'node:fs/promises'
import { render } from './ssr/dist/entry-server.js'

const template = await readFile('dist/index.html', 'utf8')
await writeFile('dist/index.html', template.replace('<!--app-html-->', render()))
console.log('prerender: dist/index.html')
