import { ref, computed } from 'vue'
import type {
  ClientAppointmentItem,
  ListClientAppointmentsQuery
} from './api/client-appointments.contract'
import { listClientAppointments } from './services/client-consultation.service'

/**
 * Composable for fetching and managing client appointments list.
 *
 * Provides filtered access to discovery calls and consultations.
 */
export async function useClientAppointments(query?: ListClientAppointmentsQuery) {
  const pending = ref(true)
  const errorMessage = ref<string | null>(null)
  const appointments = ref<ClientAppointmentItem[]>([])

  async function fetch() {
    pending.value = true
    errorMessage.value = null

    try {
      const response = await listClientAppointments(query)
      appointments.value = response.items
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors du chargement'
    } finally {
      pending.value = false
    }
  }

  // Initial fetch
  await fetch()

  // Partition appointments into upcoming and past
  const upcoming = computed(() =>
    appointments.value
      .filter(a => a.status === 'scheduled' && new Date(a.scheduledAt) >= new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  )

  const past = computed(() =>
    appointments.value
      .filter(a => a.status !== 'scheduled' || new Date(a.scheduledAt) < new Date())
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  )

  // Count by status
  const scheduledCount = computed(() =>
    appointments.value.filter(a => a.status === 'scheduled').length
  )

  const completedCount = computed(() =>
    appointments.value.filter(a => a.status === 'completed').length
  )

  const cancelledCount = computed(() =>
    appointments.value.filter(a => a.status === 'cancelled').length
  )

  return {
    pending,
    errorMessage,
    appointments,
    upcoming,
    past,
    scheduledCount,
    completedCount,
    cancelledCount,
    refresh: fetch
  }
}
