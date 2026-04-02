<script setup lang="ts">
import { consultationBufferOptions } from '../../features/pricing/domain/buffer-options'
import type { UpdateConsultationPricePlanRequest } from '../../features/pricing/api/provider-consultation-pricing.contract'

const props = withDefaults(
  defineProps<{
    open: boolean
    plan: {
      id: string
      label: string
      durationMinutes: number
      amountLabel: string
      bufferAfterMinutes: number
    }
    loading?: boolean
    error?: string | null
  }>(),
  {
    loading: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { body: UpdateConsultationPricePlanRequest }): void
}>()

const bufferAfterMinutes = ref(0)

watch(
  () => props.open,
  (next) => {
    if (!next) return
    bufferAfterMinutes.value = props.plan.bufferAfterMinutes
  },
  { immediate: true }
)

const isDirty = computed(() =>
  bufferAfterMinutes.value !== props.plan.bufferAfterMinutes
)

const summaryText = computed(() => {
  const duration = props.plan.durationMinutes
  const buffer = bufferAfterMinutes.value
  const total = duration + buffer
  if (buffer === 0) {
    return `Chaque créneau réservera ${total} min (pas de pause après la consultation)`
  }
  return `Chaque créneau réservera ${total} min (${duration} min de consultation + ${buffer} min de pause)`
})

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function submit() {
  if (props.loading || !isDirty.value) return
  emit('submit', {
    body: { bufferAfterMinutes: bufferAfterMinutes.value }
  })
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    title="Modifier le plan tarifaire"
    :description="`${plan.label} — ${plan.durationMinutes} min — ${plan.amountLabel}`"
    @update:open="updateOpen"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="error"
          icon="i-lucide-alert-circle"
        />

        <UFormField label="Pause après la consultation">
          <USelect
            v-model="bufferAfterMinutes"
            :items="consultationBufferOptions"
            value-key="value"
            :disabled="loading"
            class="w-full"
          />
          <template #hint>
            <span class="text-sm text-[color:var(--color-text-muted)]">Temps de transition entre deux rendez-vous</span>
          </template>
        </UFormField>

        <!-- Dynamic summary -->
        <UAlert
          color="info"
          variant="soft"
          :description="summaryText"
          icon="i-lucide-info"
        />

        <!-- Non-retroactivity warning -->
        <UAlert
          v-if="isDirty"
          color="warning"
          variant="soft"
          description="Ce changement s'appliquera aux prochains créneaux proposés. Vos rendez-vous déjà planifiés ne sont pas affectés."
          icon="i-lucide-alert-triangle"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!isDirty"
          @click="submit"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
