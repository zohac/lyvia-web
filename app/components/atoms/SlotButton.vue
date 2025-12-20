<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    selected?: boolean
    disabled?: boolean
  }>(),
  {
    selected: false,
    disabled: false
  }
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(200,121,100,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      selected
        ? 'border-[color:var(--color-accent-main)] bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)]'
        : 'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-surface-highlight)]'
    "
    :aria-pressed="selected ? 'true' : 'false'"
  >
    {{ label }}
  </button>
</template>
