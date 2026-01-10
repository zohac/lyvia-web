<script setup lang="ts">
defineProps<{
  name: string
  label: string
  hex?: string
}>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="h-10 w-10 shrink-0 rounded-lg border border-[rgba(0,0,0,0.1)] shadow-sm"
      :style="{ backgroundColor: `var(${name})` }"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-[color:var(--color-brand-primary)]">
        {{ label }}
      </p>
      <p class="truncate font-mono text-xs text-[color:var(--color-brand-muted)]">
        {{ name }}
        <span v-if="hex" class="ml-1 opacity-60">{{ hex }}</span>
      </p>
    </div>
  </div>
</template>
