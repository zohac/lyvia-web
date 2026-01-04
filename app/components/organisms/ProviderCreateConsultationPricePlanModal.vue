<script setup lang="ts">
import { eurosToCents } from '../../features/pricing/domain/price'
import SystemAlert from '../atoms/SystemAlert.vue'

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

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const isFullScreen = computed(() => !isDesktop.value)

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
    return 'L’ordre doit être un entier positif.'
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
    :fullscreen="isFullScreen"
    :dismissible="!loading"
    :ui="{
      content: isFullScreen
        ? 'bg-white/92 backdrop-blur-md'
        : 'rounded-blob-c border border-white/70 bg-white/85 shadow-floating backdrop-blur-md',
      header: isFullScreen ? 'px-6 pt-6 pb-4 border-b border-[rgba(231,229,228,0.7)]' : 'px-8 pt-8 pb-4',
      body: isFullScreen ? 'px-6 pb-6 pt-4' : 'px-8 pb-6',
      footer: isFullScreen ? 'px-6 pb-6 pt-4 border-t border-[rgba(231,229,228,0.7)]' : 'px-8 pb-8 pt-6',
      title:
        'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
      description: 'text-sm text-[color:var(--color-brand-secondary)]'
    }"
    :close="{ class: 'rounded-full' }"
    @update:open="updateOpen"
  >
    <template #title>
      Créer un tarif consultation
    </template>
    <template #description>
      Ajoutez un nouveau tarif (prix/durée). Le parcours cliente suivra l’ordre défini.
    </template>

    <template #body>
      <div class="grid gap-6">
        <SystemAlert
          v-if="error"
          variant="error"
          title="Action impossible"
          :description="error"
        />

        <SystemAlert
          v-else-if="localValidationError"
          variant="warning"
          title="Vérification"
          :description="localValidationError"
        />

        <div class="grid gap-4 rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Libellé
            </label>
            <UInput
              v-model="label"
              :disabled="loading"
              placeholder="Ex : Consultation — 60 min — 80€"
            />
            <p
              v-if="fieldErrors?.label"
              class="text-xs font-bold text-[color:var(--color-error)]"
            >
              {{ fieldErrors.label }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Durée (min)
              </label>
              <UInput
                v-model.number="durationMinutes"
                type="number"
                min="1"
                step="1"
                :disabled="loading"
              />
              <p
                v-if="fieldErrors?.durationMinutes"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.durationMinutes }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Prix (€)
              </label>
              <UInput
                v-model="priceEuros"
                inputmode="decimal"
                placeholder="80"
                :disabled="loading"
              />
              <p
                v-if="fieldErrors?.amountCents"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.amountCents }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Ordre
              </label>
              <UInput
                v-model.number="sortOrder"
                type="number"
                min="0"
                step="1"
                :disabled="loading"
              />
              <p
                v-if="fieldErrors?.sortOrder"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.sortOrder }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="rounded-full px-6"
          :loading="loading"
          @click="submit"
        >
          Créer le tarif
        </UButton>
      </div>
    </template>
  </UModal>
</template>
