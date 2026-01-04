import type { CheckoutStatus, GetCheckoutStatusResponse } from './api/consultation.contract'
import { getCheckoutStatus } from './services/client-consultation.service'

export type CheckoutPollingState = {
  status: CheckoutStatus | 'timeout'
  attempt: number
  lastResponse: GetCheckoutStatusResponse | null
  errorMessage: string | null
  isPolling: boolean
}

type PollingOptions = {
  intervalMs?: number
  maxAttempts?: number
}

export function useConsultationCheckoutStatus(sessionId: Ref<string | null>, options: PollingOptions = {}) {
  const intervalMs = options.intervalMs ?? 2000
  const maxAttempts = options.maxAttempts ?? 10

  const state = reactive({
    status: 'pending_confirmation',
    attempt: 0,
    lastResponse: null,
    errorMessage: null,
    isPolling: false
  } as CheckoutPollingState)

  let stopped = false
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
  }

  function stop() {
    stopped = true
    clearTimer()
    state.isPolling = false
  }

  async function pollOnce(): Promise<CheckoutStatus | null> {
    const id = sessionId.value
    if (!id) return null

    try {
      const response = await getCheckoutStatus(id)
      state.lastResponse = response
      state.errorMessage = null
      state.status = response.status
      return response.status
    } catch {
      state.errorMessage = 'Impossible de vérifier le paiement pour le moment.'
      return null
    }
  }

  async function start() {
    if (!sessionId.value) return
    if (state.isPolling) return

    stopped = false
    clearTimer()

    state.isPolling = true
    state.errorMessage = null
    state.attempt = 0
    state.status = 'pending_confirmation'
    state.lastResponse = null

    while (!stopped && state.attempt < maxAttempts) {
      state.attempt += 1
      const status = await pollOnce()

      if (status === 'confirmed' || status === 'failed') {
        state.isPolling = false
        return
      }

      await new Promise<void>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(), intervalMs)
      })
    }

    if (!stopped && state.status === 'pending_confirmation') {
      state.status = 'timeout'
    }
    state.isPolling = false
  }

  onBeforeUnmount(() => stop())

  return {
    state,
    start,
    stop
  }
}
