<script setup lang="ts">
import { formatKpiValue, getDeltaIcon, getDeltaClasses } from '~/features/analytics/helpers/format-kpi'

const props = defineProps<{
  label: string
  value: number
  delta: number
  icon: string
  format?: 'number' | 'currency'
}>()

const formattedValue = computed(() => formatKpiValue(props.value, props.format))
const deltaIcon = computed(() => getDeltaIcon(props.delta))
const deltaClasses = computed(() => getDeltaClasses(props.delta))
</script>

<template>
  <div class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-card transition-shadow hover:shadow-elevated">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)]">
        <UIcon
          :name="icon"
          size="20"
          class="text-[color:var(--color-brand-solid)]"
        />
      </div>
      <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        {{ label }}
      </span>
    </div>
    <div class="mt-4 flex items-end justify-between">
      <p class="font-serif text-3xl text-[color:var(--color-brand-primary)]">
        {{ formattedValue }}
      </p>
      <span
        :class="deltaClasses"
        class="text-sm font-medium"
      >
        {{ deltaIcon }} {{ Math.abs(delta).toFixed(1) }}%
      </span>
    </div>
  </div>
</template>
