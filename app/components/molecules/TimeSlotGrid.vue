<script setup lang="ts">
import type { TimeSlot } from '../../features/slots/domain/slots'
import SlotButton from '../atoms/SlotButton.vue'

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
    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
      {{ title }}
    </h4>

    <div
      v-if="slots.length > 0"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <SlotButton
        v-for="slot in slots"
        :key="slot.startAt"
        :label="formatTime(slot.startAt)"
        :selected="selectedStartAt === slot.startAt"
        @click="emit('select', slot)"
      />
    </div>

    <p
      v-else
      class="text-sm text-[color:var(--color-brand-secondary)]"
    >
      Aucun créneau disponible pour cette date.
    </p>
  </section>
</template>
