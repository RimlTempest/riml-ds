/**
 * vite が扱う非 JS の import の型。story が `import './button.css'` と書けるようにする。
 * `vite/client` を丸ごと入れると `types` が肥大するので、riml-ds が実際に使う 2 つだけを宣言する。
 */
declare module '*.css' {}

declare module '*?raw' {
  const content: string
  export default content
}
