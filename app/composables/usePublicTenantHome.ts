import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Shared composable for fetching the tenant on the home page.
 * Used by both index.vue and useGlobalSchemaOrg.ts to avoid
 * duplicate useAsyncData keys with different handlers.
 */
export function usePublicTenantHome() {
  return useAsyncData<PublicTenantResponse | null>('public-tenant-home', async () => {
    try {
      return await apiFetch<PublicTenantResponse>('/public/tenant', {
        method: 'GET',
        withAuth: false
      })
    } catch {
      return null
    }
  }, { default: () => null })
}
