import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'

/**
 * Source unique du tenant d'une coach identifiée par slug
 * (clé `public-tenant:<slug>`), appelée par la page coach et par
 * `usePublicHeaderInit`. Le handler est partagé → aucun avertissement Nuxt de
 * handler divergent, et la donnée semée avant le rendu du layout est réutilisée
 * par la page (pas de double requête).
 *
 * Un tenant introuvable lève un 404 « Coach introuvable », comme la page.
 */
export function usePublicTenant(slug: string, isPreview = false) {
  return useAsyncData<PublicTenantResponse>(
    `public-tenant:${slug}${isPreview ? ':preview' : ''}`,
    async () => {
      if (isPreview && import.meta.client) {
        const { useAuth } = await import('~/composables/useAuth')
        await useAuth().bootstrap()
      }
      try {
        return await apiFetch<PublicTenantResponse>('/public/tenant', {
          method: 'GET',
          withAuth: isPreview,
          query: {
            slug,
            ...(isPreview ? { preview: 'true' } : {})
          }
        })
      } catch (err: unknown) {
        if (err instanceof ApiFetchError && err.apiError.code === 'TENANT_NOT_FOUND') {
          throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
        }
        throw err
      }
    },
    { server: !isPreview }
  )
}
