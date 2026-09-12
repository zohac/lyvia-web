import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Shared composable for fetching the tenant on the home page.
 * Used by both index.vue and useGlobalSchemaOrg.ts to avoid
 * duplicate useAsyncData keys with different handlers.
 */
export function usePublicTenantHome() {
  const route = useRoute()
  const isPreview = route?.query?.preview === 'true' || route?.query?.preview === '1'

  return useAsyncData<PublicTenantResponse | null>('public-tenant-home' + (isPreview ? ':preview' : ''), async () => {
    if (isPreview && import.meta.client) {
      const { useAuth } = await import('~/composables/useAuth')
      await useAuth().bootstrap()
    }
    try {
      return await apiFetch<PublicTenantResponse>('/public/tenant', {
        method: 'GET',
        query: isPreview ? { preview: 'true' } : undefined,
        withAuth: isPreview
      })
    } catch {
      return null
    }
  }, { default: () => null, server: !isPreview })
}
