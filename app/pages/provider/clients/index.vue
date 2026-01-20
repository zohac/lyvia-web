<template>
  <section class="grid gap-6">
    <UCard
      variant="soft"
      class="rounded-blob-b"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Mes clientes
          </h1>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Retrouvez rapidement une cliente, son statut et son prochain rendez-vous.
          </p>
        </div>
        <UButton
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          :loading="pending"
          @click="refresh"
        >
          Actualiser
        </UButton>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-secondary)]">
            Recherche
          </label>
          <UInput
            v-model="searchQuery"
            placeholder="Nom, email, téléphone..."
          />
        </div>
        <div class="grid gap-2 lg:w-[220px]">
          <label class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-secondary)]">
            Statut
          </label>
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
          />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--color-brand-muted)]">
        <span>{{ clients.length }} cliente(s)</span>
        <span v-if="pending">Chargement en cours…</span>
      </div>
    </UCard>

    <SystemAlert
      v-if="errorMessage"
      variant="error"
      title="Chargement impossible"
      :description="errorMessage"
    />

    <div
      v-if="pending"
      class="grid gap-4"
    >
      <UCard
        v-for="index in 4"
        :key="`skeleton-${index}`"
        variant="subtle"
        class="rounded-blob-a"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <USkeleton class="h-10 w-10 rounded-full" />
            <div class="grid gap-2">
              <USkeleton class="h-4 w-40" />
              <USkeleton class="h-3 w-56" />
            </div>
          </div>
          <USkeleton class="h-8 w-24 rounded-full" />
        </div>
      </UCard>
    </div>

    <UCard
      v-else-if="clients.length === 0"
      variant="soft"
      class="rounded-blob-c"
    >
      <div class="grid gap-2 text-sm text-[color:var(--color-brand-secondary)]">
        <p class="font-semibold text-[color:var(--color-brand-primary)]">
          Aucune cliente
        </p>
        <p>
          Les clientes apparaîtront ici dès qu’un premier rendez-vous sera créé.
        </p>
      </div>
    </UCard>

    <div
      v-else
      class="grid gap-4"
    >
      <UCard
        v-for="client in clients"
        :key="client.clientProfileId"
        variant="subtle"
        class="rounded-blob-a"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              :text="getClientInitials(client)"
              size="sm"
              class="bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)]"
            />
            <div class="grid gap-1">
              <p class="font-semibold text-[color:var(--color-brand-primary)]">
                {{ formatClientName(client) }}
              </p>
              <p class="text-xs text-[color:var(--color-brand-secondary)]">
                {{ client.email }} · {{ client.phone }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <UBadge
              :color="getClientStatusMeta(client.computedStatus).color"
              variant="soft"
            >
              {{ getClientStatusMeta(client.computedStatus).label }}
            </UBadge>
            <UButton
              size="sm"
              variant="outline"
              :to="`/provider/clients/${client.clientProfileId}`"
            >
              Voir fiche
            </UButton>
          </div>
        </div>
        <div class="mt-3 text-xs text-[color:var(--color-brand-secondary)]">
          <span class="uppercase tracking-[0.2em] text-[10px] text-[color:var(--color-brand-muted)]">
            Prochain RDV
          </span>
          <p class="mt-1 font-medium text-[color:var(--color-brand-primary)]">
            {{ formatNextAppointment(client.stats.nextAppointmentAt) ?? 'Aucun RDV planifié' }}
          </p>
        </div>
      </UCard>
    </div>

    <div
      v-if="clients.length > 0 && nextCursor"
      class="flex flex-col items-center gap-3"
    >
      <UButton
        variant="soft"
        :loading="loadMorePending"
        @click="loadMore"
      >
        Charger plus
      </UButton>
      <SystemAlert
        v-if="loadMoreErrorMessage"
        variant="warning"
        title="Chargement partiel"
        :description="loadMoreErrorMessage"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import { useProviderClients } from '../../../features/clients/useProviderClients'
import { formatClientName, formatNextAppointment, getClientInitials, getClientStatusMeta } from '../../../features/clients/domain/clients'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mes clientes'
})

const {
  pending,
  errorMessage,
  clients,
  nextCursor,
  searchQuery,
  statusFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useProviderClients()

const statusOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Terminé', value: 'completed' }
]
</script>
