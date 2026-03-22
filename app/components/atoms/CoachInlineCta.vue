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
  <div class="py-12 text-center">
    <UButton
      :to="ctaTo"
      variant="ghost"
      class="group rounded-full border border-[#d4956a]/20 px-8 py-3 text-[#d4956a] transition-all duration-300 hover:border-[#d4956a]/40 hover:bg-[#d4956a]/5"
    >
      <span class="flex items-center gap-2">
        Réserver mon appel gratuit
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4 transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </UButton>
    <p class="mt-3 text-xs text-[#857d8c]">
      {{ durationMinutes }} min · Gratuit · Sans engagement
    </p>
  </div>
</template>
