import type { Ref } from 'vue'
import { mapAvailabilityErrorToMessage } from './api/availability-error'
import { sortBlocksByStartAt } from './domain/blocks'
import { groupRulesByWeekdayAndType } from './domain/rules'
import {
  listAvailabilityBlocks,
  listAvailabilityRules
} from './services/provider-availability.service'

export async function useAvailabilityData(options: {
  errorMessage: Ref<string | null>
  actionErrorMessage: Ref<string | null>
  noticeMessage: Ref<string | null>
}) {
  const { errorMessage, actionErrorMessage, noticeMessage } = options

  const { data, pending, refresh } = await useAsyncData(
    'provider-availability-skeleton',
    async () => {
      errorMessage.value = null
      actionErrorMessage.value = null
      noticeMessage.value = null

      try {
        const [rulesResponse, blocksResponse] = await Promise.all([
          listAvailabilityRules(),
          listAvailabilityBlocks()
        ])
        return { rules: rulesResponse.rules, blocks: blocksResponse.blocks }
      } catch (err: unknown) {
        errorMessage.value = mapAvailabilityErrorToMessage(
          err,
          'Impossible de charger vos disponibilités. Veuillez réessayer.'
        )
        return { rules: [], blocks: [] }
      }
    },
    { default: () => ({ rules: [], blocks: [] }) }
  )

  const rules = computed(() => data.value.rules)
  const blocks = computed(() => data.value.blocks)

  const hasRules = computed(() => rules.value.length > 0)
  const hasBlocks = computed(() => blocks.value.length > 0)

  const groupedRules = computed(() => groupRulesByWeekdayAndType(rules.value))

  const sortedBlocks = computed(() => sortBlocksByStartAt(blocks.value))

  const upcomingBlocks = computed(() => {
    return sortedBlocks.value
      .slice(0, 6)
  })

  return {
    pending,
    refresh,
    rules,
    blocks,
    sortedBlocks,
    hasRules,
    hasBlocks,
    groupedRules,
    upcomingBlocks
  }
}
