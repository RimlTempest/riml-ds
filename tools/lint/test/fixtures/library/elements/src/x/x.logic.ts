export const parseLabel = (value: string): string => {
  if (value === '') {
    throw new Error('empty label')
  }
  return value
}
