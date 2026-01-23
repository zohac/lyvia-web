<script setup lang="ts">
import type { ProviderAppointmentListItem, ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'
import { minutesToHHmm, zonedLocalDateTimeToUtcIso } from '../../features/calendar/domain/zoned-datetime'
import ConsultationPlanSelector from '../molecules/ConsultationPlanSelector.vue'

type ClientOption = {
  label: string
  value: string
  stage: 'discovery' | 'lead' | 'active' | 'paused'
  hasActiveDiscovery?: boolean
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
    consultationPricePlans?: ConsultationPricePlan[]
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
  | { type: 'consultation', pricePlanId: string }
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

/**
 * Filtre les clients selon le type de RDV sélectionné (modèle 4-stages).
 *
 * Discovery (replanification US-3) :
 * - stage='lead' : discovery effectué ou annulé, en attente de décision
 * - hasActiveDiscovery=false : pas de discovery scheduled/completed actif
 * - Cas d'usage : provider planifie un nouveau discovery pour un lead
 *
 * Consultation :
 * - stage='active' : client converti, accompagnement en cours
 */
const inferredClients = computed(() => {
  if (type.value === 'discovery') {
    // US-2: Clients éligibles pour discovery = stage 'lead' sans discovery actif
    return props.knownClients.filter(c => c.stage === 'lead' && !c.hasActiveDiscovery)
  }
  // Consultation : uniquement les clientes actives
  return props.knownClients.filter(c => c.stage === 'active')
})

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

    // Reset client selection when type changes (filtered list changes)
    clientProfileId.value = ''
    selectedKnownClientId.value = ''
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
    title="Créer un rendez-vous"
    :description="`Fuseau : ${timeZone} · Choisissez un type, une date et une cliente.`"
    @update:open="updateOpen"
  >
    <template #body>
      <div class="grid gap-6">
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

        <div class="grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
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
              class="text-xs font-bold text-red-600"
            >
              {{ fieldErrors.type }}
            </p>
          </div>

          <div class="grid gap-2 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Date
              </label>
              <UInput
                v-model="dayKey"
                type="date"
                :disabled="loading"
              />
              <p
                v-if="fieldErrors?.startAt"
                class="text-xs font-bold text-red-600"
              >
                {{ fieldErrors.startAt }}
              </p>
            </div>
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
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
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Durée
            </label>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-900 ring-1 ring-stone-200"
              >
                {{ computedDurationMinutes }} min
                <span
                  v-if="type === 'discovery'"
                  class="ml-2 text-xs text-stone-500"
                >
                  (verrouillé)
                </span>
                <span
                  v-else-if="pricePlanId"
                  class="ml-2 text-xs text-stone-500"
                >
                  (depuis tarif)
                </span>
              </span>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
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
              v-if="inferredClients.length === 0 && type === 'discovery'"
              class="text-xs text-amber-600"
            >
              Aucun lead éligible pour un discovery. Seuls les leads (discovery effectué ou annulé) sans discovery actif peuvent en obtenir un nouveau.
            </p>
            <p
              v-else-if="inferredClients.length === 0 && type === 'consultation'"
              class="text-xs text-amber-600"
            >
              Aucune cliente active éligible pour une consultation. Convertissez d'abord un lead après son appel découverte.
            </p>
            <p
              v-if="fieldErrors?.clientProfileId"
              class="text-xs font-bold text-red-600"
            >
              {{ fieldErrors.clientProfileId }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Notes (optionnel)
            </label>
            <UTextarea
              v-model="notes"
              placeholder="Notes privées…"
              :rows="4"
              :disabled="loading"
            />
            <p
              v-if="fieldErrors?.notes"
              class="text-xs font-bold text-red-600"
            >
              {{ fieldErrors.notes }}
            </p>
          </div>
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
          Créer le RDV
        </UButton>
      </div>
    </template>
  </UModal>
</template>
