<script setup lang="ts">
import type { AvailabilityAppointmentType } from '../../features/availability/api/availability.contract'
import type { SlotDayGroup } from '../../features/slots/domain/slots'

const props = defineProps<{
  type: AvailabilityAppointmentType
  periodDays: 7 | 30
  timezone: string
  pending: boolean
  error: string | null
  groups: SlotDayGroup[]
}>()

const emit = defineEmits<{
  (event: 'update:type', value: AvailabilityAppointmentType): void
  (event: 'update:periodDays', value: 7 | 30): void
  (event: 'refresh'): void
}>()

const typeOptions = [
  { label: 'Discovery', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' }
]

const periodOptions = [
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' }
]

const selectedPeriod = computed({
  get: () => String(props.periodDays),
  set: (value: string) => emit('update:periodDays', Number(value) as 7 | 30)
})

function formatTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    timeStyle: 'short'
  }).format(date)
}
</script>

<template>
  <UCard class="bg-white">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-stone-900">
            Aperçu des créneaux
          </h3>
          <p class="mt-1 text-sm text-stone-500">
            {{ timezone }}
          </p>
        </div>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="pending"
          @click="emit('refresh')"
        >
          <UIcon
            name="lucide:refresh-cw"
            class="h-4 w-4"
          />
        </UButton>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Filters -->
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Type">
          <USelect
            :model-value="type"
            :items="typeOptions"
            :disabled="pending"
            size="sm"
            @update:model-value="emit('update:type', $event as AvailabilityAppointmentType)"
          />
        </UFormField>

        <UFormField label="Période">
          <USelect
            v-model="selectedPeriod"
            :items="periodOptions"
            :disabled="pending"
            size="sm"
          />
        </UFormField>
      </div>

      <!-- Error -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Aperçu indisponible"
        :description="error"
        icon="i-lucide-alert-circle"
      />

      <!-- Loading -->
      <div
        v-else-if="pending"
        class="space-y-3"
      >
        <USkeleton class="h-16 w-full" />
        <USkeleton class="h-16 w-full" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="groups.length === 0"
        class="py-6 text-center text-sm text-stone-500"
      >
        Aucun créneau généré.
      </div>

      <!-- Slots list -->
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="group in groups"
          :key="group.key"
          class="rounded-lg border border-stone-100 bg-stone-50 p-3"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-stone-900">
              {{ group.label }}
            </p>
            <UBadge
              color="primary"
              variant="soft"
              size="sm"
            >
              {{ group.slots.length }}
            </UBadge>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <UBadge
              v-for="slot in group.slots.slice(0, 12)"
              :key="slot.startAt"
              color="neutral"
              variant="soft"
              size="sm"
            >
              <UIcon
                name="lucide:clock"
                class="mr-1 h-3 w-3"
              />
              {{ formatTime(slot.startAt) }}
            </UBadge>
            <UBadge
              v-if="group.slots.length > 12"
              color="primary"
              variant="soft"
              size="sm"
            >
              +{{ group.slots.length - 12 }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
