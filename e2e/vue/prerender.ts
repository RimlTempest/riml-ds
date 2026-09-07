import { readFile, writeFile } from 'node:fs/promises'
import { render } from './ssr/dist/entry-server.js'

const template = await readFile('dist/index.html', 'utf8')
await writeFile('dist/index.html', template.replace('<!--app-html-->', await render()))
console.log('prerender: dist/index.html')
