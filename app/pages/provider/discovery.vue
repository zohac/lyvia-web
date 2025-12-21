<script setup lang="ts">
import type {
  DiscoveryAppointmentListItem,
  ListDiscoveryAppointmentsResponse,
  UpdateAppointmentStatusResponse
} from '../../features/appointments/api/appointments.contract'
import { mapAppointmentErrorCodeToUserMessage } from '../../features/appointments/api/appointments-error'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import SystemAlert from '../../components/atoms/SystemAlert.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Appels discovery'
})

type ActionKind = 'complete' | 'cancel'

const systemError = ref<string | null>(null)
const updatingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData<ListDiscoveryAppointmentsResponse>('provider-discovery-appointments', async () => {
  try {
    return await apiFetch<ListDiscoveryAppointmentsResponse>('/appointments/discovery', {
      method: 'GET'
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      systemError.value = mapAppointmentErrorCodeToUserMessage(err.apiError.code)
      return { timezone: 'Europe/Paris', appointments: [] }
    }
    systemError.value = 'Une erreur est survenue. Veuillez réessayer.'
    return { timezone: 'Europe/Paris', appointments: [] }
  }
})

const timezone = computed(() => data.value?.timezone ?? 'Europe/Paris')

const appointments = computed(() => data.value?.appointments ?? [])

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone.value,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function formatClientName(item: DiscoveryAppointmentListItem): string {
  return `${item.client.firstname} ${item.client.lastname}`.trim()
}

function statusLabel(status: DiscoveryAppointmentListItem['status']): string {
  switch (status) {
    case 'scheduled':
      return 'Planifié'
    case 'completed':
      return 'Terminé'
    case 'cancelled':
      return 'Annulé'
    default:
      return status
  }
}

function statusClass(status: DiscoveryAppointmentListItem['status']): string {
  switch (status) {
    case 'scheduled':
      return 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)]'
    case 'completed':
      return 'bg-[rgba(85,59,94,0.12)] text-[color:var(--color-brand-primary)]'
    case 'cancelled':
      return 'bg-[rgba(200,121,100,0.16)] text-[color:var(--color-brand-primary)]'
    default:
      return 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)]'
  }
}

async function updateAppointmentStatus(appointmentId: string, kind: ActionKind) {
  systemError.value = null
  if (updatingId.value) return
  updatingId.value = appointmentId

  try {
    if (kind === 'cancel') {
      const confirmed = confirm('Annuler cet appel découverte ?')
      if (!confirmed) return
    }

    const body
      = kind === 'complete'
        ? { status: 'completed' as const }
        : { status: 'cancelled' as const, cancelledByRole: 'PROVIDER' as const }

    await apiFetch<UpdateAppointmentStatusResponse>(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body
    })

    await refresh()
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      systemError.value = mapAppointmentErrorCodeToUserMessage(err.apiError.code)
      return
    }
    systemError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <section class="grid gap-6">
    <SystemAlert
      v-if="systemError"
      variant="error"
      title="Impossible de mettre à jour"
      :description="systemError"
    />

    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div class="grid gap-1">
        <h2 class="font-serif text-[1.25rem] font-semibold leading-[var(--leading-normal)] text-[color:var(--color-brand-primary)]">
          Appels discovery
        </h2>
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          Fuseau d’affichage : {{ timezone }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="pending"
        @click="() => refresh()"
      >
        Actualiser
      </button>
    </div>

    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]">
      <div class="border-b border-[color:var(--color-brand-subtle)] px-6 py-4">
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          {{ appointments.length }} appel(s)
        </p>
      </div>

      <div
        v-if="pending"
        class="px-6 py-8 text-sm text-[color:var(--color-brand-secondary)]"
      >
        Chargement…
      </div>

      <div
        v-else-if="appointments.length === 0"
        class="px-6 py-10 text-sm text-[color:var(--color-brand-secondary)]"
      >
        Aucun appel discovery pour le moment.
      </div>

      <ul
        v-else
        class="divide-y divide-[color:var(--color-brand-subtle)]"
      >
        <li
          v-for="item in appointments"
          :key="item.id"
          class="px-6 py-5"
        >
          <div class="grid gap-4 lg:grid-cols-[1fr_220px_160px] lg:items-center">
            <div class="min-w-0">
              <p class="truncate font-semibold text-[color:var(--color-brand-primary)]">
                {{ formatClientName(item) }}
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                {{ formatDateTime(item.scheduledAt) }}
              </p>
              <div class="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                  :href="`mailto:${item.client.email}`"
                >
                  {{ item.client.email }}
                </a>
                <a
                  class="font-semibold text-[color:var(--color-brand-primary)] hover:underline"
                  :href="`tel:${item.client.phone}`"
                >
                  {{ item.client.phone }}
                </a>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusClass(item.status)"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <div class="flex flex-wrap gap-3 lg:justify-end">
              <button
                v-if="item.status === 'scheduled'"
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-brand-subtle)] bg-white px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="updatingId === item.id"
                @click="updateAppointmentStatus(item.id, 'complete')"
              >
                Marquer terminé
              </button>

              <button
                v-if="item.status === 'scheduled'"
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="updatingId === item.id"
                @click="updateAppointmentStatus(item.id, 'cancel')"
              >
                Annuler
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
