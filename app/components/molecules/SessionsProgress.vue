<script setup lang="ts">
/**
 * X3.3 AC-7: Barre de progression séances programme.
 *
 * Affiche "X/Y séances utilisées" avec une barre de progression visuelle.
 */
import { formatSessionsProgress, computeSessionsPercent } from '../../features/programs/domain/programs'

const props = defineProps<{
  sessionsUsed: number
  totalSessions: number
}>()

const label = computed(() => formatSessionsProgress(props.sessionsUsed, props.totalSessions))
const percent = computed(() => computeSessionsPercent(props.sessionsUsed, props.totalSessions))

const barColor = computed(() => {
  if (percent.value >= 100) return 'bg-[color:var(--color-neutral-400)]'
  if (percent.value >= 75) return 'bg-[color:var(--color-sunset-50)]0'
  return 'bg-primary-600'
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-xs text-[color:var(--color-text-secondary)]">
      <span>{{ label }}</span>
      <span class="font-medium">{{ percent }}%</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
