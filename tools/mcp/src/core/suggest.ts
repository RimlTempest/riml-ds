/**
 * 用途文 → 候補部品。**LLM は使わない**（ADR-0010）。
 * CEM の `@summary` / 説明と `system/guidelines/*.md` の見出し語を、日本語でも効く
 * 2 文字の n-gram で突き合わせるだけ。候補ゼロなら skill §5「アプリ内に作る」を返す。
 */
import type { ElementSummary, ElementError } from './elements.js'
import { listElements } from './elements.js'
import type { Result } from './result.js'
import { isRecord, ok, stringOr } from './result.js'

export type Suggestion = {
  readonly tag: string
  readonly reason: string
  readonly score: number
}

export type SuggestOutcome =
  | { readonly kind: 'hits'; readonly suggestions: readonly Suggestion[] }
  | { readonly kind: 'none'; readonly advice: string }

export const NO_MATCH_ADVICE =
  'あてはまる部品がありません。まずアプリ内（features/<x>/ui/）に作り、'
  + '2 つ以上のアプリで使いそうなら riml-ds に docs/proposals/<name>.md を出してください'
  + '（skills/riml-ds/SKILL.md §5）。'

/** 日本語には語の区切りが無いので 2 文字の n-gram で比べる。英数字はそのまま語として扱う */
const gramsOf = (text: string): ReadonlySet<string> => {
  const normalized = text.toLowerCase()
  const grams = new Set<string>()
  for (const word of normalized.match(/[a-z0-9-]{2,}/g) ?? []) {
    grams.add(word)
  }
  for (let index = 0; index + 2 <= normalized.length; index += 1) {
    const gram = normalized.slice(index, index + 2)
    if (/[぀-ヿ一-鿿]/.test(gram)) {
      grams.add(gram)
    }
  }
  return grams
}

const overlap = (left: ReadonlySet<string>, right: ReadonlySet<string>): number => {
  let count = 0
  for (const gram of left) {
    if (right.has(gram)) {
      count += 1
    }
  }
  return count
}

const headingsOf = (markdown: string): readonly string[] =>
  markdown.split('\n').flatMap((line) => {
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    return heading?.[1] === undefined ? [] : [heading[1]]
  })

const descriptionOf = (manifest: unknown, tag: string): string => {
  if (!isRecord(manifest) || !Array.isArray(manifest['modules'])) {
    return ''
  }
  for (const module of manifest['modules']) {
    if (!isRecord(module) || !Array.isArray(module['declarations'])) {
      continue
    }
    for (const declared of module['declarations']) {
      if (isRecord(declared) && stringOr(declared['tagName'], '') === tag) {
        return stringOr(declared['description'], '')
      }
    }
  }
  return ''
}

/** guidelines の見出しに用途語が当たり、その節が `rd-*` に触れていれば加点する */
const guidelineBonus = (
  guidelines: Readonly<Record<string, string>>,
  intent: ReadonlySet<string>,
  tag: string,
): { readonly score: number; readonly topics: readonly string[] } => {
  const topics: string[] = []
  let score = 0
  for (const [topic, markdown] of Object.entries(guidelines)) {
    if (!markdown.includes(tag)) {
      continue
    }
    const hit = headingsOf(markdown).some((heading) => overlap(intent, gramsOf(heading)) > 0)
    if (hit) {
      score += 2
      topics.push(topic)
    }
  }
  return { score, topics }
}

const reasonFor = (element: ElementSummary, topics: readonly string[]): string =>
  topics.length === 0
    ? `${element.summary}（PE ティア ${element.pe}）`
    : `${element.summary}（PE ティア ${element.pe}。${topics.join(' / ')} のガイドラインが触れています）`

export const suggestComponent = (
  manifest: unknown,
  guidelines: Readonly<Record<string, string>>,
  intent: string,
): Result<SuggestOutcome, ElementError> => {
  const elements = listElements(manifest)
  if (!elements.ok) {
    return elements
  }
  const wanted = gramsOf(intent)
  const scored = elements.value
    .map((element) => {
      const text = `${element.tag} ${element.name} ${element.summary} ${descriptionOf(manifest, element.tag)}`
      const bonus = guidelineBonus(guidelines, wanted, element.tag)
      return {
        tag: element.tag,
        reason: reasonFor(element, bonus.topics),
        score: overlap(wanted, gramsOf(text)) * 3 + bonus.score,
      }
    })
    .filter((suggestion) => suggestion.score > 0)
    .toSorted((left, right) => right.score - left.score || left.tag.localeCompare(right.tag))

  return ok(
    scored.length === 0
      ? { kind: 'none', advice: NO_MATCH_ADVICE }
      : { kind: 'hits', suggestions: scored },
  )
}
