import { readonly, ref } from 'vue'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderAccountResponse, UpdateProviderAccountRequest } from './api/provider-account.contract'

export type UpdateProviderAccountResult
  = | { ok: true, data: ProviderAccountResponse }
    | { ok: false, errorCode?: string }

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

  async function updateAccountDetailed(patch: UpdateProviderAccountRequest): Promise<UpdateProviderAccountResult> {
    saving.value = true
    error.value = null

    try {
      const result = await apiFetch<ProviderAccountResponse>('/provider/account', {
        method: 'PATCH',
        body: patch
      })
      account.value = result
      return { ok: true, data: result }
    } catch (e: unknown) {
      error.value = 'Impossible de sauvegarder vos informations'
      console.error('[useProviderAccount] updateAccount error:', e)
      return {
        ok: false,
        errorCode: e instanceof ApiFetchError ? e.apiError.code : undefined
      }
    } finally {
      saving.value = false
    }
  }

  async function updateAccount(patch: UpdateProviderAccountRequest): Promise<boolean> {
    const result = await updateAccountDetailed(patch)
    return result.ok
  }

  return {
    account: readonly(account),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchAccount,
    updateAccountDetailed,
    updateAccount
  }
}
