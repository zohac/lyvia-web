<script setup lang="ts">
import type { TimeSlot } from '../../features/slots/domain/slots'

const props = defineProps<{
  title: string
  slots: TimeSlot[]
  selectedStartAt: string | null
  timeZone: string
}>()

const emit = defineEmits<{
  select: [slot: TimeSlot]
}>()

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
</script>

<template>
  <section
    class="grid gap-4"
    aria-label="Créneaux disponibles"
  >
    <h4 class="text-sm font-medium capitalize text-neutral-700">
      {{ title }}
    </h4>

    <div
      v-if="slots.length > 0"
      class="flex max-h-[320px] flex-col gap-2 overflow-y-auto"
    >
      <button
        v-for="slot in slots"
        :key="slot.startAt"
        type="button"
        class="flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150"
        :class="[
          selectedStartAt === slot.startAt
            ? 'border-crepuscule-600 bg-crepuscule-600 text-white'
            : 'border-neutral-200 bg-white text-neutral-700 hover:border-crepuscule-300 hover:bg-crepuscule-50'
        ]"
        @click="emit('select', slot)"
      >
        {{ formatTime(slot.startAt) }}
      </button>
    </div>

    <div
      v-else
      class="py-8 text-center"
    >
      <UIcon
        name="i-lucide-clock"
        class="mx-auto mb-2 size-6 text-neutral-300"
      />
      <p class="text-sm text-neutral-500">
        Aucun créneau pour cette date
      </p>
    </div>
  </section>
</template>
