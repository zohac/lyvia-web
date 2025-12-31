<script setup lang="ts">
import type { CancelProviderAppointmentRequest, ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'
import SystemAlert from '../atoms/SystemAlert.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    appointment: ProviderAppointmentListItem | null
    timeZone: string
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
  (event: 'submit', payload: { appointmentId: string, body: CancelProviderAppointmentRequest }): void
}>()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const isFullScreen = computed(() => !isDesktop.value)

const reason = ref<CancelProviderAppointmentRequest['reason']>('PROVIDER_UNAVAILABLE')
const reasonText = ref<string>('')

const canCancel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false
  if (appointment.status !== 'scheduled') return false
  if (appointment.paymentStatus === 'paid') return false
  return true
})

const disabledReason = computed(() => {
  const appointment = props.appointment
  if (!appointment) return 'Aucun rendez-vous sélectionné.'
  if (appointment.paymentStatus === 'paid') return 'Impossible d’annuler un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible d’annuler un rendez-vous déjà clôturé.'
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

function updateOpen(value: boolean) {
  if (props.loading) return
  emit('update:open', value)
}

watch(
  () => props.open,
  (next) => {
    if (!next) return
    reason.value = 'PROVIDER_UNAVAILABLE'
    reasonText.value = ''
  }
)

function submit() {
  const appointment = props.appointment
  if (!appointment) return
  if (props.loading) return

  if (!canCancel.value) return

  const trimmedText = reasonText.value.trim()

  emit('submit', {
    appointmentId: appointment.id,
    body: {
      reason: reason.value,
      reasonText: trimmedText ? trimmedText : null
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
      Annuler le rendez-vous
    </template>

    <template #description>
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="appointment"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
          :class="accentClasses(appointment)"
        >
          {{ typeLabel }}
        </span>
        <span>Fuseau : {{ timeZone }}</span>
      </div>
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
          v-else-if="!canCancel"
          variant="warning"
          title="Annulation indisponible"
          :description="disabledReason ?? 'Annulation indisponible.'"
        />

        <section class="rounded-blob-d border border-white/70 bg-white/70 p-5 shadow-soft">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Motif
              </label>
              <USelect
                v-model="reason"
                :items="[
                  { label: 'Indisponible', value: 'PROVIDER_UNAVAILABLE' },
                  { label: 'Demande cliente', value: 'CLIENT_REQUEST' },
                  { label: 'Urgence', value: 'EMERGENCY' },
                  { label: 'Autre', value: 'OTHER' }
                ]"
                :disabled="loading || !canCancel"
              />
              <p
                v-if="fieldErrors?.reason"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.reason }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand-secondary)]">
                Précision (optionnel)
              </label>
              <UTextarea
                v-model="reasonText"
                :rows="3"
                variant="none"
                placeholder="Ex : motif, contexte, consigne…"
                class="w-full rounded-input border border-[rgba(231,229,228,0.9)] bg-[color:var(--color-surface-highlight)] p-3 text-sm text-[color:var(--color-brand-primary)] focus:ring-2 focus:ring-[color:var(--color-brand-solid)]"
                :disabled="loading || !canCancel"
              />
              <p
                v-if="fieldErrors?.reasonText"
                class="text-xs font-bold text-[color:var(--color-error)]"
              >
                {{ fieldErrors.reasonText }}
              </p>
            </div>

            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              L’annulation envoie une notification et libère le créneau (si applicable).
            </p>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[color:var(--color-brand-primary)] ring-1 ring-[rgba(231,229,228,0.8)] transition-base hover:bg-[rgba(231,229,228,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Retour
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full bg-[color:var(--color-error)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:bg-[rgba(239,68,68,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || !canCancel"
          @click="submit"
        >
          Confirmer l’annulation
        </button>
      </div>
    </template>
  </UModal>
</template>
