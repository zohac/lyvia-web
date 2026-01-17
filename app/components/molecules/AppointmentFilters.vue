<template>
  <div class="flex flex-wrap items-end gap-3">
    <!-- Type filter -->
    <div class="grid w-full gap-1.5 sm:w-auto sm:min-w-[140px]">
      <label class="text-xs font-medium uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Type
      </label>
      <USelect
        :model-value="type"
        :items="typeOptions"
        size="sm"
        @update:model-value="handleTypeChange"
      />
    </div>

    <!-- Status filter -->
    <div class="grid w-full gap-1.5 sm:w-auto sm:min-w-[140px]">
      <label class="text-xs font-medium uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
        Statut
      </label>
      <USelect
        :model-value="status"
        :items="statusOptions"
        size="sm"
        @update:model-value="handleStatusChange"
      />
    </div>

    <!-- Reset button -->
    <UButton
      v-if="hasActiveFilters"
      variant="ghost"
      size="sm"
      icon="i-lucide-x"
      @click="handleReset"
    >
      Effacer
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { AppointmentType, AppointmentStatus } from '../../features/clients/api/clients.contract'

type TypeFilterValue = AppointmentType | 'all'
type StatusFilterValue = AppointmentStatus | 'all'

const props = withDefaults(
  defineProps<{
    type?: AppointmentType
    status?: AppointmentStatus
  }>(),
  {
    type: undefined,
    status: undefined
  }
)

const emit = defineEmits<{
  'update:type': [value: AppointmentType | undefined]
  'update:status': [value: AppointmentStatus | undefined]
}>()

const typeOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Découverte', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' }
]

const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Planifié', value: 'scheduled' },
  { label: 'Terminé', value: 'completed' },
  { label: 'Annulé', value: 'cancelled' }
]

const type = computed<TypeFilterValue>(() => props.type ?? 'all')
const status = computed<StatusFilterValue>(() => props.status ?? 'all')

const hasActiveFilters = computed(() => props.type !== undefined || props.status !== undefined)

function handleTypeChange(value: string): void {
  const typed = value as TypeFilterValue
  emit('update:type', typed === 'all' ? undefined : typed as AppointmentType)
}

function handleStatusChange(value: string): void {
  const typed = value as StatusFilterValue
  emit('update:status', typed === 'all' ? undefined : typed as AppointmentStatus)
}

function handleReset(): void {
  emit('update:type', undefined)
  emit('update:status', undefined)
}
</script>
