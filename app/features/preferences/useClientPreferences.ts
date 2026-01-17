import { readonly, ref } from 'vue'
import { apiFetch } from '../../services/api/apiFetch'
import { ApiFetchError } from '../../services/api/api-error'
import type { ClientPreferences, UpdateClientPreferencesRequest } from './api/client-preferences.contract'

export function useClientPreferences() {
  const preferences = ref<ClientPreferences | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchPreferences(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      preferences.value = await apiFetch<ClientPreferences>('/client/preferences')
    } catch (e: unknown) {
      error.value = 'Impossible de charger vos préférences'
      console.error('[useClientPreferences] fetchPreferences error:', e)
    } finally {
      loading.value = false
    }
  }

  async function updatePreferences(patch: UpdateClientPreferencesRequest): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      preferences.value = await apiFetch<ClientPreferences>('/client/preferences', {
        method: 'PATCH',
        body: patch
      })
      return true
    } catch (e: unknown) {
      if (e instanceof ApiFetchError && e.apiError.code === 'PHONE_REQUIRED_FOR_SMS') {
        error.value = 'Un numéro de téléphone est requis pour activer les SMS de suivi'
      } else {
        error.value = 'Impossible de sauvegarder vos préférences'
      }
      console.error('[useClientPreferences] updatePreferences error:', e)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    preferences: readonly(preferences),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchPreferences,
    updatePreferences
  }
}
