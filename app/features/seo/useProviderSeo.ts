import { readonly, ref } from 'vue'
import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderSeoEntry, UpsertProviderSeoRequest } from './api/provider-seo.contract'

export function useProviderSeo() {
  const entries = ref<ProviderSeoEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchSeo(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      entries.value = await apiFetch<ProviderSeoEntry[]>('/provider/seo')
    } catch (e: unknown) {
      error.value = 'Impossible de charger la configuration SEO'
      console.error('[useProviderSeo] fetchSeo error:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateSeo(
    targetType: 'coach_profile' | 'coach_booking',
    patch: UpsertProviderSeoRequest
  ): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      await apiFetch(`/provider/seo/${targetType}`, { method: 'PUT', body: patch })
      await fetchSeo()
      return true
    } catch (e: unknown) {
      error.value = 'Impossible de sauvegarder'
      console.error('[useProviderSeo] updateSeo error:', e)
      return false
    } finally {
      saving.value = false
    }
  }

  function getEntry(targetType: 'coach_profile' | 'coach_booking'): ProviderSeoEntry | undefined {
    return entries.value.find(e => e.targetType === targetType)
  }

  return {
    entries: readonly(entries),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchSeo,
    updateSeo,
    getEntry
  }
}
