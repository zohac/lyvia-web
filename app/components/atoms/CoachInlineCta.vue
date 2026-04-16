<script setup lang="ts">
/**
 * Y1.4 AC-5: Mini-CTA intermédiaire réutilisable.
 * Placé après Benefits, Témoignages et Tarifs pour réduire la distance max entre CTAs.
 */
defineProps<{
  ctaTo: string
  durationMinutes: number
}>()
</script>

<template>
  <div class="bg-[var(--color-surface-page)] py-5 text-center">
    <UButton
      :to="ctaTo"
      variant="ghost"
      class="group rounded-full border border-[var(--color-brand-accent)]/40 px-8 py-3 text-[var(--color-brand-accent)] transition-all duration-300 hover:border-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent)]/5"
    >
      <span class="flex items-center gap-2">
        Réserver mon appel gratuit
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4 transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </UButton>
    <p class="mt-2 text-xs text-[var(--color-text-muted)]">
      {{ durationMinutes }} min · Gratuit · Sans engagement
    </p>
  </div>
</template>
