<script setup lang="ts">
import { computed } from 'vue'
import { secureBlankLinks } from '#shared/utils/link-security'

export interface TextBlockLink {
  href: string
  label?: string
  target?: string
}

export interface TextBlockData {
  html: string
  links?: TextBlockLink[]
}

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

<style scoped>
.page-block-text :deep(h1),
.page-block-text :deep(h2),
.page-block-text :deep(h3),
.page-block-text :deep(h4),
.page-block-text :deep(h5),
.page-block-text :deep(h6) {
  font-family: var(--font-heading, 'Fraunces', Georgia, serif);
  color: var(--color-text-primary, #221d28);
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1.75em;
  margin-bottom: 0.75em;
}

.page-block-text :deep(h1) {
  font-size: 2rem;
}

.page-block-text :deep(h2) {
  font-size: 1.625rem;
}

.page-block-text :deep(h3) {
  font-size: 1.375rem;
}

.page-block-text :deep(p) {
  margin-bottom: 1em;
}

.page-block-text :deep(p:last-child) {
  margin-bottom: 0;
}

.page-block-text :deep(strong) {
  color: var(--color-text-primary, #221d28);
  font-weight: 600;
}

.page-block-text :deep(em) {
  font-style: italic;
}

.page-block-text :deep(u) {
  text-decoration: underline;
}

.page-block-text :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.75em;
  margin-bottom: 0.75em;
}

.page-block-text :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-top: 0.75em;
  margin-bottom: 0.75em;
}

.page-block-text :deep(li) {
  margin-bottom: 0.375rem;
}

.page-block-text :deep(a) {
  color: var(--color-brand-primary, #5b4b6e);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease-in-out;
}

.page-block-text :deep(a:hover) {
  color: var(--color-brand-primary-light, #7a6b8e);
}
</style>
