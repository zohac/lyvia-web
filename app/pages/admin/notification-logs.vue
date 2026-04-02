<template>
  <div>
    <AtomsDsPageHeader
      title="Notification Logs"
      subtitle="Historique des notifications envoyées (emails, SMS)"
      class="mb-10"
    >
      <template #actions>
        <NuxtLink
          to="/admin/dashboard"
          class="flex items-center gap-2 text-sm font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:text-[color:var(--color-brand-primary)]"
        >
          <UIcon
            name="lucide:arrow-left"
            size="16"
          />
          Retour au dashboard
        </NuxtLink>
      </template>
    </AtomsDsPageHeader>

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
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              selectedType === typeOption.value
                ? `${typeOption.activeClass} shadow-sm`
                : 'border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-solid)] hover:text-[color:var(--color-brand-primary)]'
            ]"
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
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              selectedStatus === statusOption.value
                ? `${statusOption.activeClass} shadow-sm`
                : 'border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-solid)] hover:text-[color:var(--color-brand-primary)]'
            ]"
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

      <!-- Row 2: Date Range -->
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
            class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-solid)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
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
            class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-solid)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
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

      <!-- Table -->
      <div
        v-else
        class="relative z-10"
      >
        <UTable
          :data="notificationLogs.items"
          :columns="columns"
          :class="ADMIN_TABLE_CLASSES"
        />

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

        <div
          v-else-if="notificationDetail"
          class="space-y-6 p-4"
        >
          <!-- Type & Status -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Type
              </span>
              <div class="mt-2">
                <span :class="`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getNotificationTypeBadgeClasses(notificationDetail.type)}`">
                  {{ notificationDetail.type }}
                </span>
              </div>
            </div>

            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Status
              </span>
              <div class="mt-2">
                <span :class="`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getNotificationStatusBadgeClasses(notificationDetail.status)}`">
                  {{ getNotificationStatusLabel(notificationDetail.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Channel -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Channel
            </span>
            <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
              {{ notificationDetail.channel }}
            </p>
          </div>

          <!-- Date -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Date
            </span>
            <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
              {{ formatDate(notificationDetail.createdAt) }}
            </p>
          </div>

          <!-- Recipient -->
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Destinataire (hash)
            </span>
            <p class="mt-2 break-all font-mono text-xs text-[color:var(--color-brand-secondary)]">
              {{ notificationDetail.recipient }}
            </p>
          </div>

          <!-- Payload Preview -->
          <div v-if="notificationDetail.payloadPreview">
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              Payload Preview
            </span>
            <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-[color:var(--color-surface-muted)] p-4 text-xs text-[color:var(--color-brand-primary)]">{{ notificationDetail.payloadPreview }}</pre>
          </div>

          <!-- Error Message -->
          <div
            v-if="notificationDetail.errorMessage"
            class="rounded-lg bg-[color:var(--color-error-50)] p-4"
          >
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-error-600)]">
              Erreur
            </span>
            <p class="mt-2 text-sm text-[color:var(--color-error-700)]">
              {{ notificationDetail.errorMessage }}
            </p>
          </div>

          <!-- Provider Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Provider Message ID
              </span>
              <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
                {{ notificationDetail.providerMessageId ?? '—' }}
              </p>
            </div>

            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Tentatives
              </span>
              <p class="mt-2 text-sm text-[color:var(--color-brand-primary)]">
                {{ notificationDetail.attemptCount }}
              </p>
            </div>
          </div>

          <!-- IDs -->
          <div class="space-y-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Client ID
              </span>
              <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
                {{ notificationDetail.clientId }}
              </p>
            </div>

            <div v-if="notificationDetail.appointmentId">
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Appointment ID
              </span>
              <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
                {{ notificationDetail.appointmentId }}
              </p>
            </div>

            <div>
              <span class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Log ID
              </span>
              <p class="mt-2 font-mono text-xs text-[color:var(--color-brand-secondary)]">
                {{ notificationDetail.id }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import {
  getNotificationStatusBadgeClasses,
  getNotificationTypeBadgeClasses,
  getNotificationStatusLabel
} from '~/composables/useAdminBadges'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'

const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Notification Logs'
})

// Types
type NotificationLogListItem = {
  id: string
  type: string
  channel: string
  status: string
  recipient: string
  appointmentId: string | null
  createdAt: string
}

type ListNotificationLogsResponse = {
  items: NotificationLogListItem[]
  page: {
    limit: number
    nextCursor: string | null
  }
}

type NotificationLogDetail = {
  id: string
  type: string
  channel: string
  status: string
  recipient: string
  payloadPreview: string | null
  errorMessage: string | null
  providerMessageId: string | null
  attemptCount: number
  appointmentId: string | null
  clientId: string
  createdAt: string
}

// Filters
const selectedType = ref<string>('')
const selectedStatus = ref<string>('')
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

const hasActiveFilters = computed(() => {
  return selectedType.value !== ''
    || selectedStatus.value !== ''
    || dateFrom.value !== ''
    || dateTo.value !== ''
})

// API params
const queryParams = computed(() => {
  const params: Record<string, string> = { limit: '20' }
  if (selectedType.value) params.type = selectedType.value
  if (selectedStatus.value) params.status = selectedStatus.value
  if (dateFrom.value) params.dateFrom = new Date(dateFrom.value).toISOString()
  if (dateTo.value) params.dateTo = new Date(dateTo.value).toISOString()
  return params
})

// Fetch notification logs (no watch - manual refresh to avoid double-fetch)
const { data: notificationLogs, pending, error, refresh } = await useAsyncData<ListNotificationLogsResponse>(
  'admin-notification-logs',
  () => apiFetch<ListNotificationLogsResponse>('/admin/notification-logs', { params: queryParams.value })
)

// Filter handlers
function selectType(type: string) {
  selectedType.value = selectedType.value === type ? '' : type
  refresh()
}

function clearType() {
  selectedType.value = ''
  refresh()
}

function selectStatus(status: string) {
  selectedStatus.value = selectedStatus.value === status ? '' : status
  refresh()
}

function clearStatus() {
  selectedStatus.value = ''
  refresh()
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  refresh()
}

function applyFilters() {
  refresh()
}

// Load more
async function loadMore() {
  if (!notificationLogs.value?.page.nextCursor || loadingMore.value) return

  loadingMore.value = true
  try {
    const moreData = await apiFetch<ListNotificationLogsResponse>('/admin/notification-logs', {
      params: {
        ...queryParams.value,
        cursor: notificationLogs.value.page.nextCursor
      }
    })

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

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Format recipient (truncate SHA256 hash for table display)
function formatRecipient(recipient: string): string {
  if (recipient.startsWith('sha256:')) {
    return `sha256:${recipient.slice(7, 15)}…`
  }
  return recipient
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

// Table columns
const columns: TableColumn<NotificationLogListItem>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' }, formatDate(row.original.createdAt))
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      return h('span', {
        class: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationTypeBadgeClasses(row.original.type)}`
      }, row.original.type)
    }
  },
  {
    accessorKey: 'channel',
    header: 'Channel',
    cell: ({ row }) => {
      return h('span', {
        class: 'text-sm text-[color:var(--color-brand-primary)]'
      }, row.original.channel)
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return h('span', {
        class: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationStatusBadgeClasses(row.original.status)}`
      }, getNotificationStatusLabel(row.original.status))
    }
  },
  {
    accessorKey: 'recipient',
    header: 'Destinataire',
    cell: ({ row }) => {
      return h('span', {
        class: 'font-mono text-xs text-[color:var(--color-brand-muted)]',
        title: row.original.recipient
      }, formatRecipient(row.original.recipient))
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('button', {
        class: 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:bg-[color:var(--ui-color-primary-50)] hover:text-[color:var(--color-brand-primary)]',
        onClick: () => openDetail(row.original)
      }, [
        h('span', {}, 'Détails'),
        h('svg', {
          'class': 'h-3.5 w-3.5',
          'xmlns': 'http://www.w3.org/2000/svg',
          'fill': 'none',
          'viewBox': '0 0 24 24',
          'stroke': 'currentColor',
          'stroke-width': '2'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'd': 'M9 5l7 7-7 7'
          })
        ])
      ])
    }
  }
]
</script>
