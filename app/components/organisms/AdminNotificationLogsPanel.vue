<template>
  <div>
    <AdminReminderJobsPanel @executed="refresh()" />
    <!-- Filters -->
    <section class="mb-8 space-y-4">
      <!-- Row 1: Type + Status -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <!-- Type Filter -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Type:</span>
          <button
            v-for="typeOption in typeOptions"
            :key="typeOption.value"
            type="button"
            :class="[
              'rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium transition-colors',
              selectedType === typeOption.value
                ? `${typeOption.activeClass} border-transparent shadow-sm`
                : 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
            ]"
            :aria-pressed="selectedType === typeOption.value"
            @click="selectType(typeOption.value)"
          >
            {{ typeOption.label }}
          </button>
          <button
            v-if="selectedType"
            type="button"
            class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="clearType"
          >
            Effacer
          </button>
        </div>

        <!-- Status Filter -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Status:</span>
          <button
            v-for="statusOption in statusOptions"
            :key="statusOption.value"
            type="button"
            :class="[
              'rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium transition-colors',
              selectedStatus === statusOption.value
                ? `${statusOption.activeClass} border-transparent shadow-sm`
                : 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
            ]"
            :aria-pressed="selectedStatus === statusOption.value"
            @click="selectStatus(statusOption.value)"
          >
            {{ statusOption.label }}
          </button>
          <button
            v-if="selectedStatus"
            type="button"
            class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="clearStatus"
          >
            Effacer
          </button>
        </div>
      </div>

      <!-- Row 2: Motif -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-[color:var(--color-brand-muted)]">Motif:</span>
        <button
          v-for="reasonOption in reasonOptions"
          :key="reasonOption.value"
          type="button"
          :class="[
            'rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium transition-colors',
            selectedReason === reasonOption.value
              ? `${reasonOption.activeClass} border-transparent shadow-sm`
              : 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
          ]"
          :aria-pressed="selectedReason === reasonOption.value"
          @click="selectReason(reasonOption.value)"
        >
          {{ reasonOption.label }}
        </button>
        <button
          v-if="selectedReason"
          type="button"
          class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
          @click="clearReason"
        >
          Effacer
        </button>
      </div>

      <!-- Row 3: Date Range -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label
            for="dateFrom"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Du:</label>
          <input
            id="dateFrom"
            v-model="dateFrom"
            type="datetime-local"
            autocomplete="off"
            class="h-11 w-[10.5rem] rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] px-4 text-sm text-[color:var(--color-brand-primary)] transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-80 focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[color:var(--color-field-ring)]/60"
            @change="applyFilters"
          >
        </div>

        <div class="flex items-center gap-2">
          <label
            for="dateTo"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Au:</label>
          <input
            id="dateTo"
            v-model="dateTo"
            type="datetime-local"
            autocomplete="off"
            class="h-11 w-[10.5rem] rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] px-4 text-sm text-[color:var(--color-brand-primary)] transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-80 focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[color:var(--color-field-ring)]/60"
            @change="applyFilters"
          >
        </div>

        <button
          v-if="dateFrom || dateTo"
          type="button"
          class="text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
          @click="clearDates"
        >
          Effacer dates
        </button>
      </div>
    </section>

    <!-- Notification Logs Table -->
    <section class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft">
      <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--ui-color-primary-100)] opacity-30 blur-[100px]" />

      <!-- Loading State -->
      <div
        v-if="pending"
        class="relative z-10 space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 rounded-xl"
        />
      </div>

      <!-- Error State -->
      <AtomsDsErrorState
        v-else-if="error"
        :message="error?.message || 'Erreur lors du chargement des notifications'"
        class="relative z-10"
        @retry="refresh()"
      />

      <!-- Empty State -->
      <AtomsDsEmptyState
        v-else-if="!notificationLogs?.items?.length"
        icon="i-lucide-bell-off"
        title="Aucune notification trouvée"
        :description="hasActiveFilters ? 'Essayez avec d\'autres filtres.' : 'Aucune notification n\'a encore été envoyée.'"
        class="relative z-10"
      />

      <!-- Table (desktop) -->
      <div
        v-else
        class="relative z-10"
      >
        <div class="hidden md:block">
          <UTable
            :data="notificationLogs.items"
            :columns="columns"
            :class="ADMIN_TABLE_CLASSES"
          />
        </div>

        <!-- Cards (mobile) -->
        <div class="block space-y-3 p-4 md:hidden">
          <button
            v-for="notif in notificationLogs.items"
            :key="notif.id"
            type="button"
            class="w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4 text-left transition-colors hover:bg-[color:var(--color-crepuscule-50)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-brand-primary)]"
            @click="openDetail(notif)"
          >
            <div class="flex items-start justify-between gap-3">
              <span :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationTypeBadgeClasses(notif.type)}`">
                {{ notif.type }}
              </span>
              <span :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationStatusBadgeClasses(notif.status)}`">
                {{ getNotificationStatusLabel(notif.status) }}
              </span>
            </div>
            <div class="mt-2 space-y-1">
              <p class="text-sm text-[color:var(--color-brand-primary)]">
                {{ notif.channel }}
              </p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
                <span
                  v-if="notif.reason"
                  data-testid="admin-notification-log-reason-card"
                  :class="`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getNotificationReasonBadgeClasses(notif.reason)}`"
                >
                  {{ getNotificationReasonLabel(notif.reason) }}
                </span>
                <span class="font-mono">{{ formatRecipient(notif.recipient) }}</span>
                <span>{{ formatNotificationDate(notif.createdAt) }}</span>
              </div>
            </div>
          </button>
        </div>

        <!-- Pagination -->
        <div
          v-if="notificationLogs.page.nextCursor"
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

    <!-- Detail Drawer -->
    <USlideover
      v-model:open="drawerOpen"
      side="right"
      :title="selectedNotification ? `${selectedNotification.type.toUpperCase()} - ${selectedNotification.channel}` : 'Détail de la notification'"
    >
      <template #body>
        <div
          v-if="detailPending"
          class="space-y-4 py-8"
        >
          <USkeleton class="h-6 w-48" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-32 rounded-xl" />
        </div>

        <div
          v-else-if="detailError"
          class="p-4"
        >
          <AtomsDsErrorState message="Erreur lors du chargement du détail" />
        </div>

        <AdminNotificationLogDetail
          v-else-if="notificationDetail"
          :detail="notificationDetail"
        />
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import AdminReminderJobsPanel from './AdminReminderJobsPanel.vue'
import AdminNotificationLogDetail from './AdminNotificationLogDetail.vue'
import { apiFetch } from '~/services/api/apiFetch'
import {
  getNotificationStatusBadgeClasses,
  getNotificationTypeBadgeClasses,
  getNotificationStatusLabel
} from '~/composables/useAdminBadges'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { formatNotificationDate } from '~/features/admin/format-notification-date'
import {
  buildNotificationLogColumns,
  formatRecipient
} from '~/features/admin/domain/admin-notification-log-columns'
import {
  NOTIFICATION_LOG_REASON_OPTIONS,
  buildNotificationLogFilterQuery,
  getNotificationReasonBadgeClasses,
  getNotificationReasonLabel,
  notificationLogFilterParams,
  notificationLogFilterQueryPart,
  parseNotificationLogFilters,
  sameNotificationLogFilters,
  type NotificationLogFilters
} from '~/features/admin/domain/admin-notification-log-filters'
import type {
  AdminNotificationLogDetail as NotificationLogDetail,
  AdminNotificationLogListItem as NotificationLogListItem
} from '~/features/admin/api/admin-notification-log.contract'

const toast = useToast()
const route = useRoute()
const router = useRouter()

type ListNotificationLogsResponse = {
  items: NotificationLogListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

// Filters
const selectedType = ref<string>('')
const selectedStatus = ref<string>('')
const selectedReason = ref<string>('')
const dateFrom = ref('')
const dateTo = ref('')
const loadingMore = ref(false)

// Drawer state
const drawerOpen = ref(false)
const selectedNotification = ref<NotificationLogListItem | null>(null)
const notificationDetail = ref<NotificationLogDetail | null>(null)
const detailPending = ref(false)
const detailError = ref<Error | null>(null)

// Filter options
const typeOptions = [
  { value: 'email', label: 'Email', activeClass: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-700)]' },
  { value: 'sms', label: 'SMS', activeClass: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]' }
]

const statusOptions = [
  { value: 'sent', label: 'Envoyé', activeClass: 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]' },
  { value: 'failed', label: 'Échoué', activeClass: 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]' },
  { value: 'skipped', label: 'Ignoré', activeClass: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]' }
]

/** Motifs de rejet d'un robot et d'échec d'envoi (WA.7). */
const reasonOptions = NOTIFICATION_LOG_REASON_OPTIONS

const hasActiveFilters = computed(() => {
  return selectedType.value !== ''
    || selectedStatus.value !== ''
    || selectedReason.value !== ''
    || dateFrom.value !== ''
    || dateTo.value !== ''
})

// URL — source de vérité partageable des filtres
/**
 * Filtres courants, dans la forme attendue par l'URL.
 */
function currentFilters(): NotificationLogFilters {
  return {
    type: selectedType.value,
    status: selectedStatus.value,
    reason: selectedReason.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value
  }
}

/**
 * Applique à l'état local les filtres lus dans l'URL.
 *
 * Un lien vers `/admin/tools?tab=notifications&reason=honeypot_detected`
 * rejoue donc exactement la même liste.
 */
function applyFiltersFromRoute(): void {
  const parsed = parseNotificationLogFilters(route.query)
  selectedType.value = parsed.type
  selectedStatus.value = parsed.status
  selectedReason.value = parsed.reason
  dateFrom.value = parsed.dateFrom
  dateTo.value = parsed.dateTo
}

/**
 * Reporte les filtres courants dans l'URL.
 *
 * `replace` et non `push` : un filtre n'est pas une navigation, il ne doit pas
 * empiler l'historique. Les autres paramètres (`tab`) sont conservés.
 */
function syncFiltersToRoute(): void {
  const next = buildNotificationLogFilterQuery(route.query, currentFilters())

  // Rien à réécrire : on ne touche pas à l'URL (et on ne crée pas de boucle).
  if (
    JSON.stringify(notificationLogFilterQueryPart(next))
    === JSON.stringify(notificationLogFilterQueryPart(route.query))
  ) {
    return
  }

  router.replace({ query: next })
}

// Les filtres de l'URL s'appliquent **avant** le premier appel : une URL
// partagée recharge la liste qu'elle désigne.
applyFiltersFromRoute()

/**
 * L'URL est réécrite avec les filtres **réellement appliqués**.
 *
 * Une URL éditée à la main peut porter un motif, un statut ou une date que le
 * panneau abandonne (format non affichable, valeur inconnue) : l'URL
 * advertise alors un filtre qui n'est pas en vigueur. On la réécrit donc —
 * avec `replace` (pas d'entrée d'historique) et **seulement** si elle diffère,
 * pour ne jamais boucler (le watcher compare les filtres et sort).
 */
syncFiltersToRoute()

// API params
const queryParams = computed(() => notificationLogFilterParams(currentFilters()))

// Fetch notification logs.
//
// Le rechargement est **manuel** (`refresh()`) et non automatique sur les
// params : le watcher de `route.query` ci-dessous ne sert qu'au retour
// arrière / avant du navigateur, et il ne déclenche un fetch que si les
// filtres **changent** — donc un seul aller-retour par action.
const { data: notificationLogs, pending, error, refresh } = await useAsyncData<ListNotificationLogsResponse>(
  'admin-notification-logs',
  () => apiFetch<ListNotificationLogsResponse>('/admin/notification-logs', { params: queryParams.value })
)

/**
 * Le retour arrière / avant du navigateur rejoue une URL : les filtres locaux
 * doivent alors suivre l'URL, sinon l'écran affiche une liste et une URL
 * discordants.
 *
 * Aucun aller-retour inutile : notre propre `router.replace` réécrit les
 * mêmes valeurs, donc le watcher ne voit aucun changement et ne relança pas
 * de fetch.
 */
watch(
  () => route.query,
  () => {
    const parsed = parseNotificationLogFilters(route.query)
    if (sameNotificationLogFilters(parsed, currentFilters())) return
    applyFiltersFromRoute()
    refresh()
  }
)

// Filter handlers
function selectType(type: string) {
  selectedType.value = selectedType.value === type ? '' : type
  applyFilters()
}

function clearType() {
  selectedType.value = ''
  applyFilters()
}

function selectStatus(status: string) {
  selectedStatus.value = selectedStatus.value === status ? '' : status
  applyFilters()
}

function clearStatus() {
  selectedStatus.value = ''
  applyFilters()
}

function selectReason(reason: string) {
  selectedReason.value = selectedReason.value === reason ? '' : reason
  applyFilters()
}

function clearReason() {
  selectedReason.value = ''
  applyFilters()
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  applyFilters()
}

function applyFilters() {
  syncFiltersToRoute()
  refresh()
}

// Load more
async function loadMore() {
  if (!notificationLogs.value?.page.nextCursor || loadingMore.value) return

  // Les paramètres sont **capturés** au moment de l'appel : si les filtres
  // changent pendant le vol, la page reçue appartient à une autre liste et
  // serait concaténée à la liste filtrée — deux jeux de filtres dans la même
  // liste. On l'abandonne alors.
  const requestedParams = { ...queryParams.value }

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListNotificationLogsResponse>('/admin/notification-logs', {
      params: {
        ...requestedParams,
        cursor: notificationLogs.value.page.nextCursor
      }
    })

    if (!sameRequestParams(requestedParams, queryParams.value)) return

    if (notificationLogs.value) {
      notificationLogs.value = {
        items: [...notificationLogs.value.items, ...moreData.items],
        page: moreData.page
      }
    }
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de charger plus de notifications.',
      color: 'error'
    })
  } finally {
    loadingMore.value = false
  }
}

/** Deux jeux de paramètres de requête sont-ils identiques ? */
function sameRequestParams(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

// Open detail drawer
async function openDetail(notification: NotificationLogListItem) {
  selectedNotification.value = notification
  drawerOpen.value = true
  detailPending.value = true
  detailError.value = null
  notificationDetail.value = null

  try {
    notificationDetail.value = await apiFetch<NotificationLogDetail>(`/admin/notification-logs/${notification.id}`)
  } catch (e) {
    detailError.value = e as Error
  } finally {
    detailPending.value = false
  }
}

// Table columns — le rendu des cellules vit dans le module domaine ; le
// panneau ne fait que fournir l'ouverture du détail.
const columns = buildNotificationLogColumns({ openDetail })
</script>
