import { renderToString } from 'react-dom/server'
import { App } from './App.js'

export const render = (): string => renderToString(<App />)
