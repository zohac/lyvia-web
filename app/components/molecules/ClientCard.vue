<template>
  <UCard class="bg-[color:var(--color-surface-card)] transition-all hover:shadow-md hover:ring-1 hover:ring-crepuscule-100">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Client info -->
      <div class="flex items-center gap-4">
        <UAvatar
          :text="initials"
          size="lg"
          :class="avatarClass"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-[color:var(--color-text-primary)]">
            {{ clientName }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
            <a
              :href="`mailto:${client.email}`"
              class="hover:text-crepuscule-600 hover:underline"
            >
              {{ client.email }}
            </a>
            <span class="text-[color:var(--color-neutral-300)]">·</span>
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
        <!-- Badges with tooltip -->
        <div class="flex flex-wrap items-center gap-2">
          <UTooltip :text="statusMeta.description">
            <UBadge
              :color="statusMeta.color"
              variant="soft"
              size="sm"
              class="cursor-help"
            >
              <UIcon
                :name="statusMeta.icon"
                class="mr-1 h-3 w-3"
              />
              {{ statusMeta.shortLabel }}
            </UBadge>
          </UTooltip>
          <UTooltip
            v-if="isDiscoveryCancelled"
            text="Appel découverte annulé — à replanifier"
          >
            <UBadge
              color="error"
              variant="soft"
              size="sm"
              class="cursor-help"
            >
              <UIcon
                name="lucide:calendar-x"
                class="mr-1 h-3 w-3"
              />
              Annulé
            </UBadge>
          </UTooltip>
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
          <span class="text-[color:var(--color-brand-muted)]">Prochain RDV :</span>
          <span
            class="ml-1 font-medium"
            :class="nextAppointment ? 'text-[color:var(--color-text-secondary)]' : 'text-[color:var(--color-brand-muted)]'"
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
  getClientDisplayAvatarClass,
  hasDiscoveryCancelled,
  formatNextAppointment,
  formatProgramMonth
} from '../../features/clients/domain/clients'

const props = defineProps<{
  client: ProviderClientListItem
}>()

const clientName = computed(() => formatClientName(props.client))
const initials = computed(() => getClientInitials(props.client))

// Status meta (always shows base status: discovery, lead, active, paused)
const statusMeta = computed(() => getClientStatusMeta(props.client.computedStatus))

// Check if discovery is cancelled (to show additional badge)
const isDiscoveryCancelled = computed(() => hasDiscoveryCancelled(props.client))

const nextAppointment = computed(() =>
  formatNextAppointment(props.client.stats.nextAppointmentAt)
)

const programLabel = computed(() => {
  // N'affiche le mois de programme que pour les clientes actives avec un compteur > 0
  if (props.client.computedStatus !== 'active') return null
  if (!props.client.currentProgramMonth) return null
  return formatProgramMonth(props.client.currentProgramMonth)
})

// Use avatar class that considers cancelled discovery state
const avatarClass = computed(() => getClientDisplayAvatarClass(props.client))
</script>
