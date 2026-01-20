<script setup lang="ts">
const props = defineProps<{
  coachName: string | null
  coachInitials: string
  timezone: string
  durationMinutes: number
  selectedSlotStartAt: string | null
}>()

const formattedSlot = computed(() => {
  if (!props.selectedSlotStartAt) return null

  const date = new Date(props.selectedSlotStartAt)
  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date)

  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

  return { date: dateStr, time: timeStr }
})
</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Coach info -->
    <div class="flex items-center gap-3">
      <UAvatar
        :text="coachInitials"
        size="lg"
        class="bg-crepuscule-100 text-crepuscule-700 font-semibold"
      />
      <div>
        <p class="font-semibold text-neutral-900">
          {{ coachName ?? 'Votre coach' }}
        </p>
        <p class="text-sm text-neutral-500">
          Appel découverte
        </p>
      </div>
    </div>

    <!-- Details -->
    <div class="space-y-3 text-sm">
      <div class="flex items-center gap-2 text-neutral-600">
        <UIcon
          name="i-lucide-clock"
          class="size-4 text-neutral-400"
        />
        <span>{{ durationMinutes }} minutes</span>
      </div>
      <div class="flex items-center gap-2 text-neutral-600">
        <UIcon
          name="i-lucide-globe"
          class="size-4 text-neutral-400"
        />
        <span>{{ timezone }}</span>
      </div>
    </div>

    <!-- Selected slot -->
    <Transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="formattedSlot"
        class="rounded-xl border border-crepuscule-200 bg-crepuscule-50 p-4"
      >
        <p class="mb-1 text-xs font-medium uppercase tracking-wide text-crepuscule-600">
          Créneau sélectionné
        </p>
        <p class="font-semibold capitalize text-neutral-900">
          {{ formattedSlot.date }}
        </p>
        <p class="text-lg font-bold text-crepuscule-700">
          {{ formattedSlot.time }}
        </p>
      </div>
      <div
        v-else
        class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center"
      >
        <UIcon
          name="i-lucide-calendar"
          class="mx-auto mb-2 size-6 text-neutral-400"
        />
        <p class="text-sm text-neutral-500">
          Sélectionnez un créneau
        </p>
      </div>
    </Transition>

    <!-- Free badge -->
    <div class="flex items-center gap-2">
      <UBadge
        color="primary"
        variant="soft"
        size="sm"
      >
        Gratuit
      </UBadge>
      <span class="text-xs text-neutral-500">Sans engagement</span>
    </div>
  </aside>
</template>
