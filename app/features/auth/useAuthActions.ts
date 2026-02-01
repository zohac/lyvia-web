import { ref } from 'vue'
import { apiFetch } from '../../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../../services/api/api-error'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  RequestEmailChangeRequest,
  RequestEmailChangeResponse
} from './api/auth.contract'

type ActionResult = { success: true } | { success: false, errorMessage: string }

export function useAuthActions() {
  const changingPassword = ref(false)
  const requestingEmailChange = ref(false)

  async function changePassword(input: ChangePasswordRequest): Promise<ActionResult> {
    changingPassword.value = true
    try {
      await apiFetch<ChangePasswordResponse>('/auth/change-password', {
        method: 'POST',
        body: input
      })
      return { success: true }
    } catch (e: unknown) {
      const message = e instanceof ApiFetchError
        ? mapAuthErrorCodeToUserMessage(e.apiError.code)
        : 'Une erreur est survenue. Veuillez réessayer.'
      return { success: false, errorMessage: message }
    } finally {
      changingPassword.value = false
    }
  }

  async function requestEmailChange(input: RequestEmailChangeRequest): Promise<ActionResult> {
    requestingEmailChange.value = true
    try {
      await apiFetch<RequestEmailChangeResponse>('/auth/request-email-change', {
        method: 'POST',
        body: input
      })
      return { success: true }
    } catch (e: unknown) {
      const message = e instanceof ApiFetchError
        ? mapAuthErrorCodeToUserMessage(e.apiError.code)
        : 'Une erreur est survenue. Veuillez réessayer.'
      return { success: false, errorMessage: message }
    } finally {
      requestingEmailChange.value = false
    }
  }

  return {
    changingPassword: readonly(changingPassword),
    requestingEmailChange: readonly(requestingEmailChange),
    changePassword,
    requestEmailChange
  }
}
