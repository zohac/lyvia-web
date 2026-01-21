<script setup lang="ts">
import type { CancelProviderAppointmentRequest, ProviderAppointmentListItem } from '../../features/calendar/api/calendar.contract'
import { getAppointmentAccentClass, getAppointmentMetaClass } from '../../features/calendar/presentation/appointment-style'

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
  if (appointment.paymentStatus === 'paid') return 'Impossible d\'annuler un rendez-vous payé.'
  if (appointment.status !== 'scheduled') return 'Impossible d\'annuler un rendez-vous déjà clôturé.'
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
    title="Annuler le rendez-vous"
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
          v-else-if="!canCancel"
          color="warning"
          variant="soft"
          title="Annulation indisponible"
          :description="disabledReason ?? 'Annulation indisponible.'"
          icon="i-lucide-alert-triangle"
        />

        <section class="rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
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
                class="text-xs font-bold text-red-600"
              >
                {{ fieldErrors.reason }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Précision (optionnel)
              </label>
              <UTextarea
                v-model="reasonText"
                :rows="3"
                placeholder="Ex : motif, contexte, consigne…"
                :disabled="loading || !canCancel"
              />
              <p
                v-if="fieldErrors?.reasonText"
                class="text-xs font-bold text-red-600"
              >
                {{ fieldErrors.reasonText }}
              </p>
            </div>

            <p class="text-sm text-stone-500">
              L'annulation envoie une notification et libère le créneau (si applicable).
            </p>
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
          Retour
        </UButton>

        <UButton
          color="error"
          :loading="loading"
          :disabled="!canCancel"
          @click="submit"
        >
          Confirmer l'annulation
        </UButton>
      </div>
    </template>
  </UModal>
</template>
