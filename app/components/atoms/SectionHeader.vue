<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="space-y-2">
    <h2 class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="text-[color:var(--color-brand-secondary)]"
    >
      {{ description }}
    </p>
  </div>
</template>
