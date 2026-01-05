import type {
  CancelProviderAppointmentRequest,
  CancelProviderAppointmentResponse,
  CreateProviderManualAppointmentRequest,
  CreateProviderManualAppointmentResponse,
  ListProviderAppointmentsResponse,
  ProviderCalendarAppointmentStatus,
  ProviderCalendarAppointmentType,
  ProviderAppointmentListItem,
  UpdateProviderAppointmentRequest,
  UpdateProviderAppointmentResponse
} from './api/calendar.contract'
import { extractFieldErrorsFromDetails, mapCalendarErrorToMessage } from './api/calendar-error'
import { groupAppointmentsByLocalDay, sortAppointmentsByStartAt } from './domain/appointments'
import type { CalendarViewMode } from './domain/range'
import { buildCalendarRange, shiftAnchorDate } from './domain/range'
import {
  cancelProviderAppointment,
  createProviderManualAppointment,
  listProviderAppointments,
  updateProviderAppointment
} from './services/provider-calendar.service'
import { createUuidV4 } from '../../utils/uuid'
import { useAuthState } from '../auth/state/auth.state'
import { ApiFetchError } from '../../services/api/api-error'
import { listMyConsultationPricePlans } from '../pricing/services/provider-consultation-pricing.service'
import type { ConsultationPricePlan, ListConsultationPricePlansResponse } from '../consultation/api/consultation.contract'

type CalendarFilters = {
  type?: ProviderCalendarAppointmentType
  status?: ProviderCalendarAppointmentStatus
}

type CacheEntry = {
  data: ListProviderAppointmentsResponse
  fetchedAt: number
}

type PricingCacheEntry = {
  data: ListConsultationPricePlansResponse
  fetchedAt: number
}

function normalizeCacheKey(value: string): string {
  return value.replace(/\s+/g, '')
}

function buildCacheKey(input: {
  providerActorId: string
  from: string
  to: string
  filters: CalendarFilters
}): string {
  const parts = [
    input.providerActorId,
    input.from,
    input.to,
    input.filters.type ?? 'all',
    input.filters.status ?? 'all'
  ]
  return normalizeCacheKey(parts.join('|'))
}

function getDefaultTimeZone(): string {
  return 'Europe/Paris'
}

export async function useProviderCalendar() {
  const auth = useAuthState()
  const providerActorId = computed(() => auth.value.user?.id ?? 'anonymous')

  const view = ref<CalendarViewMode>('week')
  const anchorDate = ref<Date>(new Date())
  const filters = ref<CalendarFilters>({})

  const timeZone = ref<string>(getDefaultTimeZone())

  const range = computed(() => buildCalendarRange({ anchorDate: anchorDate.value, view: view.value, timeZone: timeZone.value }))

  const cache = useState<Record<string, CacheEntry>>('__lyvia_provider_calendar_swr__', () => ({}))
  const data = ref<ListProviderAppointmentsResponse | null>(null)

  const pricingCache = useState<Record<string, PricingCacheEntry>>('__lyvia_provider_consultation_pricing_swr__', () => ({}))
  const consultationPricePlansById = ref<Record<string, ConsultationPricePlan>>({})

  const pending = ref(false)
  const errorMessage = ref<string | null>(null)

  const actionPending = ref(false)
  const actionErrorMessage = ref<string | null>(null)
  const actionFieldErrors = ref<Record<string, string>>({})

  const currentRequestId = ref<symbol | null>(null)
  const abortController = shallowRef<AbortController | null>(null)

  const sortedAppointments = computed<ProviderAppointmentListItem[]>(() => {
    if (!data.value) return []
    return sortAppointmentsByStartAt(data.value.appointments)
  })

  const appointmentsByDay = computed(() => groupAppointmentsByLocalDay(sortedAppointments.value, timeZone.value))

  function setView(next: CalendarViewMode) {
    view.value = next
  }

  function setAnchorDate(next: Date) {
    anchorDate.value = next
  }

  function setFilters(next: CalendarFilters) {
    filters.value = { ...next }
  }

  function abortPendingRequest() {
    abortController.value?.abort()
    abortController.value = null
    currentRequestId.value = null
  }

  function clearActionErrors() {
    actionErrorMessage.value = null
    actionFieldErrors.value = {}
  }

  function goToday() {
    anchorDate.value = new Date()
  }

  function goPrev() {
    anchorDate.value = shiftAnchorDate(anchorDate.value, { view: view.value, direction: -1, timeZone: timeZone.value })
  }

  function goNext() {
    anchorDate.value = shiftAnchorDate(anchorDate.value, { view: view.value, direction: 1, timeZone: timeZone.value })
  }

  function buildConsultationPricePlanById(response: ListConsultationPricePlansResponse | null): Record<string, ConsultationPricePlan> {
    if (!response) return {}
    const output: Record<string, ConsultationPricePlan> = {}
    for (const plan of response.plans) {
      output[plan.id] = plan
    }
    return output
  }

  async function refreshConsultationPricing(options: { revalidate?: boolean } = {}): Promise<void> {
    const actorId = providerActorId.value
    if (!actorId || actorId === 'anonymous') {
      consultationPricePlansById.value = {}
      return
    }

    const cached = pricingCache.value[actorId]
    if (cached && !options.revalidate) {
      consultationPricePlansById.value = buildConsultationPricePlanById(cached.data)
      return
    }

    if (cached) {
      consultationPricePlansById.value = buildConsultationPricePlanById(cached.data)
    }

    try {
      const response = await listMyConsultationPricePlans()
      pricingCache.value[actorId] = { data: response, fetchedAt: Date.now() }
      consultationPricePlansById.value = buildConsultationPricePlanById(response)
    } catch {
      consultationPricePlansById.value = {}
    }
  }

  async function refresh(options: { revalidate?: boolean } = {}): Promise<void> {
    const key = buildCacheKey({
      providerActorId: providerActorId.value,
      from: range.value.from,
      to: range.value.to,
      filters: filters.value
    })

    const cached = cache.value[key]
    if (cached && !options.revalidate) {
      data.value = cached.data
      timeZone.value = cached.data.timezone || timeZone.value
      errorMessage.value = null
      pending.value = false
      return
    }

    if (cached) {
      data.value = cached.data
      timeZone.value = cached.data.timezone || timeZone.value
    }

    abortPendingRequest()
    const requestId = Symbol('provider-calendar')
    currentRequestId.value = requestId

    const controller = new AbortController()
    abortController.value = controller

    pending.value = true
    errorMessage.value = null

    try {
      const response = await listProviderAppointments(
        {
          from: range.value.from,
          to: range.value.to,
          type: filters.value.type,
          status: filters.value.status
        },
        { signal: controller.signal }
      )

      if (currentRequestId.value !== requestId) return

      cache.value[key] = { data: response, fetchedAt: Date.now() }
      data.value = response
      timeZone.value = response.timezone || timeZone.value
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      if (currentRequestId.value !== requestId) return
      errorMessage.value = mapCalendarErrorToMessage(err)
    } finally {
      if (currentRequestId.value === requestId) {
        pending.value = false
        abortController.value = null
        currentRequestId.value = null
      }
    }
  }

  async function createAppointment(
    input: CreateProviderManualAppointmentRequest,
    options: { idempotencyKey?: string } = {}
  ): Promise<
    | { ok: true, response: CreateProviderManualAppointmentResponse }
    | { ok: false, kind: 'validation' | 'overlap' | 'unknown', message: string }
  > {
    clearActionErrors()
    actionPending.value = true
    try {
      const idempotencyKey = options.idempotencyKey ?? createUuidV4()
      const response = await createProviderManualAppointment({
        idempotencyKey,
        body: input
      })
      await refresh({ revalidate: true })
      return { ok: true, response }
    } catch (err: unknown) {
      const message = mapCalendarErrorToMessage(err)
      actionErrorMessage.value = message

      if (err instanceof ApiFetchError) {
        actionFieldErrors.value = extractFieldErrorsFromDetails(err.apiError.details)

        if (err.apiError.statusCode === 409 && err.apiError.code === 'APPOINTMENT_OVERLAP') {
          await refresh({ revalidate: true })
          return { ok: false, kind: 'overlap', message }
        }

        if (err.apiError.statusCode === 422 || err.apiError.code === 'VALIDATION_ERROR') {
          // Refresh pricing if PRICE_PLAN_INACTIVE error
          if (err.apiError.code === 'PRICE_PLAN_INACTIVE') {
            await refreshConsultationPricing({ revalidate: true })
          }
          return { ok: false, kind: 'validation', message }
        }
      }

      return { ok: false, kind: 'unknown', message }
    } finally {
      actionPending.value = false
    }
  }

  async function updateAppointment(
    appointmentId: ProviderAppointmentListItem['id'],
    input: UpdateProviderAppointmentRequest
  ): Promise<
    | { ok: true, response: UpdateProviderAppointmentResponse }
    | { ok: false, kind: 'validation' | 'overlap' | 'forbidden' | 'unknown', message: string }
  > {
    clearActionErrors()
    actionPending.value = true
    try {
      const response = await updateProviderAppointment(appointmentId, input)
      await refresh({ revalidate: true })
      return { ok: true, response }
    } catch (err: unknown) {
      const message = mapCalendarErrorToMessage(err)
      actionErrorMessage.value = message

      if (err instanceof ApiFetchError) {
        actionFieldErrors.value = extractFieldErrorsFromDetails(err.apiError.details)

        if (err.apiError.statusCode === 403) {
          return { ok: false, kind: 'forbidden', message }
        }

        if (err.apiError.statusCode === 409 && err.apiError.code === 'APPOINTMENT_OVERLAP') {
          await refresh({ revalidate: true })
          return { ok: false, kind: 'overlap', message }
        }

        if (err.apiError.statusCode === 422 || err.apiError.code === 'VALIDATION_ERROR') {
          return { ok: false, kind: 'validation', message }
        }
      }
      return { ok: false, kind: 'unknown', message }
    } finally {
      actionPending.value = false
    }
  }

  async function cancelAppointment(input: {
    appointmentId: ProviderAppointmentListItem['id']
    body: CancelProviderAppointmentRequest
  }): Promise<
    | { ok: true, response: CancelProviderAppointmentResponse }
    | { ok: false, kind: 'validation' | 'forbidden' | 'unknown', message: string }
  > {
    clearActionErrors()
    actionPending.value = true
    try {
      const response = await cancelProviderAppointment({
        appointmentId: input.appointmentId,
        idempotencyKey: createUuidV4(),
        body: input.body
      })
      await refresh({ revalidate: true })
      return { ok: true, response }
    } catch (err: unknown) {
      const message = mapCalendarErrorToMessage(err)
      actionErrorMessage.value = message

      if (err instanceof ApiFetchError) {
        actionFieldErrors.value = extractFieldErrorsFromDetails(err.apiError.details)

        if (err.apiError.statusCode === 403) {
          return { ok: false, kind: 'forbidden', message }
        }

        if (err.apiError.statusCode === 422 || err.apiError.code === 'VALIDATION_ERROR') {
          return { ok: false, kind: 'validation', message }
        }
      }
      return { ok: false, kind: 'unknown', message }
    } finally {
      actionPending.value = false
    }
  }

  watch(
    [() => providerActorId.value, () => range.value.from, () => range.value.to, () => filters.value.type, () => filters.value.status],
    () => {
      void refresh({ revalidate: true })
    },
    { immediate: true }
  )

  watch(
    () => providerActorId.value,
    () => {
      void refreshConsultationPricing({ revalidate: true })
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    abortPendingRequest()
  })

  return {
    view,
    anchorDate,
    range,
    filters,

    timeZone,
    data,
    pending,
    errorMessage,
    actionPending,
    actionErrorMessage,
    actionFieldErrors,

    sortedAppointments,
    appointmentsByDay,
    consultationPricePlansById,

    setView,
    setAnchorDate,
    setFilters,
    refresh,
    refreshConsultationPricing,
    clearActionErrors,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    goToday,
    goPrev,
    goNext
  }
}
