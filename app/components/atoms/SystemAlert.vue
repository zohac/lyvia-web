<script setup lang="ts">
type SystemAlertVariant = 'error' | 'info' | 'success' | 'warning'

withDefaults(
  defineProps<{
    title?: string
    description: string
    variant?: SystemAlertVariant
    id?: string
  }>(),
  {
    variant: 'info',
    title: undefined,
    id: undefined
  }
)

const variantStyles: Record<SystemAlertVariant, { wrapper: string }> = {
  error: {
    wrapper:
      'border-[color:var(--color-error)] bg-[rgba(186,63,63,0.08)] text-[color:var(--color-brand-primary)]'
  },
  info: {
    wrapper:
      'border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)]'
  },
  success: {
    wrapper:
      'border-[color:var(--color-success)] bg-[rgba(74,124,89,0.10)] text-[color:var(--color-brand-primary)]'
  },
  warning: {
    wrapper:
      'border-[color:var(--color-warning)] bg-[rgba(217,140,40,0.12)] text-[color:var(--color-brand-primary)]'
  }
}
</script>

<template>
  <div
    :id="id"
    class="flex gap-3 rounded-[var(--radius-md)] border p-3 text-sm"
    :class="variantStyles[variant].wrapper"
    role="alert"
    aria-live="assertive"
  >
    <span class="mt-0.5 h-5 w-5 shrink-0">
      <svg
        v-if="variant === 'error'"
        viewBox="0 0 24 24"
        class="h-5 w-5 text-[color:var(--color-error)]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>

      <svg
        v-else-if="variant === 'success'"
        viewBox="0 0 24 24"
        class="h-5 w-5 text-[color:var(--color-success)]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="m9 12 2 2 4-4" />
      </svg>

      <svg
        v-else-if="variant === 'warning'"
        viewBox="0 0 24 24"
        class="h-5 w-5 text-[color:var(--color-warning)]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>

      <svg
        v-else
        viewBox="0 0 24 24"
        class="h-5 w-5 text-[color:var(--color-brand-secondary)]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </span>
    <div class="min-w-0">
      <div
        v-if="title"
        class="font-semibold"
      >
        {{ title }}
      </div>
      <p class="leading-[var(--leading-normal)]">
        {{ description }}
      </p>
    </div>
  </div>
</template>
