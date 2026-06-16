<script setup lang="ts">
import type { ProviderAppointmentListItem, UpdateProviderAppointmentRequest } from '../../features/calendar/api/calendar.contract'
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'
import { getAppointmentTypeConfig, getAppointmentDisplayStatus, STATUS_CONFIG } from '../../features/calendar/presentation/appointment-style'
import { formatCurrency } from '../../features/calendar/presentation/appointment-pricing'
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { minutesToHHmm, parseHHmm, zonedLocalDateTimeToUtcIso } from '../../features/calendar/domain/zoned-datetime'

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

const TYPE_ICON: Record<ProviderAppointmentListItem['type'], string> = {
  discovery: 'lucide:phone',
  consultation: 'lucide:video',
  free_followup: 'lucide:heart-handshake'
}
const TYPE_LABEL: Record<ProviderAppointmentListItem['type'], string> = {
  discovery: 'Découverte',
  consultation: 'Consultation',
  free_followup: 'Suivi'
}

const dayKey = ref('')
const time = ref('09:00')
const pricePlanId = ref<string | null>(null)
const notes = ref<string>('')
const meetingLink = ref<string>('')

const localValidationError = ref<string | null>(null)

/** Plan actuel (chargé depuis appointment.pricePlanId) — peut être inactif. */
const currentPlan = computed<ConsultationPricePlan | null>(() => {
  const appointment = props.appointment
  if (!appointment || appointment.type !== 'consultation' || !appointment.pricePlanId) return null
  return props.consultationPricePlans.find(plan => plan.id === appointment.pricePlanId) ?? null
})

const activePlans = computed(() => {
  return props.consultationPricePlans
    .filter(plan => plan.isActive)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

/** Options du select tarif : plans actifs + le plan courant s'il est inactif (pour rester sélectionnable).
 *  Le label du plan est saisi par la praticienne et contient déjà durée + prix. */
const tarifOptions = computed(() => {
  const options = activePlans.value.map(plan => ({
    label: plan.label,
    value: plan.id
  }))
  const current = currentPlan.value
  if (current && !current.isActive) {
    options.unshift({
      label: `${current.label} (inactif)`,
      value: current.id
    })
  }
  return options
})

const hasTarifOptions = computed(() => tarifOptions.value.length > 0)

const selectedPlan = computed<ConsultationPricePlan | null>(() => {
  if (!pricePlanId.value) return currentPlan.value
  return props.consultationPricePlans.find(plan => plan.id === pricePlanId.value) ?? currentPlan.value
})

const computedDurationMinutes = computed<number>(() => {
  const appointment = props.appointment
  if (!appointment) return 60
  if (appointment.type === 'discovery') return 15
  return selectedPlan.value?.durationMinutes ?? appointment.durationMinutes
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

const clientName = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Rendez-vous'
  const name = `${appointment.firstname} ${appointment.lastname}`.trim()
  return name || 'Rendez-vous'
})

const headerBadgeStyle = computed(() => {
  const config = getAppointmentTypeConfig(props.appointment?.type ?? 'consultation')
  return { background: config.soft, color: config.softText, borderColor: config.fill }
})
const headerIcon = computed(() => TYPE_ICON[props.appointment?.type ?? 'consultation'])
const headerLabel = computed(() => TYPE_LABEL[props.appointment?.type ?? 'consultation'])

const statusConfig = computed(() => {
  if (!props.appointment) return STATUS_CONFIG.planned
  return STATUS_CONFIG[getAppointmentDisplayStatus(props.appointment)]
})
const statusPillStyle = computed(() => ({
  background: statusConfig.value.chipBg,
  color: statusConfig.value.chipText,
  borderColor: statusConfig.value.chipBorder
}))

const recapPriceLabel = computed(() => {
  if (props.appointment?.type !== 'consultation') return 'Gratuit'
  if (!selectedPlan.value) return 'Sélectionnez un tarif'
  return formatCurrency(selectedPlan.value.amountCents)
})
const recapCaption = computed(() => {
  return props.appointment?.type === 'consultation'
    ? 'Réglé sur le compte Stripe de la praticienne'
    : 'Rendez-vous gratuit'
})

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

    // Pré-remplit le tarif courant (modifiable). Discovery : pas de tarif.
    pricePlanId.value = appointment.type === 'consultation' ? (appointment.pricePlanId ?? null) : null
    notes.value = appointment.notes ?? ''
    meetingLink.value = appointment.meetingLink ?? ''
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

  if (appointment.type === 'consultation') {
    const trimmedMeetingLink = meetingLink.value.trim()
    emit('submit', {
      appointmentId: appointment.id,
      body: {
        startAt: utcStartAt,
        pricePlanId: pricePlanId.value ?? undefined,
        notes: trimmedNotes ? trimmedNotes : null,
        meetingLink: trimmedMeetingLink || null
      }
    })
  } else {
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
  <USlideover
    :open="open"
    :dismissible="!loading"
    :title="clientName"
    description="Modifiez la date, l'heure, le tarif ou les notes du rendez-vous."
    :ui="{
      content: 'w-full sm:max-w-[460px]',
      body: 'bg-[color:var(--color-surface-page)]',
      description: 'sr-only'
    }"
    @update:open="updateOpen"
  >
    <template #title>
      <span
        v-if="appointment"
        class="mb-3.5 flex flex-wrap items-center gap-2 not-italic"
      >
        <span
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
          :style="headerBadgeStyle"
        >
          <UIcon
            :name="headerIcon"
            class="size-3.5"
          />
          {{ headerLabel }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
          :style="statusPillStyle"
        >
          <span
            class="size-1.5 rounded-full"
            :style="{ background: statusConfig.dot }"
            aria-hidden="true"
          />
          {{ statusConfig.label }}
        </span>
      </span>
      <span class="block font-[family-name:var(--font-serif)] text-2xl font-bold italic text-[color:var(--color-text-primary)]">
        {{ clientName }}
      </span>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="error"
          icon="i-lucide-alert-circle"
        />

        <p
          v-else-if="!canEdit && disabledReason"
          class="rounded-xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-muted)]"
        >
          {{ disabledReason }}
        </p>

        <!-- Tarif de la consultation -->
        <div
          v-if="appointment?.type === 'consultation'"
          class="grid gap-2"
        >
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Tarif de la consultation
          </label>
          <USelect
            :model-value="pricePlanId ?? undefined"
            :items="tarifOptions"
            placeholder="Choisir un tarif…"
            :disabled="loading || !canEdit || !hasTarifOptions"
            @update:model-value="pricePlanId = $event"
          />
          <p
            v-if="currentPlan && !currentPlan.isActive"
            class="text-xs text-[color:var(--color-sunset-600)]"
          >
            Le tarif actuel est inactif. Sélectionnez un nouveau tarif pour continuer.
          </p>
          <p
            v-if="fieldErrors?.pricePlanId"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.pricePlanId }}
          </p>
        </div>

        <!-- Date / Heure de début -->
        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Date
            </label>
            <UInput
              v-model="dayKey"
              type="date"
              :disabled="loading || !canEdit"
            />
            <p
              v-if="fieldErrors?.startAt"
              class="text-xs font-bold text-[color:var(--color-error-600)]"
            >
              {{ fieldErrors.startAt }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Heure de début
            </label>
            <UInput
              v-model="time"
              type="time"
              :disabled="loading || !canEdit"
            />
          </div>
        </div>

        <!-- Lien visio (consultation uniquement) -->
        <div
          v-if="appointment?.type === 'consultation'"
          class="grid gap-2"
        >
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Lien visio (optionnel)
          </label>
          <UInput
            v-model="meetingLink"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            :disabled="loading || !canEdit"
          />
          <p class="text-xs leading-relaxed text-[color:var(--color-text-muted)]">
            Ce lien sera inclus dans les emails de rappel.
          </p>
          <p
            v-if="fieldErrors?.meetingLink"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.meetingLink }}
          </p>
        </div>

        <!-- Notes -->
        <div class="grid gap-2">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Notes (optionnel)
          </label>
          <UTextarea
            v-model="notes"
            placeholder="Note privée (non visible par la cliente)"
            :rows="3"
            :disabled="loading || !canEdit"
          />
          <p
            v-if="fieldErrors?.notes"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.notes }}
          </p>
        </div>

        <!-- Récap tarif + durée -->
        <div class="flex items-center gap-3 rounded-xl bg-[color:var(--color-surface-muted)] px-4 py-3.5">
          <span class="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)]">
            <UIcon
              name="lucide:wallet"
              class="size-4"
            />
          </span>
          <div class="leading-tight">
            <div class="text-sm font-semibold text-[color:var(--color-text-primary)]">
              {{ recapPriceLabel }}
              <span class="font-normal text-[color:var(--color-text-muted)]"> · {{ computedDurationMinutes }} min</span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              {{ recapCaption }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
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
              icon="lucide:check"
              disabled
            >
              Enregistrer
            </UButton>
          </span>
        </UTooltip>

        <UButton
          v-else
          color="primary"
          icon="lucide:check"
          :loading="loading"
          @click="submit"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
