import type { Ref } from 'vue'
import { ApiFetchError } from '../../services/api/api-error'
import type { AvailabilityAppointmentType, AvailabilityRule } from './api/availability.contract'
import { mapAvailabilityErrorToMessage } from './api/availability-error'
import { buildRuleKey } from './domain/rules'
import { buildCopyRulePayloads, buildCopyRulesPlan } from './domain/copy'
import { createAvailabilityRule } from './services/provider-availability.service'

export type CopyRulesDirection = 'discovery-to-consultation' | 'consultation-to-discovery'

type DurationByType = Record<AvailabilityAppointmentType, number>

function getCopySourceAndTarget(direction: CopyRulesDirection): {
  source: AvailabilityAppointmentType
  target: AvailabilityAppointmentType
} {
  if (direction === 'consultation-to-discovery') return { source: 'consultation', target: 'discovery' }
  return { source: 'discovery', target: 'consultation' }
}

export function useAvailabilityRulesCopy(options: {
  rules: Ref<AvailabilityRule[]>
  pending: Ref<boolean>
  refresh: () => Promise<void>
  noticeMessage: Ref<string | null>
  actionErrorMessage: Ref<string | null>
}) {
  const { rules, pending, refresh, noticeMessage, actionErrorMessage } = options

  const copyRulesModalOpen = ref(false)
  const copyRulesError = ref<string | null>(null)
  const isCopyingRules = ref(false)
  const copyRulesDirection = ref<CopyRulesDirection>('discovery-to-consultation')
  const copyRulesAdaptDurations = ref(false)

  watch(copyRulesModalOpen, (open) => {
    if (!open) copyRulesError.value = null
  })

  function openCopyRulesModal(direction?: CopyRulesDirection) {
    copyRulesError.value = null
    copyRulesAdaptDurations.value = false
    if (direction) copyRulesDirection.value = direction
    copyRulesModalOpen.value = true
  }

  const copyRulesSummary = computed(() => {
    const { source, target } = getCopySourceAndTarget(copyRulesDirection.value)
    return buildCopyRulesPlan(rules.value, source, target)
  })

  async function confirmCopyRules() {
    noticeMessage.value = null
    actionErrorMessage.value = null
    copyRulesError.value = null

    if (isCopyingRules.value) return
    if (pending.value) return

    const { source, target } = getCopySourceAndTarget(copyRulesDirection.value)
    const sourceRules = rules.value.filter(rule => rule.appointmentType === source)
    if (sourceRules.length === 0) {
      copyRulesError.value = 'Aucune règle à copier dans le type source.'
      return
    }

    const recommendedDurations: DurationByType = { discovery: 30, consultation: 60 }

    const targetKeys = new Set(
      rules.value
        .filter(rule => rule.appointmentType === target)
        .map(buildRuleKey)
    )

    const payloads = buildCopyRulePayloads({
      allRules: rules.value,
      sourceType: source,
      targetType: target,
      adaptDurations: copyRulesAdaptDurations.value,
      recommendedDurations
    })

    isCopyingRules.value = true
    try {
      let created = 0
      let skippedAlready = 0
      let skippedOverlap = 0
      let failed = 0

      for (const item of payloads) {
        if (targetKeys.has(item.key)) {
          skippedAlready += 1
          continue
        }

        try {
          await createAvailabilityRule(item.body)
          created += 1
          targetKeys.add(item.key)
        } catch (err: unknown) {
          if (err instanceof ApiFetchError && err.apiError.code === 'RULE_OVERLAP') {
            skippedOverlap += 1
            continue
          }
          failed += 1
        }
      }

      await refresh()
      copyRulesModalOpen.value = false

      const parts: string[] = []
      parts.push(`${created} copiée(s)`)
      if (skippedAlready) parts.push(`${skippedAlready} déjà présente(s)`)
      if (skippedOverlap) parts.push(`${skippedOverlap} chevauchement(s) ignoré(s)`)
      if (failed) parts.push(`${failed} en échec`)
      noticeMessage.value = `Copie terminée (${source === 'consultation' ? 'Consultation' : 'Discovery'} → ${target === 'consultation' ? 'Consultation' : 'Discovery'}) : ${parts.join(', ')}.`
    } catch (err: unknown) {
      copyRulesError.value = mapAvailabilityErrorToMessage(err, 'Impossible de copier les règles. Veuillez réessayer.')
    } finally {
      isCopyingRules.value = false
    }
  }

  return {
    copyRulesModalOpen,
    copyRulesError,
    isCopyingRules,
    copyRulesDirection,
    copyRulesAdaptDurations,
    copyRulesSummary,
    openCopyRulesModal,
    confirmCopyRules
  }
}
