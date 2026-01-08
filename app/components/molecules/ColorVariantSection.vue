<template>
  <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)] space-y-4">
    <!-- Header -->
    <div>
      <h3 class="font-bold text-lg text-[color:var(--color-brand-primary)] mb-1">
        {{ title }}
      </h3>
      <p class="text-sm text-[color:var(--color-brand-muted)]">
        {{ description }}
      </p>
    </div>

    <!-- Variants Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Solid -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Solid
        </p>
        <UButton :color="color" variant="solid" size="md" block>
          {{ title }} Solid
        </UButton>
      </div>

      <!-- Outline -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Outline
        </p>
        <UButton :color="color" variant="outline" size="md" block>
          {{ title }} Outline
        </UButton>
      </div>

      <!-- Soft -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Soft
        </p>
        <UButton :color="color" variant="soft" size="md" block>
          {{ title }} Soft
        </UButton>
      </div>

      <!-- Subtle -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Subtle
        </p>
        <UButton :color="color" variant="subtle" size="md" block>
          {{ title }} Subtle
        </UButton>
      </div>

      <!-- Ghost -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Ghost
        </p>
        <UButton :color="color" variant="ghost" size="md" block>
          {{ title }} Ghost
        </UButton>
      </div>

      <!-- Link -->
      <div class="space-y-2">
        <p class="text-xs font-bold text-[color:var(--color-brand-secondary)] uppercase tracking-wide">
          Link
        </p>
        <UButton :color="color" variant="link" size="md" block>
          {{ title }} Link
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Color Variant Section Component
 *
 * Displays all 6 button variants (solid, outline, soft, subtle, ghost, link)
 * for a given color.
 *
 * @architecture Atomic Design — Molecule
 * @author Remy Chopoya
 */

interface Props {
  /** Button color (primary, secondary, neutral, success, warning, error) */
  color: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error'
  /** Section title */
  title: string
  /** Section description */
  description: string
}

defineProps<Props>()
</script>

<style scoped>
.rounded-\[var\(--radius-lg\)\] {
  border-radius: var(--radius-lg);
}
</style>
