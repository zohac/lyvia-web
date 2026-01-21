<script setup lang="ts">
import type { ProviderAppointmentListItem, UpdateProviderAppointmentRequest } from '../../features/calendar/api/calendar.contract'
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { minutesToHHmm, parseHHmm, zonedLocalDateTimeToUtcIso } from '../../features/calendar/domain/zoned-datetime'
import ConsultationPlanSelector from '../molecules/ConsultationPlanSelector.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    appointment: ProviderAppointmentListItem | null
    timeZone: string
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
  (event: 'submit', payload: { appointmentId: string, body: UpdateProviderAppointmentRequest }): void
}>()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const isFullScreen = computed(() => !isDesktop.value)

const dayKey = ref('')
const time = ref('09:00')
const pricePlanId = ref<string | null>(null)
const notes = ref<string>('')

const localValidationError = ref<string | null>(null)

/**
 * Plan actuel (chargé depuis appointment.pricePlanId).
 */
const currentPlan = computed<ConsultationPricePlan | null>(() => {
  const appointment = props.appointment
  if (!appointment || appointment.type !== 'consultation' || !appointment.pricePlanId) return null
  return props.consultationPricePlans.find(plan => plan.id === appointment.pricePlanId) ?? null
})

/**
 * Durée calculée depuis le price plan sélectionné (consultation) ou fixe (discovery).
 */
const computedDurationMinutes = computed<number>(() => {
  const appointment = props.appointment
  if (!appointment) return 60
  if (appointment.type === 'discovery') return 15

  // Si un nouveau plan est sélectionné
  if (pricePlanId.value) {
    const selectedPlan = props.consultationPricePlans.find(plan => plan.id === pricePlanId.value)
    return selectedPlan?.durationMinutes ?? appointment.durationMinutes
  }

  // Sinon, utiliser le plan actuel
  return currentPlan.value?.durationMinutes ?? appointment.durationMinutes
})

const canEdit = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.type === 'consultation' && appointment.paymentStatus === 'paid') return false
  return true
})

const disabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.status !== 'scheduled') return 'Impossible de modifier un rendez-vous déjà clôturé.'
  if (appointment.type === 'consultation' && appointment.paymentStatus === 'paid') {
    return 'Impossible de modifier un rendez-vous payé.'
  }
  return null
})

const typeLabel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  return appointment.type === 'consultation' ? 'Consultation' : 'Discovery'
})

function accentClasses(appointment: ProviderAppointmentListItem): string {
  return [getAppointmentAccentClass(appointment), getAppointmentMetaClass(appointment)].join(' ')
}

watch(
  () => props.open,
  (next) => {
    if (!next) {
      localValidationError.value = null
    }
  }
)

watch(
  () => props.appointment?.id,
  (next) => {
    localValidationError.value = null
    const appointment = props.appointment
    if (!appointment || !next) return

    const date = new Date(appointment.startAt)
    dayKey.value = getYmdInTimeZone(date, props.timeZone)

    const hoursMinutes = new Intl.DateTimeFormat('en-GB', {
      timeZone: props.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(date)

    const parsedTime = parseHHmm(hoursMinutes)
    time.value = parsedTime ? minutesToHHmm(parsedTime.hour * 60 + parsedTime.minute) : '09:00'

    // Reset price plan selection (user can change it)
    pricePlanId.value = null
    notes.value = appointment.notes ?? ''
  },
  { immediate: true }
)

function updateOpen(value: boolean) {
  if (props.loading) return
  emit('update:open', value)
}

function submit() {
  const appointment = props.appointment
  if (!appointment) return

  localValidationError.value = null

  if (!canEdit.value) {
    localValidationError.value = disabledReason.value ?? 'Modification indisponible.'
    return
  }

  const utcStartAt = zonedLocalDateTimeToUtcIso({
    dayKey: dayKey.value,
    time: time.value,
    timeZone: props.timeZone
  })

  if (!utcStartAt) {
    localValidationError.value = 'Veuillez vérifier la date et l\'heure.'
    return
  }

  const trimmedNotes = notes.value.trim()

  // Consultation : envoie pricePlanId si changement de plan
  if (appointment.type === 'consultation') {
    emit('submit', {
      appointmentId: appointment.id,
      body: {
        startAt: utcStartAt,
        pricePlanId: pricePlanId.value ?? undefined,
        notes: trimmedNotes ? trimmedNotes : null
      }
    })
  } else {
    // Discovery : pas de pricePlanId
    emit('submit', {
      appointmentId: appointment.id,
      body: {
        startAt: utcStartAt,
        notes: trimmedNotes ? trimmedNotes : null
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
    title="Modifier le rendez-vous"
    @update:open="updateOpen"
  >
    <template #description>
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="appointment"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
          :class="accentClasses(appointment)"
        >
          {{ typeLabel }}
        </span>
        <span class="text-stone-500">Fuseau : {{ timeZone }}</span>
      </div>
    </template>

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

        <section class="rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div class="grid gap-4">
            <div class="grid gap-2 md:grid-cols-2">
              <div class="grid gap-2">
                <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Date
                </label>
                <UInput
                  v-model="dayKey"
                  type="date"
                  :disabled="loading || !canEdit"
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
                  :disabled="loading || !canEdit"
                />
              </div>
            </div>

            <!-- Tarif actuel (consultation) -->
            <div
              v-if="appointment?.type === 'consultation' && currentPlan"
              class="grid gap-3"
            >
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Tarif actuel
              </label>
              <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="grid gap-1">
                    <div class="flex items-center gap-2">
                      <span class="text-base font-bold text-stone-900">
                        {{ currentPlan.label }}
                      </span>
                      <span
                        v-if="!currentPlan.isActive"
                        class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700"
                      >
                        Inactif
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-stone-500">
                      <Icon
                        name="lucide:clock"
                        size="14"
                        aria-hidden="true"
                      />
                      <span>{{ currentPlan.durationMinutes }} min</span>
                      <span class="text-stone-300">·</span>
                      <span>{{ new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(currentPlan.amountCents / 100) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Changer de tarif (consultation) -->
            <div
              v-if="appointment?.type === 'consultation'"
              class="grid gap-3"
            >
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Changer de tarif (optionnel)
              </label>
              <ConsultationPlanSelector
                v-model="pricePlanId"
                :plans="consultationPricePlans"
                :disabled="loading || !canEdit"
                :error="fieldErrors?.pricePlanId"
              />
              <p
                v-if="!currentPlan?.isActive"
                class="text-xs text-amber-600"
              >
                Le tarif actuel est inactif. Sélectionnez un nouveau tarif pour continuer.
              </p>
            </div>

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
                    v-if="appointment?.type === 'discovery'"
                    class="ml-2 text-xs text-stone-500"
                  >
                    (verrouillé)
                  </span>
                  <span
                    v-else-if="pricePlanId"
                    class="ml-2 text-xs text-stone-500"
                  >
                    (nouveau tarif)
                  </span>
                  <span
                    v-else-if="currentPlan"
                    class="ml-2 text-xs text-stone-500"
                  >
                    (depuis tarif)
                  </span>
                </span>
              </div>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Notes (optionnel)
              </label>
              <UTextarea
                v-model="notes"
                placeholder="Notes privées…"
                :rows="4"
                :disabled="loading || !canEdit"
              />
              <p
                v-if="fieldErrors?.notes"
                class="text-xs font-bold text-red-600"
              >
                {{ fieldErrors.notes }}
              </p>
            </div>
          </div>
        </section>
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

        <UTooltip
          v-if="!canEdit"
          :text="disabledReason ?? ''"
        >
          <span class="inline-flex">
            <UButton
              color="primary"
              disabled
            >
              Enregistrer
            </UButton>
          </span>
        </UTooltip>

        <UButton
          v-else
          color="primary"
          :loading="loading"
          @click="submit"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
