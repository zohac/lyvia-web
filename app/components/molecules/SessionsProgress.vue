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
  if (percent.value >= 100) return 'bg-stone-400'
  if (percent.value >= 75) return 'bg-amber-500'
  return 'bg-primary-600'
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-xs text-stone-600">
      <span>{{ label }}</span>
      <span class="font-medium">{{ percent }}%</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-stone-100">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
