<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Articles Keova"
      subtitle="Articles proposés par Keova à vos clientes."
    />

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
      <div
        v-if="pending"
        class="space-y-4"
      >
        <UCard
          v-for="i in 4"
          :key="i"
          class="bg-[color:var(--color-surface-card)]"
        >
          <div class="space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-3 w-1/4" />
          </div>
        </UCard>
      </div>

      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        title="Aucun article Keova pour le moment."
      />

      <div
        v-else
        class="space-y-4"
      >
        <UCard
          v-for="item in items"
          :key="item.id"
          class="bg-[color:var(--color-surface-card)]"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                  {{ item.title }}
                </h3>
                <UBadge
                  :color="item.approved ? 'success' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  {{ platformApprovalStatusLabel(item.approved) }}
                </UBadge>
              </div>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)] line-clamp-2">
                {{ platformExcerpt(item.body) }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {{ formatDate(item.publishedAt) }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                @click="openPreview(item)"
              >
                Aperçu
              </UButton>
              <UButton
                :color="item.approved ? 'warning' : 'primary'"
                variant="soft"
                size="sm"
                :loading="approvingIds.has(item.id)"
                @click="item.approved ? withdrawItem(item.id) : approveItem(item.id)"
              >
                {{ platformApprovalActionLabel(item.approved) }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <div
        v-if="items.length > 0 && nextCursor"
        class="flex justify-center"
      >
        <UButton
          variant="soft"
          color="neutral"
          :loading="loadMorePending"
          @click="loadMore"
        >
          Charger plus
        </UButton>
      </div>
    </template>

    <USlideover
      v-model:open="isPreviewOpen"
      :title="previewItem?.title ?? ''"
    >
      <div
        v-if="previewItem"
        class="space-y-4"
      >
        <img
          v-if="previewItem.coverImageUrl"
          :src="previewItem.coverImageUrl"
          :alt="previewItem.title"
          class="w-full rounded-[var(--radius-lg)] object-cover"
        >
        <div class="prose prose-stone max-w-none whitespace-pre-line text-[color:var(--color-text-primary)]">
          <template v-if="previewItem.body">
            {{ previewItem.body }}
          </template>
          <p
            v-else
            class="italic text-[color:var(--color-text-muted)]"
          >
            Aucun contenu.
          </p>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AtomsDsPageHeader from '../../../components/atoms/DsPageHeader.vue'
import AtomsDsErrorState from '../../../components/atoms/DsErrorState.vue'
import AtomsDsEmptyState from '../../../components/atoms/DsEmptyState.vue'
import { createPlatformContents } from '../../../features/contents/createPlatformContents'
import { listPlatformContents, approvePlatformContent, withdrawPlatformApproval } from '../../../features/contents/services/platform-contents.service'
import {
  platformApprovalActionLabel,
  platformApprovalStatusLabel,
  platformExcerpt
} from '../../../features/contents/domain/platform-approvals'
import { formatDateShort } from '~/composables/useDateFormat'

const toast = useToast()

const contents = createPlatformContents({
  list: listPlatformContents,
  approve: approvePlatformContent,
  withdraw: withdrawPlatformApproval,
  notify: notice => toast.add(notice)
})

const {
  pending,
  errorMessage,
  items,
  nextCursor,
  loadMorePending,
  approvingIds,
  previewItem,
  refresh,
  loadMore,
  approveItem,
  withdrawItem,
  openPreview,
  closePreview
} = contents

const isPreviewOpen = computed({
  get: () => previewItem.value !== null,
  set: (value: boolean) => {
    if (!value) closePreview()
  }
})

function formatDate(value: string | null): string {
  if (!value) return ''
  return formatDateShort(value)
}

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Articles Keova'
})

onMounted(() => {
  void refresh()
})
</script>
