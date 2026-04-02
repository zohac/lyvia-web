<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  url: string
}>()

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}
</script>

<template>
  <div class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-4">
    <p class="mb-2 text-xs text-[color:var(--color-text-muted)]">
      Aperçu Google
    </p>
    <div class="space-y-0.5">
      <p
        class="text-lg text-[var(--color-crepuscule-700)]"
        style="max-width: 600px"
      >
        {{ truncate(props.title, 60) }}
      </p>
      <p class="text-sm text-[var(--color-success-700)]">
        {{ props.url }}
      </p>
      <p class="line-clamp-2 text-sm text-[var(--color-text-secondary)]">
        {{ truncate(props.description, 155) }}
      </p>
    </div>
  </div>
</template>
