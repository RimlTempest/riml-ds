import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import { App } from './App.js'

export const render = async (): Promise<string> => renderToString(createSSRApp(App))
