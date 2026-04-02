<script setup lang="ts">
/**
 * X3.3 AC-7: Section souscriptions programme dans la fiche cliente.
 *
 * Affiche les souscriptions actives/historiques avec badge statut
 * et barre de progression séances.
 */
import { useClientSubscriptions } from '../../features/programs/useClientSubscriptions'
import { formatCurrency } from '../../features/analytics/helpers/format-kpi'
import { formatDateShort } from '../../composables/useDateFormat'
import SubscriptionStatusBadge from '../molecules/SubscriptionStatusBadge.vue'
import SessionsProgress from '../molecules/SessionsProgress.vue'

const props = defineProps<{
  clientProfileId: string
}>()

const { subscriptions, loading, error, load } = useClientSubscriptions(props.clientProfileId)

onMounted(() => load())
</script>

<template>
  <UCard class="bg-[color:var(--color-surface-card)]">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-[color:var(--color-text-primary)]">
          <UIcon
            name="lucide:package"
            class="mr-2 inline-block h-5 w-5 text-[color:var(--color-text-muted)]"
          />
          Programmes
        </h2>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-20 w-full rounded-xl" />
    </div>

    <!-- Error -->
    <AtomsDsErrorState
      v-else-if="error"
      :message="error"
      @retry="load()"
    />

    <!-- Empty state -->
    <AtomsDsEmptyState
      v-else-if="subscriptions.length === 0"
      icon="i-lucide-package"
      title="Aucun programme souscrit"
    />

    <!-- Subscriptions list -->
    <div
      v-else
      class="divide-y divide-[color:var(--color-border-subtle)]"
    >
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="py-4 first:pt-0 last:pb-0"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-medium text-[color:var(--color-text-primary)]">
                {{ sub.snapshotName }}
              </p>
              <SubscriptionStatusBadge :status="sub.status" />
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-text-muted)]">
              <span>{{ formatCurrency(sub.snapshotPriceCents) }}</span>
              <span>{{ sub.snapshotValidityMonths }} mois</span>
              <span>Expire {{ formatDateShort(sub.expiresAt) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-3">
          <SessionsProgress
            :sessions-used="sub.sessionsUsed"
            :total-sessions="sub.snapshotTotalSessions"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
