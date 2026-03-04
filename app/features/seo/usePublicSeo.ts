import type { PublicSeoResponse } from './api/seo.contract'
import { apiFetch } from '../../services/api/apiFetch'

export function usePublicSeo(targetType: string, targetId: MaybeRefOrGetter<string | undefined>) {
  const slug = useRoute().params.slug as string | undefined
  const { data: seo, pending, error } = useAsyncData(
    `seo-${targetType}-${slug ?? ''}-${toValue(targetId) ?? ''}`,
    async () => {
      const id = toValue(targetId)
      if (!id) return null
      try {
        return await apiFetch<PublicSeoResponse>('/public/seo', {
          withAuth: false,
          query: { targetType, targetId: id }
        })
      } catch {
        return null
      }
    },
    { watch: [() => toValue(targetId)] }
  )

  return { seo: readonly(seo), pending: readonly(pending), error: readonly(error) }
}
