<script setup lang="ts">
defineProps<{
  isTest?: boolean
}>()
</script>

<template>
  <aside
    aria-label="Mode aperçu"
    class="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-amber-200/90 bg-amber-50/95 px-4 py-2.5 text-xs sm:text-sm text-amber-900 backdrop-blur-md shadow-xs transition-all"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-800">
        <UIcon
          name="lucide:eye"
          size="15"
        />
      </span>
      <p class="truncate font-medium">
        <span class="font-semibold">Mode aperçu</span>
        <span class="mx-1.5 opacity-60">—</span>
        <span
          v-if="isTest"
          class="text-amber-800"
        >
          Compte de test. Ce profil est isolé et ne peut pas être mis en ligne.
        </span>
        <span
          v-else
          class="text-amber-800"
        >
          Votre page est actuellement en brouillon et invisible pour les visiteurs.
        </span>
      </p>
    </div>

    <NuxtLink
      to="/provider/coach-page"
      class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white/80 px-3 py-1 text-xs font-medium text-amber-900 shadow-2xs hover:bg-white hover:border-amber-400 transition-colors"
    >
      <UIcon
        name="lucide:arrow-left"
        size="14"
      />
      <span>Retour à l'éditeur</span>
    </NuxtLink>
  </aside>
</template>
