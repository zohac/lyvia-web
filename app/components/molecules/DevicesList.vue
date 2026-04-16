<script setup lang="ts">
import type { DeviceBreakdown } from '~/features/analytics/api/analytics.contract'

defineProps<{
  devices: readonly DeviceBreakdown[]
}>()

const deviceIcons: Record<string, string> = {
  mobile: 'lucide:smartphone',
  desktop: 'lucide:monitor',
  tablet: 'lucide:tablet'
}

const deviceLabels: Record<string, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablette'
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="device in devices"
      :key="device.type"
      class="flex items-center gap-4"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ui-color-primary-100)]">
        <UIcon
          :name="deviceIcons[device.type] ?? 'lucide:help-circle'"
          size="20"
          class="text-[color:var(--color-brand-primary)]"
        />
      </div>
      <div class="flex-1">
        <span class="text-sm font-medium text-[color:var(--color-brand-primary)]">
          {{ deviceLabels[device.type] ?? device.type }}
        </span>
      </div>
      <span class="text-sm font-medium text-[color:var(--color-brand-muted)]">
        {{ device.percentage.toFixed(1) }}%
      </span>
    </div>
  </div>
</template>
