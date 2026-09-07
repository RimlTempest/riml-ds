/**
 * `rd-live-region` の純関数。ページで唯一のライブリージョン（ADR-0008 §6）。
 * 他の部品は `aria-live` を持たず、ここへ `announce()` する。
 */

export type Politeness = 'polite' | 'assertive'

export type AnnouncementQueue = {
  readonly polite: string
  readonly assertive: string
}

export const emptyQueue: AnnouncementQueue = { polite: '', assertive: '' }

/** 末尾に付け外しする不可視の文字。同じ文言を読み直させるために使う */
const NBSP = '\u00a0'

/** 直前と同じ文言なら nbsp を交互に付け外しし、テキストの変化として読み上げさせる */
const nextText = (current: string, message: string): string =>
  current === message ? `${message}${NBSP}` : message

/** 空（空白だけを含む）の文言は無視し、キューを**同一参照のまま**返す */
export const nextAnnouncement = (
  queue: AnnouncementQueue,
  message: string,
  politeness: Politeness,
): AnnouncementQueue => {
  const text = message.trim()
  if (text === '') {
    return queue
  }
  return politeness === 'assertive'
    ? { polite: queue.polite, assertive: nextText(queue.assertive, text) }
    : { polite: nextText(queue.polite, text), assertive: queue.assertive }
}
