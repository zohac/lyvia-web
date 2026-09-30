import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { fetchPublicProviderProfile } from '~/features/seo/public-provider-profile.api'

/**
 * Source unique du profil public de coach (clé `public-provider-profile:<slug>`).
 *
 * Même raison d'être que `usePublicTenantHome` : plusieurs consommateurs
 * (`useCoachSchemaOrg`, `CoachPublicPageTemplate`, `usePublicHeaderInit`)
 * appellent `useAsyncData` sur la même clé. Passer par un composable partagé
 * garantit un handler IDENTIQUE (même source), donc pas d'avertissement Nuxt
 * « Incompatible options detected … different handler ».
 */
export function usePublicProviderProfile(slug: string, isPreview = false) {
  return useAsyncData<PublicProviderProfile | null>(
    `public-provider-profile:${slug}${isPreview ? ':preview' : ''}`,
    async () => {
      if (isPreview && import.meta.client) {
        const { useAuth } = await import('~/composables/useAuth')
        await useAuth().bootstrap()
      }
      return await fetchPublicProviderProfile(slug, isPreview)
    },
    { default: () => null, server: !isPreview }
  )
}
