export function resolveCanonical(canonicalPath: string | null | undefined, origin: string): string | undefined {
  if (!canonicalPath) return undefined
  if (canonicalPath.startsWith('http')) return canonicalPath
  return `${origin}${canonicalPath}`
}
