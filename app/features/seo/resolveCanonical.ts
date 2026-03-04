export function resolveCanonical(canonicalPath: string | null | undefined): string | undefined {
  if (!canonicalPath) return undefined
  if (canonicalPath.startsWith('http')) return canonicalPath
  const { origin } = useRequestURL()
  return `${origin}${canonicalPath}`
}
