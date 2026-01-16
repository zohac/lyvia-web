<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div class="grid gap-6">
      <UCard
        variant="organic"
        class="rounded-blob-a"
      >
        <div
          v-if="pending"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="h-14 w-14 rounded-full" />
            <div class="grid gap-2">
              <USkeleton class="h-4 w-40" />
              <USkeleton class="h-3 w-56" />
            </div>
          </div>
          <USkeleton class="h-10 w-40 rounded-full" />
        </div>

        <div
          v-else-if="client"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <UAvatar
              :text="getClientInitials(client)"
              size="lg"
              class="bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)]"
            />
            <div class="grid gap-1">
              <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                {{ formatClientName(client) }}
              </h1>
              <p class="text-xs text-[color:var(--color-brand-secondary)]">
                {{ client.email }} · {{ client.phone }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-calendar"
            variant="solid"
            color="primary"
            class="rounded-full"
            to="/provider/calendar"
          >
            Planifier un RDV
          </UButton>
        </div>
      </UCard>

      <SystemAlert
        v-if="errorMessage"
        variant="error"
        title="Chargement impossible"
        :description="errorMessage"
      />

      <UCard
        variant="organic"
        class="rounded-blob-c"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
            Historique
          </h2>
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            V0
          </span>
        </div>
        <div class="mt-4 grid gap-3">
          <div
            v-for="index in 3"
            :key="`history-skeleton-${index}`"
            class="flex items-center justify-between gap-4 rounded-blob-d border border-white/70 bg-white/60 p-4 shadow-soft"
          >
            <div class="grid gap-2">
              <USkeleton class="h-4 w-36" />
              <USkeleton class="h-3 w-44" />
            </div>
            <USkeleton class="h-6 w-20 rounded-full" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard
      variant="glass"
      class="order-first rounded-blob-b lg:order-last lg:sticky lg:top-6"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-serif text-lg italic text-[color:var(--color-brand-primary)]">
          Synthèse
        </h2>
        <UBadge
          v-if="statusMeta"
          :color="statusMeta.color"
          variant="soft"
        >
          {{ statusMeta.label }}
        </UBadge>
      </div>

      <div
        v-if="pending"
        class="mt-4 grid gap-3"
      >
        <USkeleton class="h-3 w-full" />
        <USkeleton class="h-3 w-4/5" />
        <USkeleton class="h-10 w-32 rounded-full" />
      </div>

      <div
        v-else-if="detail"
        class="mt-4 grid gap-4 text-sm text-[color:var(--color-brand-secondary)]"
      >
        <p class="text-[color:var(--color-brand-primary)]">
          {{ getClientStatusMicrocopy(detail.computedStatus) }}
        </p>

        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Mois en cours
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            {{ formatProgramMonth(detail.program.currentProgramMonth, detail.program.totalMonths) }}
          </p>
        </div>

        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Prochain RDV
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            {{ nextAppointmentLabel }}
          </p>
        </div>

        <div class="grid gap-1">
          <span class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-muted)]">
            Fuseau horaire
          </span>
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            Heure France ({{ timezoneLabel }})
          </p>
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import { useProviderClientDetail } from '../../../features/clients/useProviderClientDetail'
import {
  formatClientName,
  formatNextAppointment,
  formatProgramMonth,
  getClientInitials,
  getClientStatusMeta,
  getClientStatusMicrocopy
} from '../../../features/clients/domain/clients'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Fiche cliente'
})

const route = useRoute()
const clientProfileId = computed(() => {
  const value = route.params.clientProfileId
  return typeof value === 'string' ? value : value?.[0]
})

if (!clientProfileId.value) {
  throw createError({ statusCode: 404, statusMessage: 'Cliente introuvable.' })
}

const { pending, errorMessage, detail } = await useProviderClientDetail(clientProfileId.value)

const client = computed(() => detail.value?.client ?? null)

const timezoneLabel = computed(() => detail.value?.timezone ?? 'Europe/Paris')

const statusMeta = computed(() => {
  if (!detail.value) return null
  return getClientStatusMeta(detail.value.computedStatus)
})

const nextAppointmentLabel = computed(() => {
  if (!detail.value) return 'Aucun rendez-vous planifié'
  const formatted = formatNextAppointment(detail.value.stats.nextConsultationAt, timezoneLabel.value)
  if (!formatted) return 'Aucun rendez-vous planifié'
  return `Consultation — ${formatted}`
})
</script>
