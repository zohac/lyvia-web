<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'
import type { ConsultationPricePlanById } from '../../features/calendar/presentation/appointment-pricing'
import { formatConsultationDrawerSummary, formatCurrency, getConsultationPricePlan } from '../../features/calendar/presentation/appointment-pricing'

const props = withDefaults(
  defineProps<{
    open: boolean
    appointment: ProviderAppointmentListItem | null
    timeZone: string
    consultationPricePlansById?: ConsultationPricePlanById
    actionPending?: boolean
    actionError?: string | null
    actionFieldErrors?: Record<string, string>
  }>(),
  {
    consultationPricePlansById: () => ({}),
    actionPending: false,
    actionError: null,
    actionFieldErrors: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'edit' | 'request-cancel', payload: { appointmentId: string }): void
}>()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })

const direction = computed(() => (isDesktop.value ? 'right' : 'bottom'))
const inset = computed(() => !isDesktop.value)
const showHandle = computed(() => !isDesktop.value)

const statusLabel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  if (appointment.status === 'scheduled') return 'Planifié'
  if (appointment.status === 'completed') return 'Terminé'
  if (appointment.status === 'cancelled') return 'Annulé'
  return appointment.status
})

const statusDotClass = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'bg-stone-400'
  if (appointment.status === 'cancelled') return 'bg-red-500'
  if (appointment.status === 'completed') return 'bg-green-500'
  return 'bg-crepuscule-500'
})

const paymentLabel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  if (appointment.paymentStatus === 'paid') return 'Payé'
  if (appointment.paymentStatus === 'unpaid') return 'À payer'
  return null
})

const canEdit = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus === 'paid') return false
  return true
})

const canCancel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus === 'paid') return false
  return true
})

const editDisabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.paymentStatus === 'paid') return 'Impossible de modifier un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible de modifier un rendez-vous déjà clôturé.'
  return null
})

const cancelDisabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.paymentStatus === 'paid') return 'Impossible d’annuler un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible d’annuler un rendez-vous déjà clôturé.'
  return null
})

function formatZonedDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
    hourCycle: 'h23'
  }).format(date)
}

function accentClasses(appointment: ProviderAppointmentListItem): string {
  return [getAppointmentAccentClass(appointment), getAppointmentMetaClass(appointment)].join(' ')
}

function updateOpen(value: boolean) {
  if (props.actionPending) return
  emit('update:open', value)
}

function startEditAppointment() {
  const appointment = props.appointment
  if (!appointment) return
  if (!canEdit.value) return
  emit('edit', { appointmentId: appointment.id })
}

function requestCancelAppointment() {
  const appointment = props.appointment
  if (!appointment) return
  if (!canCancel.value) return
  emit('request-cancel', { appointmentId: appointment.id })
}

const consultationPricingSummary = computed(() => {
  const appointment = props.appointment
  if (!appointment) return null
  return formatConsultationDrawerSummary(appointment, props.consultationPricePlansById)
})

const consultationPricingDetails = computed(() => {
  const appointment = props.appointment
  if (!appointment || appointment.type !== 'consultation') return null
  const plan = getConsultationPricePlan(appointment, props.consultationPricePlansById)
  return plan
    ? { price: formatCurrency(plan.amountCents), isActive: plan.isActive }
    : { price: null, isActive: null }
})
</script>

<template>
  <UDrawer
    :open="open"
    :direction="direction"
    :dismissible="!actionPending"
    :overlay="true"
    :inset="inset"
    :handle="showHandle"
    :ui="{
      overlay: 'fixed inset-0 bg-black/25 backdrop-blur-sm',
      content: 'bg-white shadow-lg',
      handle: '!bg-stone-300',
      container: 'w-full flex flex-col gap-6 px-6 pb-8 pt-4 overflow-y-auto',
      header: 'pb-4 border-b border-stone-200',
      body: 'flex-1',
      footer: ''
    }"
    @update:open="updateOpen"
  >
    <template
      v-if="appointment"
      #header
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
              :class="accentClasses(appointment)"
            >
              {{ appointment.type === 'consultation' ? 'Consultation' : 'Discovery' }}
            </span>

            <span
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-800 ring-1 ring-stone-200"
            >
              <span
                class="inline-flex size-2 rounded-full"
                :class="statusDotClass"
                aria-hidden="true"
              />
              {{ statusLabel }}
            </span>

            <span
              v-if="paymentLabel"
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-800 ring-1 ring-stone-200"
            >
              <span
                class="inline-flex size-2 rounded-full bg-amber-500"
                aria-hidden="true"
              />
              {{ paymentLabel }}
            </span>
          </div>

          <h2 class="text-2xl font-semibold text-stone-900">
            {{ appointment.firstname }} {{ appointment.lastname }}
          </h2>
          <p class="text-sm text-stone-500">
            {{ formatZonedDateTime(appointment.startAt) }}
          </p>
          <p class="text-sm text-stone-500">
            Source : <span class="font-bold">{{ appointment.source }}</span>
          </p>
        </div>

        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full bg-white text-stone-600 ring-1 ring-stone-200 transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionPending"
          @click="updateOpen(false)"
        >
          <Icon
            name="lucide:x"
            size="18"
            aria-hidden="true"
          />
          <span class="sr-only">Fermer</span>
        </button>
      </div>
    </template>

    <template
      v-if="appointment"
      #body
    >
      <div class="grid gap-6">
        <UAlert
          v-if="actionError"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="actionError"
          icon="i-lucide-alert-circle"
        />

        <section
          v-if="appointment.type === 'consultation' && consultationPricingSummary"
          class="rounded-lg border border-stone-200 bg-stone-50 p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Tarif
            </h3>

            <span
              v-if="consultationPricingDetails?.isActive === false"
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-500 ring-1 ring-stone-200"
            >
              Inactif
            </span>
          </div>

          <div class="mt-4 grid gap-2 text-sm text-stone-500">
            <p class="text-lg font-semibold text-stone-900">
              {{ consultationPricingSummary.title }}
            </p>
            <p v-if="consultationPricingSummary.subtitle">
              {{ consultationPricingSummary.subtitle }}
            </p>
            <p
              v-if="consultationPricingDetails?.price"
              class="font-semibold text-stone-900"
            >
              {{ consultationPricingDetails.price }}
            </p>
          </div>
        </section>

        <section class="rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Notes
            </h3>

            <UTooltip
              v-if="!canEdit"
              :text="editDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 ring-1 ring-stone-200 transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Modifier
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 ring-1 ring-stone-200 transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="actionPending"
              @click="startEditAppointment"
            >
              <Icon
                name="lucide:pencil"
                size="16"
                aria-hidden="true"
              />
              Modifier
            </button>
          </div>

          <div class="mt-4 text-sm text-stone-500">
            <p
              v-if="appointment.notes"
              class="whitespace-pre-line"
            >
              {{ appointment.notes }}
            </p>
            <p
              v-else
              class="italic opacity-80"
            >
              Aucune note pour le moment.
            </p>
          </div>
        </section>

        <section class="rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Annulation
            </h3>

            <UTooltip
              v-if="!canCancel"
              :text="cancelDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 ring-1 ring-stone-200 transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Annuler
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 ring-1 ring-stone-200 transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="actionPending"
              @click="requestCancelAppointment"
            >
              <Icon
                name="lucide:ban"
                size="16"
                aria-hidden="true"
              />
              Annuler
            </button>
          </div>

          <div class="mt-4 text-sm text-stone-500">
            <p class="opacity-90">
              L'annulation envoie une notification et libère le créneau (si applicable).
            </p>
          </div>
        </section>
      </div>
    </template>

    <template
      v-else
      #body
    >
      <div class="grid gap-4">
        <p class="text-2xl font-semibold text-stone-900">
          Aucun rendez-vous sélectionné
        </p>
        <p class="text-sm text-stone-500">
          Sélectionnez un RDV dans le calendrier pour afficher ses détails.
        </p>
      </div>
    </template>
  </UDrawer>
</template>
