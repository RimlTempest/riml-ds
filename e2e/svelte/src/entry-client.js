import { hydrate } from 'svelte'
import App from './App.svelte'
import { enhance } from './enhance.js'
import './styles.css'

const root = document.querySelector('#root')
if (root !== null) {
  hydrate(App, { target: root })
}
enhance()
void import('./defines.js')
