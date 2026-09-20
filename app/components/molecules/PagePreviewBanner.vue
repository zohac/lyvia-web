<script setup lang="ts">
/**
 * V2.2e — Floating banner pinned at the top of the private page preview.
 *
 * Wording is verbatim from the UX spec (§4.1) and must not be paraphrased:
 * "Mode prévisualisation — Cette version est privée et n'est pas encore visible
 * sur votre site public." The banner is purely presentational: it closes the
 * overlay through `emit('close')` and runs the same publish command through
 * `emit('publish')` (UX §4.1).
 */
withDefaults(defineProps<{
  /** Disables/locks the publish button while the command is in flight. */
  publishing?: boolean
}>(), {
  publishing: false
})

const emit = defineEmits<{
  (event: 'close' | 'publish'): void
}>()
</script>

<template>
  <aside
    aria-label="Mode prévisualisation"
    class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[color:var(--color-crepuscule-950)] px-4 py-3 text-[color:var(--color-text-inverse)] sm:px-6"
  >
    <div class="flex min-w-0 items-center gap-2.5">
      <UIcon
        name="i-lucide-eye"
        class="size-5 shrink-0"
        aria-hidden="true"
      />
      <p class="text-xs font-medium sm:text-sm">
        Mode prévisualisation — Cette version est privée et n'est pas encore visible sur votre site public.
      </p>
    </div>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-arrow-left"
        class="min-h-11"
        @click="emit('close')"
      >
        Revenir à l'éditeur
      </UButton>
      <UButton
        color="primary"
        icon="i-lucide-upload-cloud"
        class="min-h-11"
        :loading="publishing"
        :disabled="publishing"
        @click="emit('publish')"
      >
        Mettre en ligne
      </UButton>
    </div>
  </aside>
</template>
