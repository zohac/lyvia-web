<script setup lang="ts">
import type { TrafficSource } from '~/features/analytics/api/analytics.contract'

defineProps<{
  sources: readonly TrafficSource[]
}>()
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="source in sources"
      :key="source.domain"
      class="flex items-center gap-4"
    >
      <span class="w-36 shrink-0 truncate text-sm font-medium text-[color:var(--color-brand-secondary)]">
        {{ source.domain }}
      </span>
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
        <div
          class="h-full rounded-full bg-[color:var(--color-brand-solid)] transition-all duration-500"
          :style="{ width: `${source.percentage}%` }"
        />
      </div>
      <span class="w-16 text-right text-sm text-[color:var(--color-brand-muted)]">
        {{ source.percentage.toFixed(1) }}%
      </span>
    </div>
  </div>
</template>
