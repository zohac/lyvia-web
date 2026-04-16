<template>
  <div class="flex items-center gap-3">
    <span class="text-[color:var(--color-brand-secondary)] min-w-[120px]">
      {{ label }}:
    </span>
    <span class="px-2 py-1 bg-[color:var(--color-surface-highlight)] rounded font-mono">
      {{ computedValue }}
    </span>
    <div
      v-if="isColor"
      class="w-6 h-6 rounded border border-[color:var(--color-border-subtle)]"
      :style="{ backgroundColor: computedValue }"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * CSS Variable Display Component
 *
 * Displays the computed value of a CSS variable with optional color swatch.
 *
 * @architecture Atomic Design — Atom
 * @author Remy Chopoya
 */

interface Props {
  /** CSS variable name (with -- prefix) */
  varName: string
  /** Display label */
  label: string
}

const props = defineProps<Props>()

const computedValue = computed(() => {
  if (import.meta.client) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(props.varName)
      .trim() || 'N/A'
  }
  return 'N/A (SSR)'
})

/**
 * Check if the value is a color (hex or rgb)
 */
const isColor = computed(() => {
  const val = computedValue.value
  return val.startsWith('#') || val.startsWith('rgb')
})
</script>
