<template>
  <div class="flex flex-wrap items-end gap-3">
    <!-- Status filter -->
    <div class="grid w-full gap-1.5 sm:w-auto sm:min-w-[160px]">
      <label class="text-xs font-medium uppercase tracking-wider text-[color:var(--color-text-muted)]">
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
      icon="lucide:x"
      @click="handleReset"
    >
      Effacer
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { PaymentStatus } from '../../features/clients/api/clients.contract'

type StatusFilterValue = PaymentStatus | 'all'

const props = withDefaults(
  defineProps<{
    status?: PaymentStatus
  }>(),
  {
    status: undefined
  }
)

const emit = defineEmits<{
  'update:status': [value: PaymentStatus | undefined]
}>()

const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Payé', value: 'succeeded' },
  { label: 'En attente', value: 'pending' },
  { label: 'Échoué', value: 'failed' }
]

const status = computed<StatusFilterValue>(() => props.status ?? 'all')

const hasActiveFilters = computed(() => props.status !== undefined)

function handleStatusChange(value: string): void {
  const typed = value as StatusFilterValue
  emit('update:status', typed === 'all' ? undefined : typed as PaymentStatus)
}

function handleReset(): void {
  emit('update:status', undefined)
}
</script>
