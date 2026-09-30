import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Fetch du profil public enrichi d'une coach (`GET /public/provider/:slug/profile`).
 *
 * Extrait de `useCoachSchemaOrg.ts` pour être partagé par `usePublicProviderProfile`
 * (composable `useAsyncData`) sans créer d'import circulaire. Ne lève jamais :
 * un profil introuvable rend `null`.
 */
export async function fetchPublicProviderProfile(
  slug: string,
  isPreview = false
): Promise<PublicProviderProfile | null> {
  try {
    return await apiFetch<PublicProviderProfile>(`/public/provider/${slug}/profile`, {
      method: 'GET',
      query: isPreview ? { preview: 'true' } : undefined,
      withAuth: isPreview
    })
  } catch {
    return null
  }
}
