<template>
  <div
    class="flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
    :class="cardClasses"
  >
    <!-- Left: Icon + Info -->
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        :class="iconBgClass"
      >
        <UIcon
          :name="iconName"
          class="h-5 w-5"
          :class="iconClass"
        />
      </div>
      <div class="min-w-0">
        <p class="font-medium text-stone-900">
          {{ typeLabel }}
        </p>
        <p class="text-sm text-stone-500">
          {{ formattedDate }}
        </p>
      </div>
    </div>

    <!-- Right: Status + Action -->
    <div class="flex items-center gap-3">
      <UBadge
        :color="statusBadge.color"
        variant="soft"
        size="sm"
      >
        {{ statusBadge.label }}
      </UBadge>

      <!-- Payment CTA for unpaid consultations -->
      <UButton
        v-if="showPayButton"
        :to="`/client/consultation/pay?appointmentId=${appointment.id}`"
        size="sm"
        color="primary"
      >
        Payer
      </UButton>

      <!-- Meeting link for paid consultations -->
      <UButton
        v-else-if="appointment.meetingLink && appointment.status === 'scheduled'"
        :href="appointment.meetingLink"
        target="_blank"
        size="sm"
        variant="soft"
        color="primary"
      >
        <UIcon
          name="lucide:video"
          class="mr-1 h-4 w-4"
        />
        Rejoindre
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientAppointmentItem } from '../../features/consultation/api/client-appointments.contract'

const props = defineProps<{
  appointment: ClientAppointmentItem
}>()

// Type labels
const typeLabel = computed(() =>
  props.appointment.type === 'discovery' ? 'Appel découverte' : 'Consultation'
)

// Formatted date
const formattedDate = computed(() => {
  const date = new Date(props.appointment.scheduledAt)
  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(date)
  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(date)
  return `${dateStr} à ${timeStr} · ${props.appointment.durationMinutes} min`
})

// Status badge configuration
const statusBadge = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      if (props.appointment.paymentStatus === 'unpaid') {
        return { label: 'À payer', color: 'warning' as const }
      }
      return { label: 'À venir', color: 'primary' as const }
    case 'completed':
      return { label: 'Terminé', color: 'success' as const }
    case 'cancelled':
      return { label: 'Annulé', color: 'error' as const }
    default:
      return { label: 'Inconnu', color: 'neutral' as const }
  }
})

// Icon based on type and status
const iconName = computed(() => {
  if (props.appointment.status === 'cancelled') return 'lucide:calendar-x'
  if (props.appointment.status === 'completed') return 'lucide:check-circle'
  return props.appointment.type === 'discovery' ? 'lucide:phone' : 'lucide:calendar'
})

// Icon styling
const iconBgClass = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'bg-amber-100'
        : 'bg-crepuscule-100'
    case 'completed':
      return 'bg-emerald-100'
    case 'cancelled':
      return 'bg-red-100'
    default:
      return 'bg-stone-100'
  }
})

const iconClass = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'text-amber-600'
        : 'text-crepuscule-600'
    case 'completed':
      return 'text-emerald-600'
    case 'cancelled':
      return 'text-red-600'
    default:
      return 'text-stone-600'
  }
})

// Card border styling
const cardClasses = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return props.appointment.paymentStatus === 'unpaid'
        ? 'border-amber-200 bg-amber-50/50'
        : 'border-crepuscule-100 bg-white'
    case 'completed':
      return 'border-stone-200 bg-white'
    case 'cancelled':
      return 'border-stone-200 bg-stone-50'
    default:
      return 'border-stone-200 bg-white'
  }
})

// Show pay button for unpaid scheduled consultations
const showPayButton = computed(() =>
  props.appointment.type === 'consultation'
  && props.appointment.status === 'scheduled'
  && props.appointment.paymentStatus === 'unpaid'
)
</script>
