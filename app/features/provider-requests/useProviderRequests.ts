/**
 * Composable for managing provider appointment requests (US-6).
 *
 * Provides:
 * - List of requests with status filter
 * - Pending count for badge
 * - Accept/reject actions
 */

import type {
  ProviderRequestItem,
  ProviderRequestStatusFilter,
  AcceptCancellationResponse,
  AcceptRescheduleResponse,
  RejectRequestResponse
} from './api/provider-requests.contract'
import {
  listProviderRequests,
  acceptCancellationRequest,
  acceptRescheduleRequest,
  rejectRequest
} from './services/provider-requests.service'

/**
 * Map API error codes to user-friendly messages
 */
function mapErrorToMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { code?: string, details?: { currentStatus?: string } } }).data
    switch (data?.code) {
      case 'REQUEST_NOT_FOUND':
        return 'Cette demande n\'existe plus.'
      case 'REQUEST_NOT_OWNED':
        return 'Vous n\'êtes pas autorisé à traiter cette demande.'
      case 'REQUEST_ALREADY_PROCESSED':
        return `Cette demande a déjà été ${data.details?.currentStatus === 'accepted' ? 'acceptée' : 'refusée'}.`
      case 'NEW_SCHEDULED_AT_REQUIRED':
        return 'Veuillez sélectionner une nouvelle date pour le report.'
      case 'SLOT_NOT_AVAILABLE':
        return 'Ce créneau n\'est pas disponible. Veuillez en choisir un autre.'
      default:
        break
    }
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export function useProviderRequests() {
  const requests = ref<ProviderRequestItem[]>([])
  const pendingCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentStatus = ref<ProviderRequestStatusFilter>('pending')

  /**
   * Fetch requests with status filter
   */
  async function fetchRequests(status: ProviderRequestStatusFilter = 'pending') {
    loading.value = true
    error.value = null
    currentStatus.value = status

    try {
      const response = await listProviderRequests(status)
      requests.value = response.requests
      pendingCount.value = response.meta.pending
    } catch (err) {
      error.value = mapErrorToMessage(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh with current status filter
   */
  async function refresh() {
    await fetchRequests(currentStatus.value)
  }

  // Actions state
  const processing = ref(false)
  const actionError = ref<string | null>(null)

  /**
   * Accept a cancellation request
   */
  async function acceptCancellation(
    requestId: string,
    providerNote?: string | null
  ): Promise<AcceptCancellationResponse | null> {
    processing.value = true
    actionError.value = null

    try {
      const result = await acceptCancellationRequest(requestId, providerNote)
      return result
    } catch (err) {
      actionError.value = mapErrorToMessage(err)
      return null
    } finally {
      processing.value = false
    }
  }

  /**
   * Accept a reschedule request with new date
   */
  async function acceptReschedule(
    requestId: string,
    newScheduledAt: string,
    providerNote?: string | null
  ): Promise<AcceptRescheduleResponse | null> {
    processing.value = true
    actionError.value = null

    try {
      const result = await acceptRescheduleRequest(requestId, newScheduledAt, providerNote)
      return result
    } catch (err) {
      actionError.value = mapErrorToMessage(err)
      return null
    } finally {
      processing.value = false
    }
  }

  /**
   * Reject a request
   */
  async function reject(
    requestId: string,
    providerNote?: string | null
  ): Promise<RejectRequestResponse | null> {
    processing.value = true
    actionError.value = null

    try {
      const result = await rejectRequest(requestId, providerNote)
      return result
    } catch (err) {
      actionError.value = mapErrorToMessage(err)
      return null
    } finally {
      processing.value = false
    }
  }

  return {
    // List state
    requests,
    pendingCount,
    loading,
    error,
    currentStatus,

    // List actions
    fetchRequests,
    refresh,

    // Process state
    processing,
    actionError,

    // Process actions
    acceptCancellation,
    acceptReschedule,
    reject
  }
}
