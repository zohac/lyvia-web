<script setup lang="ts">
const props = defineProps<{
  scheduledAt: string
  timeZone: string
  durationMinutes: number
}>()

const emit = defineEmits<{
  edit: []
}>()

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
</script>

<template>
  <section class="rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <Icon
          name="lucide:calendar"
          size="18"
          class="mt-0.5 text-[color:var(--color-brand-primary-dark)]"
          aria-hidden="true"
        />
        <div class="grid gap-1">
          <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
            {{ formatDateTime(scheduledAt) }}
          </p>
          <p class="text-xs text-[color:var(--color-brand-secondary)]">
            Durée : {{ durationMinutes }} min
          </p>
        </div>
      </div>

      <button
        type="button"
        class="text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
        @click="emit('edit')"
      >
        Modifier
      </button>
    </div>
  </section>
</template>
