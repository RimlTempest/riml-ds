import { createSSRApp } from 'vue'
import { App } from './App.js'
import { enhance } from './enhance.js'
import './styles.css'

createSSRApp(App).mount('#root', true)
enhance()
void import('./defines.js')
