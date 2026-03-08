<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { SLUG_REGEX, SIRET_REGEX, EMAIL_REGEX } from '~/utils/validation-regex'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Providers'
})

const router = useRouter()

// Types
type StripeStatusFilter = 'all' | 'connected' | 'pending' | 'blocked'

type AdminProviderListItem = {
  id: string
  userId: string
  displayName: string
  email: string
  isActive: boolean
  createdAt: string
  stripe: {
    stripeAccountId: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    requirementsDueCount: number
    onboardingCompletedAt: string | null
  }
}

type ListProvidersResponse = {
  items: AdminProviderListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

const toast = useToast()

// Creation modal
const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  slug: '',
  siret: '',
  legalIdentifier: ''
})

const createErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!createForm.firstName.trim()) errors.firstName = 'Requis'
  if (!createForm.lastName.trim()) errors.lastName = 'Requis'
  if (!createForm.email.trim()) errors.email = 'Requis'
  else if (!EMAIL_REGEX.test(createForm.email)) errors.email = 'Email invalide'
  if (!createForm.slug.trim()) errors.slug = 'Requis'
  else if (createForm.slug.length < 3 || createForm.slug.length > 60) errors.slug = 'Entre 3 et 60 caractères'
  else if (!SLUG_REGEX.test(createForm.slug)) errors.slug = 'Lettres minuscules, chiffres et tirets uniquement'
  if (createForm.siret && !SIRET_REGEX.test(createForm.siret)) errors.siret = 'Format SIREN (9) ou SIRET (14) invalide'
  return errors
})

const canCreate = computed(() => Object.keys(createErrors.value).length === 0 && createForm.firstName.trim())

function resetCreateForm() {
  createForm.firstName = ''
  createForm.lastName = ''
  createForm.email = ''
  createForm.slug = ''
  createForm.siret = ''
  createForm.legalIdentifier = ''
}

async function submitCreate() {
  if (!canCreate.value || createLoading.value) return
  createLoading.value = true
  try {
    const body: Record<string, string> = {
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
      email: createForm.email.trim(),
      slug: createForm.slug.trim()
    }
    if (createForm.siret.trim()) body.siret = createForm.siret.trim()
    if (createForm.legalIdentifier.trim()) body.legalIdentifier = createForm.legalIdentifier.trim()

    const result = await apiFetch<{ id: string }>('/admin/providers', { method: 'POST', body })
    toast.add({ title: 'Provider créé', description: 'Email d\'activation envoyé.', color: 'success' })
    showCreateModal.value = false
    resetCreateForm()
    router.push(`/admin/providers/${result.id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création'
    toast.add({ title: 'Erreur', description: message, color: 'error' })
  } finally {
    createLoading.value = false
  }
}

// Filters
const searchQuery = ref('')
const stripeStatus = ref<StripeStatusFilter>('all')
const providerIdInput = ref('')
const loadingMore = ref(false)

const stripeStatusFilters = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'connected' as const, label: 'Connectés' },
  { value: 'pending' as const, label: 'En attente' },
  { value: 'blocked' as const, label: 'Bloqués' }
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isValidUuid = computed(() => UUID_REGEX.test(providerIdInput.value))

// API params
const queryParams = computed(() => {
  const params: Record<string, string> = { limit: '20' }
  if (searchQuery.value) params.q = searchQuery.value
  if (stripeStatus.value !== 'all') params.stripeStatus = stripeStatus.value
  return params
})

// Fetch providers
const { data: providers, pending, error, refresh } = await useAsyncData<ListProvidersResponse>(
  'admin-providers',
  () => apiFetch<ListProvidersResponse>('/admin/providers', { params: queryParams.value }),
  { watch: [queryParams] }
)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    refresh()
  }, 300)
}

function setStripeStatus(status: StripeStatusFilter) {
  stripeStatus.value = status
}

// Load more
async function loadMore() {
  if (!providers.value?.page.nextCursor || loadingMore.value) return

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListProvidersResponse>('/admin/providers', {
      params: {
        ...queryParams.value,
        cursor: providers.value.page.nextCursor
      }
    })

    if (providers.value) {
      providers.value = {
        items: [...providers.value.items, ...moreData.items],
        page: moreData.page
      }
    }
  } finally {
    loadingMore.value = false
  }
}

// Table columns
const columns: TableColumn<AdminProviderListItem>[] = [
  {
    accessorKey: 'displayName',
    header: 'Provider',
    cell: ({ row }) => {
      const provider = row.original
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, provider.displayName),
        h('span', { class: 'text-xs text-[color:var(--color-brand-muted)]' }, provider.email)
      ])
    }
  },
  {
    id: 'accountStatus',
    header: 'Compte',
    cell: ({ row }) => {
      const active = row.original.isActive
      const s = getStatusBadgeClasses(active ? 'success' : 'error')
      return h('span', { class: s.badge }, [
        h('span', { class: s.dot }),
        active ? 'Actif' : 'Désactivé'
      ])
    }
  },
  {
    accessorKey: 'stripe.stripeAccountId',
    header: 'Stripe Account',
    cell: ({ row }) => {
      const accountId = row.original.stripe.stripeAccountId
      if (!accountId) {
        return h('span', { class: 'text-sm text-[color:var(--color-brand-muted)]' }, '—')
      }
      return h('span', { class: 'font-mono text-xs text-[color:var(--color-brand-secondary)]' }, accountId)
    }
  },
  {
    id: 'stripeStatus',
    header: 'Statut',
    cell: ({ row }) => {
      const stripe = row.original.stripe
      let variant: 'neutral' | 'success' | 'warning' | 'error' = 'neutral'
      let label = 'Non lié'
      if (stripe.stripeAccountId) {
        if (stripe.chargesEnabled && stripe.payoutsEnabled) {
          variant = 'success'
          label = 'Actif'
        } else if (stripe.requirementsDueCount > 0) {
          variant = 'warning'
          label = `${stripe.requirementsDueCount} action${stripe.requirementsDueCount > 1 ? 's' : ''}`
        } else {
          variant = 'error'
          label = 'Bloqué'
        }
      }
      const s = getStatusBadgeClasses(variant)
      return h('span', { class: s.badge }, [h('span', { class: s.dot }), label])
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Inscription',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' },
        formatDateShort(row.original.createdAt)
      )
    }
  }
]

// Row click
function onRowSelect(_e: Event, row: TableRow<AdminProviderListItem>) {
  router.push(`/admin/providers/${row.original.id}`)
}

// Direct access
function goToProvider() {
  if (isValidUuid.value) {
    router.push(`/admin/providers/${providerIdInput.value}`)
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-crepuscule-600)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Providers
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Gestion des comptes coachs
        </p>
      </div>

      <UButton
        color="primary"
        class="rounded-full"
        @click="showCreateModal = true"
      >
        <UIcon
          name="lucide:plus"
          size="18"
        />
        Nouveau provider
      </UButton>
    </section>

    <!-- Filters -->
    <section class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search -->
      <div class="max-w-md flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par nom ou email..."
          icon="i-lucide-search"
          size="lg"
          class="w-full"
          @input="debouncedSearch"
        />
      </div>

      <!-- Stripe Status Filter -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-[color:var(--color-brand-muted)]">Statut Stripe :</span>
        <div class="flex gap-2">
          <button
            v-for="filter in stripeStatusFilters"
            :key="filter.value"
            type="button"
            :class="filterPillClasses(stripeStatus === filter.value)"
            @click="setStripeStatus(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- Providers Table -->
    <section class="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-white shadow-soft">
      <!-- Loading State -->
      <div
        v-if="pending"
        class="flex items-center justify-center py-20"
      >
        <UIcon
          name="lucide:loader-2"
          size="32"
          class="animate-spin text-[color:var(--color-brand-muted)]"
        />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-8 text-center"
      >
        <UIcon
          name="lucide:alert-circle"
          size="48"
          class="mx-auto mb-4 text-red-500"
        />
        <p class="text-lg font-medium text-red-800">
          Erreur lors du chargement des providers
        </p>
        <UButton
          variant="outline"
          color="neutral"
          class="mt-4 rounded-full"
          @click="() => refresh()"
        >
          <UIcon
            name="lucide:refresh-cw"
            size="16"
          />
          Réessayer
        </UButton>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!providers?.items?.length"
        class="p-12 text-center"
      >
        <UIcon
          name="lucide:users"
          size="48"
          class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
        />
        <p class="text-lg font-medium text-[color:var(--color-brand-primary)]">
          Aucun provider trouvé
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
          {{ searchQuery ? 'Essayez avec d\'autres termes de recherche.' : 'Aucun provider n\'est encore inscrit.' }}
        </p>
      </div>

      <!-- Table -->
      <div v-else>
        <UTable
          :data="providers.items"
          :columns="columns"
          :class="[ADMIN_TABLE_CLASSES, '[&_tr:hover_td]:bg-[color:var(--color-crepuscule-50)]/30 [&_tr]:cursor-pointer [&_tr]:transition-colors']"
          @select="onRowSelect"
        />

        <!-- Pagination -->
        <div
          v-if="providers.page.nextCursor"
          class="flex justify-center border-t border-[color:var(--color-border-subtle)] p-4"
        >
          <UButton
            variant="outline"
            color="neutral"
            class="rounded-full"
            :loading="loadingMore"
            @click="loadMore"
          >
            <UIcon
              name="lucide:chevron-down"
              size="16"
            />
            Charger plus
          </UButton>
        </div>
      </div>
    </section>

    <!-- Quick Access Card -->
    <section class="mt-8 overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
          <UIcon
            name="lucide:hash"
            size="20"
            class="text-[color:var(--color-crepuscule-600)]"
          />
        </div>
        <div class="grid gap-1">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Accès direct par ID
          </h2>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Entrez l'ID d'un provider pour accéder directement à ses informations
          </p>
        </div>
      </div>

      <form
        class="mt-6 flex gap-4"
        @submit.prevent="goToProvider"
      >
        <div class="flex-1">
          <UInput
            v-model="providerIdInput"
            placeholder="00000000-0000-0000-0000-000000000000"
            size="lg"
            class="w-full font-mono"
          />
        </div>
        <UButton
          type="submit"
          color="primary"
          :disabled="!isValidUuid"
          class="rounded-full"
        >
          <UIcon
            name="lucide:arrow-right"
            size="18"
          />
          Voir
        </UButton>
      </form>

      <p
        v-if="providerIdInput && !isValidUuid"
        class="mt-2 text-sm text-[color:var(--color-error-600)]"
      >
        Format UUID invalide
      </p>
    </section>

    <!-- Create Provider Modal -->
    <UModal
      :open="showCreateModal"
      @update:open="(v: boolean) => { showCreateModal = v; if (!v) resetCreateForm() }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-crepuscule-100)]">
            <UIcon
              name="lucide:user-plus"
              size="20"
              class="text-[color:var(--color-crepuscule-600)]"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
              Nouveau provider
            </h3>
            <p class="text-sm text-[color:var(--color-brand-muted)]">
              Un email d'activation sera envoyé
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="submitCreate"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Prénom"
              :error="createForm.firstName && createErrors.firstName"
            >
              <UInput
                v-model="createForm.firstName"
                placeholder="Sophie"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Nom"
              :error="createForm.lastName && createErrors.lastName"
            >
              <UInput
                v-model="createForm.lastName"
                placeholder="Martin"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Email"
            :error="createForm.email && createErrors.email"
          >
            <UInput
              v-model="createForm.email"
              type="email"
              placeholder="sophie@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Slug"
            :error="createForm.slug && createErrors.slug"
            hint="URL publique : /coach/{slug}"
          >
            <UInput
              v-model="createForm.slug"
              placeholder="sophie-martin"
              class="w-full font-mono"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="SIRET / SIREN"
              :error="createForm.siret && createErrors.siret"
              hint="Optionnel"
            >
              <UInput
                v-model="createForm.siret"
                placeholder="12345678901234"
                class="w-full font-mono"
              />
            </UFormField>

            <UFormField
              label="Identifiant légal"
              hint="Optionnel"
            >
              <UInput
                v-model="createForm.legalIdentifier"
                placeholder="TVA, RNA..."
                class="w-full"
              />
            </UFormField>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            color="neutral"
            :disabled="createLoading"
            @click="showCreateModal = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="createLoading"
            :disabled="!canCreate"
            @click="submitCreate"
          >
            Créer le provider
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
