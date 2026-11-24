<script setup lang="ts">
import { h, onBeforeUnmount } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
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
const contents = createAdminContents({ list: listAdminContents })

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
} = contents

/** AC1: a status filter is a design-system control, not a native `<button>`. */
const statusTabItems = computed(() => statusFilters.map(filter => ({
  label: filter.label,
  value: filter.value
})))

const columns: TableColumn<AdminContentItem>[] = [
  {
    accessorKey: 'title',
    header: 'Titre',
    cell: ({ row }) => h('div', { class: 'flex min-w-[220px] flex-col gap-0.5' }, [
      h('span', { class: 'font-medium text-[color:var(--color-brand-primary)]' }, row.original.title),
      h('span', { class: 'text-xs text-[color:var(--color-neutral-600)]' }, `/${row.original.slug}`)
    ])
  },
  {
    id: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const badge = getAdminStatusBadge(row.original.isPublished)
      const classes = getStatusBadgeClasses(badge.color)
      // `items-start`: a `flex flex-col` stretches its children, which painted
      // the status badge across the whole column (a green bar, not a badge).
      return h('div', { class: 'flex flex-col items-start gap-1' }, [
        h('span', { class: classes.badge }, [
          h('span', { class: classes.dot }),
          badge.label
        ]),
        h('span', { class: 'block max-w-[300px] whitespace-normal text-xs text-[color:var(--color-neutral-600)]' },
          getAdminStatusScopeLabel(row.original.isPublished))
      ])
    }
  },
  {
    id: 'approvalCount',
    header: 'Approbations',
    cell: ({ row }) => h('span', { class: 'text-sm tabular-nums text-[color:var(--color-text-secondary)]' },
      formatAdminApprovalCount(row.original.approvalCount))
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) => h('span', { class: 'text-[color:var(--color-text-secondary)]' }, formatDateShort(row.original.createdAt))
  },
  {
    accessorKey: 'publishedAt',
    header: 'Publié le',
    cell: ({ row }) => h('span', { class: 'text-[color:var(--color-text-secondary)]' }, row.original.publishedAt
      ? formatDateShort(row.original.publishedAt)
      : '—')
  }
]

function onRowSelect(_event: Event, row: TableRow<AdminContentItem>) {
  router.push(`/admin/content/${row.original.id}`)
}

onMounted(refresh)
onBeforeUnmount(() => contents.dispose())
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Articles Keova">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Rédigez et publiez les articles visibles par les clientes des praticiennes qui les ont approuvés.
        </span>
      </template>
      <template #actions>
        <div class="flex max-w-[calc(100vw-5rem)] flex-wrap items-center gap-3 sm:max-w-none">
          <UButton
            size="sm"
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
            size="sm"
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

    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm text-[color:var(--color-text-secondary)]">Statut :</span>
      <UTabs
        :model-value="statusFilter"
        :items="statusTabItems"
        size="md"
        @update:model-value="statusFilter = $event as AdminContentStatusFilter"
      />
    </div>

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <section class="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] shadow-soft">
      <div
        v-if="pending"
        class="space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-[8px]" />
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-14 rounded-[8px]"
        />
      </div>

      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        title="Aucun article"
        description="Créez le premier article de plateforme."
      />

      <template v-else>
        <!-- The table is wider than a phone. `UTable` owns an `overflow-auto`
             root, so it scrolls instead of hiding columns behind the section's
             `overflow-hidden` (the 2026-11-24 capture cut statut, approbations
             and dates away with no way to reach them). -->
        <div>
          <UTable
            :data="items"
            :columns="columns"
            :class="[ADMIN_TABLE_CLASSES, '[&_table]:w-full [&_table]:min-w-[880px] [&_th]:text-[color:var(--color-neutral-600)] [&_tr:hover_td]:bg-[color:var(--color-crepuscule-50)]/40 [&_tr]:cursor-pointer [&_tr]:transition-colors']"
            @select="onRowSelect"
          />
        </div>

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
            size="sm"
            variant="outline"
            color="neutral"
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
