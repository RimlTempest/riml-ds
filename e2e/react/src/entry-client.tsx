import { hydrateRoot } from 'react-dom/client'
import { App } from './App.js'
import { enhance } from './enhance.js'
import './styles.css'

const root = document.querySelector('#root')
if (root !== null) {
  hydrateRoot(root, <App />)
}
enhance()
// define はハイドレーションの後。先に読むと強化ノードで DOM が食い違う（README 参照）
void import('./defines.js')
