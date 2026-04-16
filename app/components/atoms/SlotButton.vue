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
    class="group inline-flex h-11 w-full items-center justify-center rounded-blob-c border px-3 text-sm font-semibold shadow-none transition-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(212,184,160,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      selected
        ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-brand-primary)] text-white shadow-floating'
        : 'border-[color:var(--color-brand-subtle)] bg-white/75 text-[color:var(--color-brand-primary)] shadow-soft hover:-translate-y-0.5 hover:border-[color:var(--color-brand-primary)] hover:shadow-floating'
    "
    :aria-pressed="selected ? 'true' : 'false'"
  >
    {{ label }}
  </button>
</template>
