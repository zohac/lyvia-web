<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-[rgba(212,184,160,0.2)] bg-[color:var(--color-surface-card)] p-6">
    <div class="mb-5 space-y-1">
      <h3 class="font-semibold text-[color:var(--color-brand-primary)]">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="text-sm text-[color:var(--color-brand-muted)]"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
