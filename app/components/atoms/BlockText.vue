<script setup lang="ts">
import { computed } from 'vue'
import { secureBlankLinks } from '#shared/utils/link-security'
import type { TextBlockData, TextBlockLink } from '~/features/pages/api/pages.contract'

export type { TextBlockData, TextBlockLink }

const props = defineProps<{
  data: TextBlockData
}>()

/**
 * Sanitizes and secures HTML content:
 * - Guarantees rel="noopener noreferrer" for any external links having target="_blank"
 */
const sanitizedHtml = computed(() => {
  return secureBlankLinks(props.data?.html)
})
</script>

<template>
  <div
    class="page-block-text text-text-secondary font-sans leading-relaxed text-base sm:text-lg space-y-4"
    v-html="sanitizedHtml"
  />
</template>
