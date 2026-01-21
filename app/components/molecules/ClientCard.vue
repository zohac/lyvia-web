<template>
  <UCard class="bg-white transition-shadow hover:shadow-md">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Client info -->
      <div class="flex items-center gap-4">
        <UAvatar
          :text="initials"
          size="lg"
          :class="avatarClass"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-stone-900">
            {{ clientName }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <a
              :href="`mailto:${client.email}`"
              class="hover:text-crepuscule-600 hover:underline"
            >
              {{ client.email }}
            </a>
            <span class="text-stone-300">·</span>
            <a
              :href="`tel:${client.phone}`"
              class="hover:text-crepuscule-600 hover:underline"
            >
              {{ client.phone }}
            </a>
          </div>
        </div>
      </div>

      <!-- Status and actions -->
      <div class="flex flex-col items-start gap-3 sm:items-end">
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="statusMeta.color"
            variant="soft"
            size="sm"
          >
            {{ statusMeta.label }}
          </UBadge>
          <UBadge
            v-if="programLabel"
            color="neutral"
            variant="soft"
            size="sm"
          >
            {{ programLabel }}
          </UBadge>
        </div>

        <!-- Next appointment -->
        <div class="text-sm">
          <span class="text-stone-400">Prochain RDV :</span>
          <span
            class="ml-1 font-medium"
            :class="nextAppointment ? 'text-stone-700' : 'text-stone-400'"
          >
            {{ nextAppointment || 'Aucun' }}
          </span>
        </div>

        <!-- Action button -->
        <UButton
          :to="`/provider/clients/${client.clientProfileId}`"
          variant="soft"
          color="primary"
          size="sm"
        >
          Voir fiche
          <UIcon
            name="lucide:arrow-right"
            class="ml-1.5 h-4 w-4"
          />
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { ProviderClientListItem } from '../../features/clients/api/clients.contract'
import {
  formatClientName,
  getClientInitials,
  getClientStatusMeta,
  formatNextAppointment,
  formatProgramMonth
} from '../../features/clients/domain/clients'

const props = defineProps<{
  client: ProviderClientListItem
}>()

const clientName = computed(() => formatClientName(props.client))
const initials = computed(() => getClientInitials(props.client))
const statusMeta = computed(() => getClientStatusMeta(props.client.computedStatus))

const nextAppointment = computed(() =>
  formatNextAppointment(props.client.stats.nextAppointmentAt)
)

const programLabel = computed(() => {
  if (props.client.computedStatus === 'onboarding') return null
  return formatProgramMonth(props.client.currentProgramMonth)
})

const avatarClass = computed(() => {
  switch (props.client.computedStatus) {
    case 'onboarding':
      return 'bg-amber-100 text-amber-700'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-stone-100 text-stone-700'
  }
})
</script>
