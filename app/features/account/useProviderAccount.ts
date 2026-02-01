import { readonly, ref } from 'vue'
import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderAccountResponse, UpdateProviderAccountRequest } from './api/provider-account.contract'

export function useProviderAccount() {
  const account = ref<ProviderAccountResponse | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAccount(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      account.value = await apiFetch<ProviderAccountResponse>('/provider/account')
    } catch (e: unknown) {
      error.value = 'Impossible de charger vos informations'
      console.error('[useProviderAccount] fetchAccount error:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateAccount(patch: UpdateProviderAccountRequest): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      account.value = await apiFetch<ProviderAccountResponse>('/provider/account', {
        method: 'PATCH',
        body: patch
      })
      return true
    } catch (e: unknown) {
      error.value = 'Impossible de sauvegarder vos informations'
      console.error('[useProviderAccount] updateAccount error:', e)
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
