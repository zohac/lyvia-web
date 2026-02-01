// TODO: extract generic useAccountComposable<T>(basePath) to deduplicate with useProviderAccount
import { readonly, ref } from 'vue'
import { apiFetch } from '../../services/api/apiFetch'
import { ApiFetchError } from '../../services/api/api-error'
import type { ClientAccountResponse, UpdateClientAccountRequest } from './api/client-account.contract'

export function useClientAccount() {
  const account = ref<ClientAccountResponse | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAccount(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      account.value = await apiFetch<ClientAccountResponse>('/client/account')
    } catch (e: unknown) {
      error.value = 'Impossible de charger vos informations'
      console.error('[useClientAccount] fetchAccount error:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateAccount(patch: UpdateClientAccountRequest): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      account.value = await apiFetch<ClientAccountResponse>('/client/account', {
        method: 'PATCH',
        body: patch
      })
      return true
    } catch (e: unknown) {
      error.value = e instanceof ApiFetchError
        ? e.apiError.message
        : 'Impossible de sauvegarder vos informations'
      console.error('[useClientAccount] updateAccount error:', e)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    account: readonly(account),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchAccount,
    updateAccount
  }
}
