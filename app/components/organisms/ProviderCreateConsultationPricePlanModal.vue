<script setup lang="ts">
import { eurosToCents } from '../../features/pricing/domain/price'

const props = withDefaults(
  defineProps<{
    open: boolean
    suggestedSortOrder: number
    loading?: boolean
    error?: string | null
    fieldErrors?: Record<string, string>
  }>(),
  {
    loading: false,
    error: null,
    fieldErrors: () => ({})
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { body: ProviderCreateConsultationPricePlanBody }): void
}>()

type ProviderCreateConsultationPricePlanBody = {
  label: string
  durationMinutes: number
  amountCents: number
  sortOrder?: number
}

const label = ref('')
const durationMinutes = ref<number>(60)
const priceEuros = ref<string>('')
const sortOrder = ref<number | null>(null)

const localValidationError = computed(() => {
  if (!label.value.trim()) return 'Le libellé est obligatoire.'
  if (!Number.isFinite(durationMinutes.value) || durationMinutes.value <= 0) return 'La durée doit être supérieure à 0.'
  const cents = eurosToCents(priceEuros.value)
  if (!cents) return 'Le prix doit être supérieur à 0.'
  if (sortOrder.value !== null && (!Number.isInteger(sortOrder.value) || sortOrder.value < 0)) {
    return 'L\'ordre doit être un entier positif.'
  }
  return null
})

watch(
  () => props.open,
  (next) => {
    if (!next) return
    label.value = ''
    durationMinutes.value = 60
    priceEuros.value = ''
    sortOrder.value = props.suggestedSortOrder
  }
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function submit() {
  if (props.loading) return
  if (localValidationError.value) return

  const cents = eurosToCents(priceEuros.value)
  if (!cents) return

  emit('submit', {
    body: {
      label: label.value.trim(),
      durationMinutes: Math.trunc(durationMinutes.value),
      amountCents: cents,
      sortOrder: sortOrder.value === null ? undefined : Math.trunc(sortOrder.value)
    }
  })
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    title="Créer un tarif consultation"
    description="Ajoutez un nouveau tarif (prix/durée). Le parcours cliente suivra l'ordre défini."
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

        <UAlert
          v-else-if="localValidationError"
          color="warning"
          variant="soft"
          title="Vérification"
          :description="localValidationError"
          icon="i-lucide-alert-triangle"
        />

        <UFormField
          label="Libellé"
          :error="fieldErrors?.label ?? undefined"
          class="w-full"
        >
          <UInput
            v-model="label"
            :disabled="loading"
            placeholder="Ex : Consultation — 60 min — 80€"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField
            label="Durée (min)"
            :error="fieldErrors?.durationMinutes ?? undefined"
          >
            <UInput
              v-model.number="durationMinutes"
              type="number"
              min="1"
              step="1"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Prix (€)"
            :error="fieldErrors?.amountCents ?? undefined"
          >
            <UInput
              v-model="priceEuros"
              inputmode="decimal"
              placeholder="80"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Ordre"
            :error="fieldErrors?.sortOrder ?? undefined"
          >
            <UInput
              v-model.number="sortOrder"
              type="number"
              min="0"
              step="1"
              :disabled="loading"
            />
          </UFormField>
        </div>
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
          @click="submit"
        >
          Créer le tarif
        </UButton>
      </div>
    </template>
  </UModal>
</template>
