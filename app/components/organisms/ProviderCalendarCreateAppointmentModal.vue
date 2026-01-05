<script setup lang="ts">
import type { ProviderAppointmentListItem, ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'
import { minutesToHHmm, zonedLocalDateTimeToUtcIso } from '../../features/calendar/domain/zoned-datetime'
import SystemAlert from '../atoms/SystemAlert.vue'
import ConsultationPlanSelector from '../molecules/ConsultationPlanSelector.vue'

type ClientOption = {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    timeZone: string
    initialDayKey: string
    initialMinutes: number
    knownClients: ClientOption[]
    /**
     * Liste des price plans disponibles (chargés via useProviderCalendar).
     */
    consultationPricePlans: ConsultationPricePlan[]
    loading?: boolean
    error?: string | null
    fieldErrors?: Record<string, string>
  }>(),
  {
    consultationPricePlans: () => [],
    loading: false,
    error: null,
    fieldErrors: () => ({})
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { body: ProviderCalendarCreateAppointmentBody }): void
  (event: 'reset'): void
}>()

type ProviderCalendarCreateAppointmentBody = {
  type: ProviderCalendarAppointmentType
  startAt: string
  clientProfileId: ProviderAppointmentListItem['clientProfileId']
  notes?: string | null
} & (
  | { type: 'discovery' }
  | { type: 'consultation'; pricePlanId: string }
)

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const isFullScreen = computed(() => !isDesktop.value)

const type = ref<ProviderCalendarAppointmentType>('consultation')
const dayKey = ref('')
const time = ref('09:00')
const pricePlanId = ref<string | null>(null)
const clientProfileId = ref<string>('')
const selectedKnownClientId = ref<string>('')
const notes = ref<string>('')

const inferredClients = computed(() => props.knownClients)

/**
 * Durée calculée depuis le price plan sélectionné (consultation) ou fixe (discovery).
 */
const computedDurationMinutes = computed<number>(() => {
  if (type.value === 'discovery') return 15
  const selectedPlan = props.consultationPricePlans.find(plan => plan.id === pricePlanId.value)
  return selectedPlan?.durationMinutes ?? 60
})

const startAt = computed(() => {
  const iso = zonedLocalDateTimeToUtcIso({
    dayKey: dayKey.value,
    time: time.value,
    timeZone: props.timeZone
  })
  return iso
})

const localValidationError = computed(() => {
  if (!startAt.value) return 'Date ou heure invalide.'
  if (!clientProfileId.value.trim()) return 'Sélectionnez une cliente.'
  if (type.value === 'consultation' && !pricePlanId.value) {
    return 'Sélectionnez un tarif de consultation.'
  }
  return null
})

watch(
  () => props.open,
  (next) => {
    if (!next) return
    emit('reset')

    dayKey.value = props.initialDayKey
    time.value = minutesToHHmm(props.initialMinutes)
    type.value = 'consultation'
    notes.value = ''
    selectedKnownClientId.value = ''

    // Reset price plan selection
    pricePlanId.value = null

    // Pre-select first active plan if only one
    const activePlans = props.consultationPricePlans.filter(plan => plan.isActive)
    if (activePlans.length === 1) {
      pricePlanId.value = activePlans[0]!.id
    }

    if (inferredClients.value.length === 1) {
      clientProfileId.value = inferredClients.value[0]!.value
    } else {
      clientProfileId.value = ''
    }
  }
)

watch(
  () => type.value,
  (next) => {
    // Reset price plan selection when switching type
    if (next === 'discovery') {
      pricePlanId.value = null
    }
  }
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function applyClientSelection(value: string) {
  selectedKnownClientId.value = value
  if (value) clientProfileId.value = value
}

function submit() {
  if (props.loading) return
  if (localValidationError.value) return
  if (!startAt.value) return

  const baseBody = {
    startAt: startAt.value,
    clientProfileId: clientProfileId.value.trim(),
    notes: notes.value.trim() ? notes.value.trim() : null
  }

  if (type.value === 'discovery') {
    emit('submit', {
      body: {
        ...baseBody,
        type: 'discovery'
      }
    })
  } else {
    // Consultation : envoie pricePlanId (pas durationMinutes)
    if (!pricePlanId.value) return

    emit('submit', {
      body: {
        ...baseBody,
        type: 'consultation',
        pricePlanId: pricePlanId.value
      }
    })
  }
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
      Créer un rendez-vous
    </template>
    <template #description>
      Fuseau : {{ timeZone }} · Choisissez un type, une date et une cliente.
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
              Type
            </label>
            <USelect
              v-model="type"
              :items="[
                { label: 'Consultation', value: 'consultation' },
                { label: 'Discovery', value: 'discovery' }
              ]"
              :disabled="loading"
            />
            <p
              v-if="fieldErrors?.type"
              class="text-xs font-bold text-[color:var(--color-error)]"
            >
              {{ fieldErrors.type }}
            </p>
          </div>

          <div class="grid gap-2 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Date
              </label>
              <UInput
                v-model="dayKey"
                type="date"
                :disabled="loading"
              />
              <p
                v-if="fieldErrors?.startAt"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.startAt }}
              </p>
            </div>
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Heure
              </label>
              <UInput
                v-model="time"
                type="time"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Tarif consultation (si type = consultation) -->
          <ConsultationPlanSelector
            v-if="type === 'consultation'"
            v-model="pricePlanId"
            :plans="consultationPricePlans"
            :disabled="loading"
            :error="fieldErrors?.pricePlanId"
          />

          <!-- Durée (affichage read-only) -->
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Durée
            </label>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center rounded-full bg-[color:var(--color-surface-highlight)] px-4 py-2 text-sm font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)]"
              >
                {{ computedDurationMinutes }} min
                <span
                  v-if="type === 'discovery'"
                  class="ml-2 text-xs text-[color:var(--color-brand-secondary)]"
                >
                  (verrouillé)
                </span>
                <span
                  v-else-if="pricePlanId"
                  class="ml-2 text-xs text-[color:var(--color-brand-secondary)]"
                >
                  (depuis tarif)
                </span>
              </span>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Cliente
            </label>

            <div class="grid gap-3 md:grid-cols-2">
              <USelect
                v-model="selectedKnownClientId"
                :items="inferredClients"
                placeholder="Choisir une cliente…"
                :disabled="loading || inferredClients.length === 0"
                @update:model-value="applyClientSelection"
              />

              <UInput
                v-model="clientProfileId"
                placeholder="clientProfileId (uuid)"
                :disabled="loading"
              />
            </div>

            <p
              v-if="inferredClients.length === 0"
              class="text-xs text-[color:var(--color-brand-secondary)]"
            >
              Astuce : la liste de sélection est construite depuis les clientes déjà visibles sur la période chargée. Vous pouvez coller un UUID si nécessaire.
            </p>
            <p
              v-if="fieldErrors?.clientProfileId"
              class="text-xs font-bold text-[color:var(--color-error)]"
            >
              {{ fieldErrors.clientProfileId }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Notes (optionnel)
            </label>
            <UTextarea
              v-model="notes"
              placeholder="Notes privées…"
              :rows="4"
              variant="none"
              class="w-full rounded-input border border-[rgba(231,229,228,0.9)] bg-[color:var(--color-surface-highlight)] p-3 text-sm text-[color:var(--color-brand-primary)] focus:ring-2 focus:ring-[color:var(--color-brand-solid)]"
              :disabled="loading"
            />
            <p
              v-if="fieldErrors?.notes"
              class="text-xs font-bold text-[color:var(--color-error)]"
            >
              {{ fieldErrors.notes }}
            </p>
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
          Créer le RDV
        </UButton>
      </div>
    </template>
  </UModal>
</template>
