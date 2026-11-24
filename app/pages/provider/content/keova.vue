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

      <UAlert
        v-if="loadMoreErrorMessage"
        color="warning"
        variant="soft"
        title="Chargement impossible"
        :description="loadMoreErrorMessage"
        icon="i-lucide-alert-triangle"
      >
        <template #actions>
          <UButton
            color="warning"
            variant="soft"
            size="sm"
            @click="loadMore"
          >
            Réessayer
          </UButton>
        </template>
      </UAlert>

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
      <!--
        diffusion-14 AC2: Nuxt UI v4 renders `USlideover`'s DEFAULT slot as the
        panel's *trigger* (`DialogTrigger` in `Slideover.vue`); the panel paints
        `<slot name="body">`. The article therefore lives in `#body` — in the
        default slot it never reached the panel, which showed the title only.
      -->
      <template #body>
        <div
          v-if="previewItem"
          class="space-y-4"
        >
          <img
            v-if="previewItem.coverImageUrl"
            :src="previewItem.coverImageUrl"
            :alt="previewItem.title"
            class="block h-40 w-full rounded-[var(--radius-lg)] object-cover"
          >
          <div class="prose prose-stone max-w-none text-[color:var(--color-text-primary)]">
            <AtomsContentBody
              v-if="previewItem.body"
              :text="previewItem.body"
            />
            <p
              v-else
              class="italic text-[color:var(--color-text-muted)]"
            >
              Aucun contenu.
            </p>
          </div>

          <!--
            diffusion-14 AC3: the document the practitioner is about to bring to
            her clients. Only `filename` and `sizeBytes` are exposed (AC4), and
            no route serves a platform article's bytes to a provider —
            `GET /provider/content/{id}/document` joins on `provider_profiles`
            and a platform article has `provider_id IS NULL`. The block therefore
            names where the document opens instead of shipping a button that
            answers 404.
          -->
          <div
            v-if="previewItem.document"
            data-testid="preview-document"
            class="rounded-lg border border-[color:var(--color-brand-subtle)] px-3 py-2"
          >
            <p class="text-sm font-medium text-[color:var(--color-text-primary)]">
              {{ previewItem.document.filename }}
            </p>
            <p class="text-xs text-[color:var(--color-text-muted)]">
              {{ formatFileSize(previewItem.document.sizeBytes) }}
            </p>
            <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
              Ce document accompagne l’article : vos clientes le téléchargent depuis leur espace.
            </p>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AtomsDsPageHeader from '../../../components/atoms/DsPageHeader.vue'
import AtomsDsErrorState from '../../../components/atoms/DsErrorState.vue'
import AtomsDsEmptyState from '../../../components/atoms/DsEmptyState.vue'
// Explicit import, as for the sibling surfaces: a tag the resolver misses
// renders nothing while lint, typecheck and the build stay green (AGENTS §11.6).
import AtomsContentBody from '../../../components/atoms/ContentBody.vue'
import { createPlatformContents } from '../../../features/contents/createPlatformContents'
import { listPlatformContents, approvePlatformContent, withdrawPlatformApproval } from '../../../features/contents/services/platform-contents.service'
import { formatFileSize } from '../../../features/contents/domain/file-size'
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
  loadMoreErrorMessage,
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
