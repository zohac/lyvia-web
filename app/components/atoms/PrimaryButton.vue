<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    loading?: boolean
    loadingLabel?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    loading: false,
    loadingLabel: 'Chargement…',
    disabled: false,
    type: 'button'
  }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    class="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-6 py-2 text-center font-bold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(200,121,100,0.2)]"
    :class="[
      // Correction Line-height pour les jambages (g, p, y)
      'leading-tight',
      // Gestion hauteur fluide
      'h-auto',
      disabled || loading
        ? 'cursor-not-allowed bg-[color:var(--color-brand-subtle)] text-[color:var(--color-brand-secondary)]'
        : 'bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)] hover:bg-[color:var(--color-accent-hover)] active:bg-[color:var(--color-accent-hover)]'
    ]"
  >
    <!-- Loader -->
    <svg
      v-if="loading"
      class="h-5 w-5 flex-shrink-0 animate-spin text-current"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v2a6 6 0 0 0-6 6H4z"
      />
    </svg>

    <span class="break-words whitespace-normal text-center !text-[19px]">
      {{ loading ? loadingLabel : label }}
    </span>
  </button>
</template>
