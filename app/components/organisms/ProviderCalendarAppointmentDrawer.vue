<script setup lang="ts">
import type { ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'
import type { ConsultationPricePlanById } from '../../features/calendar/presentation/appointment-pricing'
import { formatConsultationDrawerSummary, formatCurrency, getConsultationPricePlan } from '../../features/calendar/presentation/appointment-pricing'
import SystemAlert from '../atoms/SystemAlert.vue'

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
  if (!appointment) return 'bg-[color:var(--color-brand-muted)]'
  if (appointment.status === 'cancelled') return 'bg-[color:var(--color-error)]'
  if (appointment.status === 'completed') return 'bg-[color:var(--color-success)]'
  return 'bg-[color:var(--color-brand-primary)]'
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
      overlay: 'fixed inset-0 bg-[rgba(0,0,0,0.25)] backdrop-blur-sm',
      content: 'bg-white/92 ring-1 ring-white/60 shadow-floating backdrop-blur-md',
      handle: '!bg-[rgba(231,229,228,0.9)]',
      container: 'w-full flex flex-col gap-6 px-6 pb-8 pt-4 overflow-y-auto',
      header: 'pb-4 border-b border-[rgba(231,229,228,0.7)]',
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
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)]"
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
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)]"
            >
              <span
                class="inline-flex size-2 rounded-full bg-[color:var(--color-warning)]"
                aria-hidden="true"
              />
              {{ paymentLabel }}
            </span>
          </div>

          <h2 class="font-serif text-2xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
            {{ appointment.firstname }} {{ appointment.lastname }}
          </h2>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            {{ formatZonedDateTime(appointment.startAt) }}
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Source : <span class="font-bold">{{ appointment.source }}</span>
          </p>
        </div>

        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full bg-white text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
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
        <SystemAlert
          v-if="actionError"
          variant="error"
          title="Action impossible"
          :description="actionError"
        />

        <section
          v-if="appointment.type === 'consultation' && consultationPricingSummary"
          class="rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Tarif
            </h3>

            <span
              v-if="consultationPricingDetails?.isActive === false"
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-brand-secondary)] ring-1 ring-[rgba(231,229,228,0.8)]"
            >
              Inactif
            </span>
          </div>

          <div class="mt-4 grid gap-2 text-sm text-[color:var(--color-brand-secondary)]">
            <p class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
              {{ consultationPricingSummary.title }}
            </p>
            <p v-if="consultationPricingSummary.subtitle">
              {{ consultationPricingSummary.subtitle }}
            </p>
            <p
              v-if="consultationPricingDetails?.price"
              class="font-semibold text-[color:var(--color-brand-primary)]"
            >
              {{ consultationPricingDetails.price }}
            </p>
          </div>
        </section>

        <section class="rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Notes
            </h3>

            <UTooltip
              v-if="!canEdit"
              :text="editDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Modifier
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div class="mt-4 text-sm text-[color:var(--color-brand-secondary)]">
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

        <section class="rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
              Annulation
            </h3>

            <UTooltip
              v-if="!canCancel"
              :text="cancelDisabledReason ?? ''"
            >
              <span class="inline-flex">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                >
                  Annuler
                </button>
              </span>
            </UTooltip>

            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div class="mt-4 text-sm text-[color:var(--color-brand-secondary)]">
            <p class="opacity-90">
              L’annulation envoie une notification et libère le créneau (si applicable).
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
        <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Aucun rendez-vous sélectionné
        </p>
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          Sélectionnez un RDV dans le calendrier pour afficher ses détails.
        </p>
      </div>
    </template>
  </UDrawer>
</template>
