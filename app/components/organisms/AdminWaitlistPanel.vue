<template>
  <div>
    <!-- Filters -->
    <section class="mb-8 space-y-4">
      <!-- Row 1: Status pills + Specialty select -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Statut :</span>
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            type="button"
            :class="filterPillClasses(statusFilter === opt.value, 'sm')"
            @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
          <button
            v-if="statusFilter"
            type="button"
            class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="selectStatus(null)"
          >
            Tous
          </button>
        </div>

        <div class="flex items-center gap-2">
          <label
            for="specialtyFilter"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Spécialité :</label>
          <USelect
            id="specialtyFilter"
            :model-value="specialtyFilter || 'all'"
            :items="SPECIALTY_SELECT_ITEMS"
            size="sm"
            class="min-w-[180px]"
            @update:model-value="onSpecialtyChange"
          />
        </div>
      </div>

      <!-- Row 2: Search + Dates -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="relative max-w-md flex-1">
          <UIcon
            name="lucide:search"
            size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
          />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Rechercher nom ou email…"
            autocomplete="off"
            class="w-full rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] py-3 pl-12 pr-4 text-sm text-[color:var(--color-brand-primary)] placeholder-[color:var(--color-brand-muted)] shadow-sm transition-shadow focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
            @input="onSearchInput"
          >
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label
              for="waitlistDateFrom"
              class="text-sm text-[color:var(--color-brand-muted)]"
            >Du :</label>
            <input
              id="waitlistDateFrom"
              v-model="dateFromInput"
              type="datetime-local"
              autocomplete="off"
              class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
              @change="onDateChange"
            >
          </div>

          <div class="flex items-center gap-2">
            <label
              for="waitlistDateTo"
              class="text-sm text-[color:var(--color-brand-muted)]"
            >Au :</label>
            <input
              id="waitlistDateTo"
              v-model="dateToInput"
              type="datetime-local"
              autocomplete="off"
              class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
              @change="onDateChange"
            >
          </div>

          <button
            v-if="dateFromInput || dateToInput || statusFilter || specialtyFilter || searchInput"
            type="button"
            class="text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="onResetFilters"
          >
            Tout effacer
          </button>
        </div>
      </div>
    </section>

    <!-- Leads Table -->
    <section
      class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft"
      data-testid="admin-waitlist-panel"
    >
      <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--ui-color-primary-100)] opacity-30 blur-[100px]" />

      <div
        v-if="loading && !initialized"
        class="relative z-10 space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 rounded-xl"
        />
      </div>

      <AtomsDsErrorState
        v-else-if="error"
        :message="error || 'Erreur lors du chargement de la waitlist'"
        class="relative z-10"
        @retry="fetchInitial"
      />

      <AtomsDsEmptyState
        v-else-if="isEmpty"
        icon="i-lucide-list"
        title="Aucun lead"
        :description="hasActiveFilters ? 'Essayez avec d\'autres filtres.' : 'Aucune praticienne ne s\'est inscrite sur la waitlist.'"
        class="relative z-10"
      />

      <div
        v-else
        class="relative z-10"
      >
        <!-- Desktop table -->
        <div class="hidden md:block">
          <table
            class="w-full text-sm"
            data-testid="admin-waitlist-table"
          >
            <thead class="border-b border-[color:var(--color-brand-subtle)]/50">
              <tr class="text-left text-xs uppercase tracking-[0.12em] text-[color:var(--color-brand-muted)]">
                <th class="px-6 py-3 font-semibold">
                  Nom
                </th>
                <th class="px-6 py-3 font-semibold">
                  Email
                </th>
                <th class="px-6 py-3 font-semibold">
                  Spécialité
                </th>
                <th class="px-6 py-3 font-semibold">
                  Statut
                </th>
                <th class="px-6 py-3 font-semibold">
                  Reçu le
                </th>
                <th class="px-6 py-3 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lead in items"
                :key="lead.id"
                class="border-b border-[color:var(--color-brand-subtle)]/30 last:border-0"
                :data-testid="`admin-waitlist-row-${lead.id}`"
              >
                <td class="px-6 py-3 text-[color:var(--color-brand-primary)]">
                  {{ lead.firstName }} {{ lead.lastName }}
                </td>
                <td class="px-6 py-3 text-[color:var(--color-brand-secondary)]">
                  {{ lead.email }}
                </td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--color-brand-primary)]">
                    {{ specialtyLabel(lead.specialty) }}
                  </span>
                </td>
                <td class="px-6 py-3">
                  <span :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(lead.status)}`">
                    {{ statusLabel(lead.status) }}
                  </span>
                </td>
                <td class="px-6 py-3 text-[color:var(--color-brand-secondary)]">
                  {{ formatDateShort(lead.createdAt) }}
                </td>
                <td class="px-6 py-3 text-right">
                  <UDropdownMenu :items="actionsFor(lead)">
                    <UButton
                      icon="i-lucide-more-horizontal"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      :loading="pendingUpdates[lead.id] === true"
                      :aria-label="`Actions pour ${lead.firstName} ${lead.lastName}`"
                    />
                  </UDropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="block space-y-3 p-4 md:hidden">
          <div
            v-for="lead in items"
            :key="lead.id"
            class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                  {{ lead.firstName }} {{ lead.lastName }}
                </p>
                <p class="text-xs text-[color:var(--color-brand-secondary)]">
                  {{ lead.email }}
                </p>
              </div>
              <span :class="`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(lead.status)}`">
                {{ statusLabel(lead.status) }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-brand-muted)]">
              <span class="rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2 py-0.5 text-[color:var(--color-brand-primary)]">
                {{ specialtyLabel(lead.specialty) }}
              </span>
              <span>{{ formatDateShort(lead.createdAt) }}</span>
            </div>
            <div class="mt-3 flex justify-end">
              <UDropdownMenu :items="actionsFor(lead)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :loading="pendingUpdates[lead.id] === true"
                >
                  Actions
                </UButton>
              </UDropdownMenu>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="nextCursor"
          class="flex justify-center border-t border-[color:var(--color-brand-subtle)]/50 p-4"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import {
  computeActionsForStatus,
  statusBadgeClasses
} from '~/features/admin/admin-waitlist-helpers'
import {
  useAdminWaitlist,
  WAITLIST_SPECIALTY_LABELS,
  WAITLIST_STATUS_LABELS
} from '~/features/admin/use-admin-waitlist'
import {
  WAITLIST_SPECIALTY_VALUES,
  type AdminWaitlistLead,
  type WaitlistSpecialty,
  type WaitlistStatus
} from '~/features/admin/api/admin-waitlist.contract'

const toast = useToast()

const STATUS_OPTIONS: Array<{ value: WaitlistStatus, label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'onboarded', label: 'Onboardé' },
  { value: 'declined', label: 'Décliné' }
]

const SPECIALTY_SELECT_ITEMS = [
  { label: 'Toutes', value: 'all' },
  ...WAITLIST_SPECIALTY_VALUES.map(value => ({
    label: WAITLIST_SPECIALTY_LABELS[value] ?? value,
    value
  }))
]

const {
  items,
  loading,
  loadingMore,
  error,
  nextCursor,
  filters,
  isEmpty,
  fetchInitial,
  loadMore,
  applyFilters,
  resetFilters,
  updateStatus
} = useAdminWaitlist()

const initialized = ref(false)
const statusFilter = ref<WaitlistStatus | null>(null)
const specialtyFilter = ref<WaitlistSpecialty | ''>('')
const searchInput = ref('')
const dateFromInput = ref('')
const dateToInput = ref('')

const pendingUpdates = reactive<Record<string, boolean>>({})

const hasActiveFilters = computed(() =>
  !!(statusFilter.value || specialtyFilter.value || searchInput.value || dateFromInput.value || dateToInput.value)
)

onMounted(async () => {
  await fetchInitial()
  initialized.value = true
})

function selectStatus(value: WaitlistStatus | null) {
  statusFilter.value = value
  applyFilters({ status: value ?? undefined })
}

function onSpecialtyChange(value: string) {
  // 'all' is the sentinel value of the "Toutes" option — map to undefined.
  const next = value === 'all' || !value ? '' : value
  specialtyFilter.value = next as WaitlistSpecialty | ''
  applyFilters({ specialty: (next || undefined) as WaitlistSpecialty | undefined })
}

function onSearchInput() {
  applyFilters({ search: searchInput.value || undefined })
}

function onDateChange() {
  const dateFrom = dateFromInput.value ? new Date(dateFromInput.value).toISOString() : undefined
  const dateTo = dateToInput.value ? new Date(dateToInput.value).toISOString() : undefined
  applyFilters({ dateFrom, dateTo })
}

function onResetFilters() {
  statusFilter.value = null
  specialtyFilter.value = ''
  searchInput.value = ''
  dateFromInput.value = ''
  dateToInput.value = ''
  resetFilters()
}

function statusLabel(status: WaitlistStatus): string {
  return WAITLIST_STATUS_LABELS[status]
}

function specialtyLabel(specialty: WaitlistSpecialty): string {
  return WAITLIST_SPECIALTY_LABELS[specialty] ?? specialty
}

async function performUpdate(lead: AdminWaitlistLead, next: WaitlistStatus) {
  pendingUpdates[lead.id] = true
  try {
    await updateStatus(lead.id, next)
    toast.add({
      title: 'Statut mis à jour',
      color: 'success'
    })
  } catch (e) {
    // Codex F5 — error toast stays visible until the admin dismisses it.
    // duration: 0 means no auto-close (Nuxt UI v4 convention).
    toast.add({
      title: 'Impossible de mettre à jour le statut',
      description: e instanceof Error ? e.message : undefined,
      color: 'error',
      duration: 0
    })
  } finally {
    pendingUpdates[lead.id] = false
  }
}

interface ActionItem {
  label: string
  icon: string
  onSelect: () => void
}

function actionsFor(lead: AdminWaitlistLead): ActionItem[][] {
  const actions: ActionItem[] = computeActionsForStatus(lead.status).map(a => ({
    label: a.label,
    icon: a.icon,
    onSelect: () => performUpdate(lead, a.nextStatus)
  }))
  return [actions]
}

// Expose filters value reference (unused but keeps filters reactive coverage)
void filters
</script>
