import { render as renderApp } from 'svelte/server'
import App from './App.svelte'

export const render = () => renderApp(App).body
