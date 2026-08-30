import type { Ref } from 'vue'
import type {
  AvailabilityAppointmentType,
  ProviderProfileIdentityResponse,
  ProviderAvailabilityResponse
} from './api/availability.contract'
import { mapAvailabilityErrorToMessage } from './api/availability-error'
import { groupSlotsByLocalDay } from '../slots/domain/slots'
import { getMyProviderProfileIdentity, listProviderAvailabilitySlots } from './services/provider-availability.service'

type PreviewPeriod = 7 | 30

function buildWindow(days: PreviewPeriod): { from: string, to: string } {
  const from = new Date()
  const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function useAvailabilitySlotsPreview(options: {
  noticeMessage: Ref<string | null>
  actionErrorMessage: Ref<string | null>
}) {
  const { noticeMessage, actionErrorMessage } = options

  const previewType = ref<AvailabilityAppointmentType>('discovery')
  const previewPeriodDays = ref<PreviewPeriod>(7)

  const previewError = ref<string | null>(null)
  const previewPending = ref(false)

  const providerIdentity = ref<ProviderProfileIdentityResponse | null>(null)
  const previewResponse = ref<ProviderAvailabilityResponse | null>(null)

  const timezone = computed(() => providerIdentity.value?.timezone ?? 'Europe/Paris')

  const slotGroups = computed(() => {
    const slots = previewResponse.value?.slots ?? []
    return groupSlotsByLocalDay(slots, timezone.value)
  })

  const hasSlots = computed(() => slotGroups.value.some(group => group.slots.length > 0))

  async function ensureProviderIdentity(): Promise<ProviderProfileIdentityResponse> {
    if (providerIdentity.value) return providerIdentity.value
    const identity = await getMyProviderProfileIdentity()
    providerIdentity.value = identity
    return identity
  }

  async function refreshSlotsPreview(): Promise<void> {
    if (import.meta.server) return

    noticeMessage.value = null
    actionErrorMessage.value = null
    previewError.value = null

    if (previewPending.value) return

    previewPending.value = true
    try {
      await ensureProviderIdentity()
      const window = buildWindow(previewPeriodDays.value)

      previewResponse.value = await listProviderAvailabilitySlots({
        type: previewType.value,
        from: window.from,
        to: window.to,
        limit: 200
      })
    } catch (err: unknown) {
      previewResponse.value = null
      previewError.value = mapAvailabilityErrorToMessage(err, 'Impossible de charger l’aperçu des créneaux. Veuillez réessayer.')
    } finally {
      previewPending.value = false
    }
  }

  watch([previewType, previewPeriodDays], () => {
    void refreshSlotsPreview()
  })

  onMounted(() => {
    void refreshSlotsPreview()
  })

  return {
    previewType,
    previewPeriodDays,
    previewError,
    previewPending,
    timezone,
    slotGroups,
    hasSlots,
    refreshSlotsPreview
  }
}
