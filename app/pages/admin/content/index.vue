<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'
import type {
  AdminContentItem,
  AdminContentStatusFilter
} from '~/features/contents/api/admin-contents.contract'
import { listAdminContents } from '~/features/contents/services/admin-contents.service'
import {
  createAdminContents,
  ADMIN_CONTENTS_PAGE_LIMIT
} from '~/features/contents/createAdminContents'
import {
  formatAdminApprovalCount,
  getAdminStatusBadge,
  getAdminStatusScopeLabel
} from '~/features/contents/domain/admin-content-form'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Articles Keova'
})

const router = useRouter()

const statusFilters: Array<{ value: AdminContentStatusFilter, label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' }
]

/**
 * Presentation only: the race guards, filter wiring and cursor pagination live
 * in `createAdminContents`, where the unit tests execute them.
 */
const {
  pending,
  errorMessage,
  items,
  nextCursor,
  statusFilter,
  loadMorePending,
  loadMoreErrorMessage,
  refresh,
  loadMore
} = createAdminContents({ list: listAdminContents })

const columns: TableColumn<AdminContentItem>[] = [
  {
    accessorKey: 'title',
    header: 'Titre',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-0.5' }, [
      h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, row.original.title),
      h('span', { class: 'text-xs text-[color:var(--color-brand-muted)]' }, `/${row.original.slug}`)
    ])
  },
  {
    id: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const badge = getAdminStatusBadge(row.original.isPublished)
      const classes = getStatusBadgeClasses(badge.color)
      return h('div', { class: 'flex flex-col gap-1' }, [
        h('span', { class: classes.badge }, [
          h('span', { class: classes.dot }),
          badge.label
        ]),
        h('span', { class: 'text-xs text-[color:var(--color-brand-muted)]' },
          getAdminStatusScopeLabel(row.original.isPublished))
      ])
    }
  },
  {
    id: 'approvalCount',
    header: 'Approbations',
    cell: ({ row }) => h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' },
      formatAdminApprovalCount(row.original.approvalCount))
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) => formatDateShort(row.original.createdAt)
  },
  {
    accessorKey: 'publishedAt',
    header: 'Publié le',
    cell: ({ row }) => row.original.publishedAt
      ? formatDateShort(row.original.publishedAt)
      : '—'
  }
]

function onRowSelect(_event: Event, row: TableRow<AdminContentItem>) {
  router.push(`/admin/content/${row.original.id}`)
}

onMounted(refresh)
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Articles Keova"
      subtitle="Rédigez et publiez les articles visibles par les clientes des praticiennes qui les ont approuvés."
    >
      <template #actions>
        <div class="flex items-center gap-3">
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
          <UButton
            to="/admin/content/new"
            color="primary"
          >
            <UIcon
              name="lucide:plus"
              class="mr-2 h-4 w-4"
            />
            Nouvel article
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <div class="flex items-center gap-3">
      <span class="text-sm text-[color:var(--color-brand-muted)]">Statut :</span>
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        type="button"
        :class="filterPillClasses(statusFilter === filter.value)"
        @click="statusFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <section class="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] shadow-soft">
      <div
        v-if="pending"
        class="space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-14 rounded-xl"
        />
      </div>

      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        title="Aucun article"
        description="Créez le premier article de plateforme."
      />

      <template v-else>
        <UTable
          :data="items"
          :columns="columns"
          :class="[ADMIN_TABLE_CLASSES, '[&_tr:hover_td]:bg-[color:var(--color-crepuscule-50)]/30 [&_tr]:cursor-pointer [&_tr]:transition-colors']"
          @select="onRowSelect"
        />

        <div
          v-if="loadMoreErrorMessage"
          class="px-4 pt-3 text-sm text-[color:var(--color-error)]"
        >
          {{ loadMoreErrorMessage }}
        </div>

        <div
          v-if="nextCursor"
          class="flex justify-center border-t border-[color:var(--color-border-subtle)] p-4"
        >
          <UButton
            variant="outline"
            color="neutral"
            class="rounded-full"
            :loading="loadMorePending"
            @click="loadMore"
          >
            <UIcon
              name="lucide:chevron-down"
              size="16"
            />
            Charger plus ({{ ADMIN_CONTENTS_PAGE_LIMIT }} par page)
          </UButton>
        </div>
      </template>
    </section>
  </div>
</template>
