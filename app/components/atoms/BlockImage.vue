<script setup lang="ts">
import { ref } from 'vue'

export interface ImageBlockData {
  assetId: string
  url?: string | null
  alt?: string
  caption?: string
  width?: number | null
  height?: number | null
}

defineProps<{
  data: ImageBlockData
}>()

const hasLoadError = ref(false)
</script>

<template>
  <figure class="page-block-image w-full max-w-full my-6">
    <div
      v-if="data.url && !hasLoadError"
      class="w-full max-w-full rounded-2xl overflow-hidden shadow-sm bg-surface-muted border border-border-subtle"
    >
      <img
        :src="data.url"
        :alt="data.alt || ''"
        :width="data.width || undefined"
        :height="data.height || undefined"
        loading="lazy"
        decoding="async"
        class="w-full h-auto max-w-full object-cover block"
        @error="hasLoadError = true"
      >
    </div>

    <!-- Fallback placeholder if url is missing or failed to load -->
    <div
      v-else
      class="w-full aspect-video rounded-2xl border border-dashed border-border-subtle bg-surface-highlight flex flex-col items-center justify-center p-6 text-text-muted text-center"
      role="img"
      :aria-label="data.alt || 'Illustration non disponible'"
    >
      <span class="text-sm font-sans">Image en cours de chargement ou non disponible</span>
    </div>

    <figcaption
      v-if="data.caption"
      class="mt-2 text-center text-sm text-text-muted font-sans"
    >
      {{ data.caption }}
    </figcaption>
  </figure>
</template>
