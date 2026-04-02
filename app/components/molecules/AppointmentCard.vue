<template>
  <UCard
    class="bg-[color:var(--color-surface-card)] transition-shadow hover:shadow-md"
    :class="{
      'ring-2 ring-amber-200': isPastScheduled,
      'opacity-75': appointment.status === 'cancelled'
    }"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Client info -->
      <div class="flex items-center gap-4">
        <UAvatar
          :text="clientInitials"
          size="lg"
          :class="avatarClass"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-[color:var(--color-text-primary)]">
            {{ clientName }}
          </p>
          <p class="mt-0.5 text-sm text-[color:var(--color-text-muted)]">
            {{ formattedDateTime }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <a
              :href="`mailto:${appointment.client.email}`"
              class="text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
            >
              {{ appointment.client.email }}
            </a>
            <span class="text-[color:var(--color-neutral-300)]">·</span>
            <a
              :href="`tel:${appointment.client.phone}`"
              class="text-[color:var(--color-text-secondary)] hover:text-crepuscule-600 hover:underline"
            >
              {{ appointment.client.phone }}
            </a>
          </div>
        </div>
      </div>

      <!-- Status and actions -->
      <div class="flex flex-col items-start gap-3 sm:items-end">
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="statusBadgeColor"
            variant="soft"
            size="sm"
          >
            {{ isPastScheduled ? 'En attente' : statusLabel }}
          </UBadge>
          <UBadge
            :color="appointment.client.stage === 'active' ? 'success' : 'warning'"
            variant="soft"
            size="sm"
          >
            {{ appointment.client.stage === 'active' ? 'Active' : 'Lead' }}
          </UBadge>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            <UIcon
              name="lucide:clock"
              class="mr-1 h-3 w-3"
            />
            {{ formattedTime }}
          </UBadge>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            <UIcon
              name="lucide:timer"
              class="mr-1 h-3 w-3"
            />
            15 min
          </UBadge>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Scheduled: Conclude + Cancel -->
          <template v-if="appointment.status === 'scheduled'">
            <UButton
              variant="soft"
              color="primary"
              size="sm"
              :disabled="isUpdating"
              @click="emit('conclude', appointment)"
            >
              <UIcon
                name="lucide:check-circle"
                class="mr-1.5 h-4 w-4"
              />
              Conclure
            </UButton>
            <UButton
              variant="ghost"
              color="error"
              size="sm"
              :disabled="isUpdating"
              @click="emit('cancel', appointment)"
            >
              <UIcon
                name="lucide:x-circle"
                class="mr-1.5 h-4 w-4"
              />
              Annuler
            </UButton>
          </template>

          <!-- Completed lead: Convert button -->
          <template v-else-if="appointment.status === 'completed' && appointment.client.stage === 'lead'">
            <UButton
              variant="soft"
              color="success"
              size="sm"
              :disabled="isUpdating"
              @click="emit('convert', appointment)"
            >
              <UIcon
                name="lucide:sparkles"
                class="mr-1.5 h-4 w-4"
              />
              Convertir en cliente
            </UButton>
          </template>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { DiscoveryAppointmentListItem } from '../../features/appointments/api/appointments.contract'

const props = defineProps<{
  appointment: DiscoveryAppointmentListItem
  updatingId: string | null
  timezone: string
}>()

const emit = defineEmits<{
  conclude: [appointment: DiscoveryAppointmentListItem]
  cancel: [appointment: DiscoveryAppointmentListItem]
  convert: [appointment: DiscoveryAppointmentListItem]
}>()

const isUpdating = computed(() => props.updatingId === props.appointment.id)

const isPastScheduled = computed(() => {
  if (props.appointment.status !== 'scheduled') return false
  return new Date(props.appointment.scheduledAt).getTime() < Date.now()
})

const clientName = computed(() => {
  return `${props.appointment.client.firstname} ${props.appointment.client.lastname}`.trim()
})

const clientInitials = computed(() => {
  const firstname = props.appointment.client.firstname?.trim() ?? ''
  const lastname = props.appointment.client.lastname?.trim() ?? ''
  const initials = `${firstname.slice(0, 1)}${lastname.slice(0, 1)}`.toUpperCase()
  return initials || 'C'
})

const avatarClass = computed(() => {
  if (isPastScheduled.value) return 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]'

  switch (props.appointment.status) {
    case 'scheduled':
      return 'bg-crepuscule-100 text-crepuscule-700'
    case 'completed':
      return 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
    case 'cancelled':
      return 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]'
    default:
      return 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]'
  }
})

const statusLabel = computed(() => {
  switch (props.appointment.status) {
    case 'scheduled':
      return 'Planifié'
    case 'completed':
      return 'Terminé'
    case 'cancelled':
      return 'Annulé'
    default:
      return props.appointment.status
  }
})

const statusBadgeColor = computed(() => {
  if (isPastScheduled.value) return 'warning'

  switch (props.appointment.status) {
    case 'scheduled':
      return 'primary'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
})

const formattedDateTime = computed(() => {
  const date = new Date(props.appointment.scheduledAt)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
})

const formattedTime = computed(() => {
  const date = new Date(props.appointment.scheduledAt)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
})
</script>
