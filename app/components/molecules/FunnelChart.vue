<script setup lang="ts">
import type { FunnelStep } from '~/features/analytics/api/analytics.contract'

defineProps<{
  steps: readonly FunnelStep[]
}>()

const stepLabels: Record<string, string> = {
  visitors: 'Visiteurs',
  discovery: 'Discovery',
  consultations: 'Consultations',
  payments: 'Paiements'
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(step, i) in steps"
      :key="step.step"
      class="flex items-center gap-4"
    >
      <span class="w-28 shrink-0 text-sm font-medium text-[color:var(--color-brand-secondary)]">
        {{ stepLabels[step.step] ?? step.step }}
      </span>
      <div class="h-3 flex-1 overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
        <div
          class="h-full rounded-full bg-[color:var(--color-brand-solid)] transition-all duration-500"
          :style="{ width: `${step.percentage}%`, opacity: 1 - (i * 0.15) }"
        />
      </div>
      <span class="w-24 text-right text-sm text-[color:var(--color-brand-primary)]">
        {{ step.value }}
        <span class="text-[color:var(--color-brand-muted)]">({{ step.percentage }}%)</span>
      </span>
    </div>
  </div>
</template>
