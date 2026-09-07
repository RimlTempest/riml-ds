/**
 * `rd-toast` の純関数。DOM を触らない。読み上げは持たず `rd-live-region` に委譲する（ADR-0008 §6）。
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export type Politeness = 'polite' | 'assertive'

export type ShowInput = {
  readonly message: string
  readonly tone?: ToastTone
  /** ミリ秒。`0` なら自動で消さない */
  readonly duration?: number
}

export type Toast = {
  readonly id: number
  readonly message: string
  readonly tone: ToastTone
  readonly duration: number
}

/** 既定の表示時間。WCAG 2.2.1 の「止められること」は hover / focus の一時停止で満たす */
export const DEFAULT_DURATION = 6000

/** 空（空白だけ）の文言は無視する。tone / duration は既定で埋める */
export const nextToast = (id: number, input: ShowInput): Toast | undefined => {
  const message = input.message.trim()
  if (message === '') {
    return undefined
  }
  return {
    id,
    message,
    tone: input.tone ?? 'info',
    duration: input.duration ?? DEFAULT_DURATION,
  }
}

/** エラーだけ割り込んで読み上げる。それ以外は polite（ADR-0008 §6） */
export const politenessFor = (tone: ToastTone): Politeness =>
  tone === 'danger' ? 'assertive' : 'polite'

/** フォーカス／ホバー中は自動で消さない（WCAG 2.2.1 タイミング調整可能） */
export const shouldRunTimer = (input: {
  readonly open: boolean
  readonly paused: boolean
  readonly duration: number
}): boolean => input.open && !input.paused && input.duration > 0

export const computeStates = (input: {
  readonly open: boolean
  readonly tone: ToastTone
}): ReadonlySet<string> => (input.open ? new Set(['open', input.tone]) : new Set<string>())
