import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

const PUBLIC_CANONICAL_STATE_KEY = 'seo:public-canonical-href'

export function usePublicCanonicalState() {
  return useState<string | null>(PUBLIC_CANONICAL_STATE_KEY, () => null)
}

export function usePublicCanonicalHead(canonicalHref: MaybeRefOrGetter<string>) {
  const canonicalState = usePublicCanonicalState()

  watchEffect(() => {
    canonicalState.value = toValue(canonicalHref)
  })

  onScopeDispose(() => {
    canonicalState.value = null
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: toValue(canonicalHref) }]
  }))
}
