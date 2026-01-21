<template>
  <div class="space-y-8">
    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Mes clientes
        </h1>
        <p class="mt-1 text-stone-500">
          Suivez vos clientes, leur statut et leurs prochains rendez-vous.
        </p>
      </div>
      <UButton
        :loading="pending"
        variant="outline"
        color="neutral"
        @click="refresh"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="mr-2 h-4 w-4"
        />
        Actualiser
      </UButton>
    </header>

    <!-- Error alert -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Chargement impossible"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Stats row -->
    <div class="grid gap-4 sm:grid-cols-4">
      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-crepuscule-100">
            <UIcon
              name="lucide:users"
              class="h-6 w-6 text-crepuscule-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              Total
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : totalClients }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <UIcon
              name="lucide:rocket"
              class="h-6 w-6 text-blue-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              En cours
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : inProgressCount }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <UIcon
              name="lucide:user-plus"
              class="h-6 w-6 text-amber-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              Onboarding
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : onboardingCount }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <UIcon
              name="lucide:check-circle"
              class="h-6 w-6 text-green-600"
            />
          </div>
          <div>
            <p class="text-sm text-stone-500">
              Terminé
            </p>
            <p class="text-2xl font-semibold text-stone-900">
              {{ pending ? '...' : completedCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <UCard class="bg-white">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
            Recherche
          </label>
          <UInput
            v-model="searchQuery"
            placeholder="Nom, email, téléphone..."
            icon="i-lucide-search"
          />
        </div>
        <div class="sm:w-48">
          <label class="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
            Statut
          </label>
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
          />
        </div>
      </div>

      <p class="mt-4 text-sm text-stone-500">
        {{ clients.length }} cliente(s) trouvée(s)
        <span
          v-if="pending"
          class="ml-2 text-stone-400"
        >— Chargement...</span>
      </p>
    </UCard>

    <!-- Loading state -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <UCard
        v-for="i in 4"
        :key="i"
        class="bg-white"
      >
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
          <USkeleton class="h-8 w-24 rounded-full" />
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <UCard
      v-else-if="clients.length === 0"
      class="bg-white"
    >
      <div class="py-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <UIcon
            name="lucide:users"
            class="h-8 w-8 text-stone-400"
          />
        </div>
        <p class="text-lg font-medium text-stone-900">
          Aucune cliente
        </p>
        <p class="mt-2 text-stone-500">
          Les clientes apparaîtront ici dès qu'un premier rendez-vous sera créé.
        </p>
        <UButton
          to="/provider/discovery"
          variant="soft"
          color="primary"
          class="mt-6"
        >
          <UIcon
            name="lucide:phone-call"
            class="mr-2 h-4 w-4"
          />
          Voir les appels discovery
        </UButton>
      </div>
    </UCard>

    <!-- Clients list -->
    <div
      v-else
      class="space-y-4"
    >
      <ClientCard
        v-for="client in clients"
        :key="client.clientProfileId"
        :client="client"
      />
    </div>

    <!-- Load more -->
    <div
      v-if="clients.length > 0 && nextCursor"
      class="flex flex-col items-center gap-3"
    >
      <UButton
        variant="soft"
        color="neutral"
        :loading="loadMorePending"
        @click="loadMore"
      >
        <UIcon
          name="lucide:chevrons-down"
          class="mr-2 h-4 w-4"
        />
        Charger plus
      </UButton>

      <UAlert
        v-if="loadMoreErrorMessage"
        color="warning"
        variant="soft"
        title="Chargement partiel"
        :description="loadMoreErrorMessage"
        icon="i-lucide-alert-triangle"
        class="w-full max-w-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProviderClients } from '../../../features/clients/useProviderClients'
import ClientCard from '../../../components/molecules/ClientCard.vue'

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

// Stats computed from clients list
const totalClients = computed(() => clients.value.length)

const inProgressCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'in_progress').length
)

const onboardingCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'onboarding').length
)

const completedCount = computed(() =>
  clients.value.filter(c => c.computedStatus === 'completed').length
)
</script>
