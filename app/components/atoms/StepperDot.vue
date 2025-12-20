<script setup lang="ts">
withDefaults(
  defineProps<{
    state: 'pending' | 'active' | 'completed'
    label: string
  }>(),
  {}
)
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <span
      class="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold"
      :class="
        state === 'completed'
          ? 'border-[color:var(--color-accent-main)] bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)]'
          : state === 'active'
            ? 'border-[color:var(--color-accent-main)] bg-[color:var(--color-surface-card)] text-[color:var(--color-accent-main)]'
            : 'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-secondary)]'
      "
      aria-hidden="true"
    >
      <Icon
        v-if="state === 'completed'"
        name="lucide:check"
        size="16"
        aria-hidden="true"
      />
      <span v-else>
        <slot />
      </span>
    </span>

    <span
      class="text-sm font-semibold"
      :class="state === 'active' ? 'text-[color:var(--color-brand-primary)]' : 'text-[color:var(--color-brand-secondary)]'"
    >
      {{ label }}
    </span>
  </span>
</template>
