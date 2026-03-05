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
  <div class="rounded-lg border border-stone-200 bg-white p-4">
    <p class="mb-2 text-xs text-stone-500">
      Aperçu Google
    </p>
    <div class="space-y-0.5">
      <p
        class="text-lg text-[#1a0dab]"
        style="max-width: 600px"
      >
        {{ truncate(props.title, 60) }}
      </p>
      <p class="text-sm text-[#006621]">
        {{ props.url }}
      </p>
      <p class="line-clamp-2 text-sm text-[#545454]">
        {{ truncate(props.description, 155) }}
      </p>
    </div>
  </div>
</template>
