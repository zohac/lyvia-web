<script setup lang="ts">
/**
 * DashboardGreeting molecule
 *
 * Displays a personalized greeting header for dashboard pages.
 * Supports contextual greeting (Bonjour/Bonsoir) and optional subtitle.
 *
 * @example
 * <MoleculesDashboardGreeting subtitle="Vue d'ensemble">
 *   <template #actions>
 *     <UButton>Action</UButton>
 *   </template>
 * </MoleculesDashboardGreeting>
 */
const props = defineProps<{
  /**
   * Subtitle displayed below the greeting.
   * Can include date via slot or simple text.
   */
  subtitle?: string

  /**
   * Whether to show the formatted date in subtitle.
   * When true, appends date to subtitle or shows date alone.
   */
  showDate?: boolean
}>()

defineSlots<{
  /**
   * Optional actions slot (buttons, etc.) aligned to the right
   */
  actions?: () => unknown

  /**
   * Optional subtitle slot for custom content
   */
  subtitle?: () => unknown
}>()

const { fullGreeting, formattedDate } = useDashboardGreeting()

/**
 * Computed subtitle text
 */
const subtitleText = computed(() => {
  if (props.subtitle && props.showDate) {
    return `${props.subtitle}, ${formattedDate.value}`
  }
  if (props.showDate) {
    return formattedDate.value
  }
  return props.subtitle ?? null
})
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
        {{ fullGreeting }}
      </h1>
      <p
        v-if="subtitleText || $slots.subtitle"
        class="mt-1 text-[color:var(--color-text-muted)]"
      >
        <slot name="subtitle">
          {{ subtitleText }}
        </slot>
      </p>
    </div>

    <div
      v-if="$slots.actions"
      class="flex items-center gap-3"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
