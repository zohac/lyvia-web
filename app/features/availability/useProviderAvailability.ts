import type { AvailabilityBlock } from './api/availability.contract'
import { formatBlockReason } from './domain/blocks'
import { normalizeRuleTime } from './domain/time'
import { useAvailabilityBlocksActions } from './useAvailabilityBlocksActions'
import { useAvailabilityData } from './useAvailabilityData'
import { useAvailabilityRulesActions } from './useAvailabilityRulesActions'
import { useAvailabilityRulesCopy } from './useAvailabilityRulesCopy'
import { useAvailabilitySlotsPreview } from './useAvailabilitySlotsPreview'

function weekdayLabel(weekday: number): string {
  const labels: Record<number, string> = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  }
  return labels[weekday] ?? `Jour ${weekday}`
}

function appointmentTypeLabel(type: 'discovery' | 'consultation'): string {
  return type === 'consultation' ? 'Consultation' : 'Discovery'
}

function blockTypeLabel(block: AvailabilityBlock): string {
  switch (block.blockType) {
    case 'all':
      return 'Tout'
    case 'consultation':
      return 'Consultation'
    case 'discovery':
      return 'Discovery'
    default:
      return block.blockType
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export async function useProviderAvailability() {
  const errorMessage = ref<string | null>(null)
  const actionErrorMessage = ref<string | null>(null)
  const noticeMessage = ref<string | null>(null)

  const data = await useAvailabilityData({
    errorMessage,
    actionErrorMessage,
    noticeMessage
  })

  const ruleActions = useAvailabilityRulesActions({
    refresh: data.refresh,
    noticeMessage,
    actionErrorMessage
  })

  const ruleCopy = useAvailabilityRulesCopy({
    rules: data.rules,
    pending: data.pending,
    refresh: data.refresh,
    noticeMessage,
    actionErrorMessage
  })

  const blockActions = useAvailabilityBlocksActions({
    refresh: data.refresh,
    noticeMessage,
    actionErrorMessage
  })

  const slotsPreview = useAvailabilitySlotsPreview({
    noticeMessage,
    actionErrorMessage
  })

  return {
    errorMessage,
    actionErrorMessage,
    noticeMessage,

    ...data,

    weekdayLabel,
    appointmentTypeLabel,
    blockTypeLabel,
    formatDateTime,
    formatBlockReason,
    normalizeRuleTime,

    ...ruleActions,
    ...ruleCopy,
    ...blockActions,
    ...slotsPreview
  }
}
