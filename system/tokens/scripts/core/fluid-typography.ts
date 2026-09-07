import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'

/** `$extensions["riml-ds"].fluid` の 3 値。DTCG は clamp() を表現できないので拡張で持つ。 */
export type Fluid = {
  readonly min: string
  readonly preferred: string
  readonly max: string
}

export type FluidError =
  | { readonly kind: 'not-a-document'; readonly received: string }
  | { readonly kind: 'invalid-fluid'; readonly id: string }

const RIML_DS = 'riml-ds'

const readFluid = (value: unknown): Fluid | undefined => {
  if (!isRecord(value)) {
    return undefined
  }
  const { min, preferred, max } = value
  return typeof min === 'string' && typeof preferred === 'string' && typeof max === 'string'
    ? { min, preferred, max }
    : undefined
}

export const cssVarName = (id: string): string => `--rd-${id.replaceAll('.', '-')}`

/** DTCG の文書から「CSS 変数名 → clamp() 文字列」を作る。純関数。 */
export const collectFluid = (
  document: unknown,
): Result<ReadonlyMap<string, string>, FluidError> => {
  if (!isRecord(document)) {
    return err({ kind: 'not-a-document', received: typeof document })
  }
  const found = new Map<string, string>()
  const walk = (node: Record<string, unknown>, path: readonly string[]): FluidError | undefined => {
    if ('$value' in node) {
      const extensions = node['$extensions']
      const riml = isRecord(extensions) ? extensions[RIML_DS] : undefined
      if (isRecord(riml) && 'fluid' in riml) {
        const fluid = readFluid(riml['fluid'])
        if (fluid === undefined) {
          return { kind: 'invalid-fluid', id: path.join('.') }
        }
        found.set(
          `${cssVarName(path.join('.'))}-font-size`,
          `clamp(${fluid.min}, ${fluid.preferred}, ${fluid.max})`,
        )
      }
      return undefined
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !isRecord(child)) {
        continue
      }
      const failure = walk(child, [...path, key])
      if (failure !== undefined) {
        return failure
      }
    }
    return undefined
  }
  const failure = walk(document, [])
  return failure === undefined ? ok(found) : err(failure)
}

/** 固定値で出た font-size 変数を clamp() に置き換える。 */
export const fluidTypography = (css: string, clamps: ReadonlyMap<string, string>): string => {
  let output = css
  for (const [name, clamped] of clamps) {
    output = output.replaceAll(new RegExp(`(${name}\\s*:\\s*)[^;]+;`, 'g'), `$1${clamped};`)
  }
  return output
}
