import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Tenant résolu par Host (sans slug), pour la page booking white-label
 * `/onboarding/discovery`. Source unique partagée entre la page et le layout
 * `focus`, qui seme la donnée AVANT le rendu du footer (`LegalFooterLinks`
 * décide de l'affichage du lien praticienne d'après ce tenant).
 */
export function usePublicTenantDiscovery() {
  return useAsyncData<PublicTenantResponse | null>(
    'public-tenant-discovery',
    async () => {
      try {
        return await apiFetch<PublicTenantResponse>('/public/tenant', {
          method: 'GET',
          withAuth: false
        })
      } catch {
        return null
      }
    },
    { default: () => null }
  )
}
