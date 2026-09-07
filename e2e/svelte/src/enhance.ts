/**
 * 強化（JS がある場合だけ）。4 フレームワークで同じ挙動にする。
 * 要素はイベントのたびに引き直す（ハイドレーションで作り直されても効くように）。
 */
export const enhance = (): void => {
  document.addEventListener('submit', (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || form.id !== 'contact') {
      return
    }
    event.preventDefault()
    const dialog = document.querySelector('rd-dialog')
    if (dialog !== null && 'show' in dialog && typeof dialog.show === 'function') {
      dialog.show()
    }
  })
}
