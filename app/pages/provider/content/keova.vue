<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Articles Keova">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Articles proposés par Keova à vos clientes.
        </span>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
      <UCard
        v-if="pending"
        class="bg-[color:var(--color-surface-card)]"
        :ui="{ body: '!px-0 !py-0' }"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="flex flex-col justify-center gap-2 border-b border-[color:var(--color-border-subtle)] px-5 py-4 last:border-b-0"
        >
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-3 w-2/3" />
        </div>
      </UCard>

      <div
        v-else-if="items.length === 0"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
      >
        <AtomsDsEmptyState
          icon="i-lucide-file-text"
          title="Aucun article Keova pour le moment."
        />
      </div>

      <UCard
        v-else
        class="overflow-hidden bg-[color:var(--color-surface-card)]"
        :ui="{ body: '!px-0 !py-0' }"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="flex flex-col gap-4 border-b border-[color:var(--color-border-subtle)] px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate font-sans text-sm font-semibold text-[color:var(--color-text-primary)]">
                {{ item.title }}
              </h3>
              <UBadge
                :color="item.approved ? 'success' : 'neutral'"
                variant="soft"
                size="md"
                :class="getBadgeInkClass(item.approved ? 'success' : 'neutral')"
              >
                {{ platformApprovalStatusLabel(item.approved) }}
              </UBadge>
            </div>
            <p class="mt-1 line-clamp-2 text-sm text-[color:var(--color-text-secondary)]">
              {{ platformExcerpt(item.body) }}
            </p>
            <p :class="`mt-1 ${CONTENT_META_CLASS}`">
              {{ formatDate(item.publishedAt) }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
            <UButton
              variant="outline"
              color="neutral"
              size="md"
              @click="openPreview(item)"
            >
              Aperçu
            </UButton>
            <UButton
              :color="item.approved ? 'neutral' : 'primary'"
              :variant="item.approved ? 'outline' : 'soft'"
              size="md"
              :loading="approvingIds.has(item.id)"
              @click="item.approved ? withdrawItem(item.id) : approveItem(item.id)"
            >
              {{ platformApprovalActionLabel(item.approved) }}
            </UButton>
          </div>
        </article>
      </UCard>

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
            size="md"
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
          variant="outline"
          color="neutral"
          size="md"
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
          class="space-y-5"
        >
          <img
            v-if="previewItem.coverImageUrl"
            :src="previewItem.coverImageUrl"
            :alt="previewItem.title"
            class="block h-40 w-full rounded-[12px] border border-[color:var(--color-border-subtle)] object-cover"
          >
          <p :class="CONTENT_META_CLASS">
            {{ formatDate(previewItem.publishedAt) }}
          </p>
          <div class="prose prose-stone max-w-none whitespace-pre-line text-[color:var(--color-text-primary)]">
            <template v-if="previewItem.body">
              {{ previewItem.body }}
            </template>
            <p
              v-else
              class="italic text-[color:var(--color-text-secondary)]"
            >
              Aucun contenu.
            </p>
          </div>

          <!--
            diffusion-14 AC3: the document the practitioner is about to bring to
            her clients, name and size (AC4), with the means of opening it.
            The route `GET /provider/platform-content/:id/document` is
            authenticated with an in-memory Bearer token, so the button cannot be
            an `<a href>`: it fetches the blob through `apiFetch`, like the
            practitioner's own document download. When `document` is null the
            whole block is absent — never a button that would answer 404.
          -->
          <div
            v-if="previewItem.document"
            data-testid="preview-document"
            class="flex flex-wrap items-center gap-3 rounded-[12px] border border-[color:var(--color-border-subtle)] px-4 py-3"
          >
            <UIcon
              name="i-lucide-file-text"
              class="size-5 shrink-0 text-[color:var(--color-brand-secondary)]"
            />
            <div class="min-w-0 flex-1">
              <p class="break-all text-sm font-medium text-[color:var(--color-text-primary)]">
                {{ previewItem.document.filename }}
              </p>
              <p :class="CONTENT_META_CLASS">
                {{ formatFileSize(previewItem.document.sizeBytes) }}
              </p>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="md"
              :loading="downloading"
              leading-icon="i-lucide-download"
              @click="downloadPreviewDocument"
            >
              Télécharger le document
            </UButton>
            <p
              v-if="downloadErrorMessage"
              role="alert"
              class="w-full text-xs font-medium text-[color:var(--color-error-700)]"
            >
              {{ downloadErrorMessage }}
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
import { createClientDocumentDownload } from '../../../features/contents/createClientDocumentDownload'
import { createPlatformContents } from '../../../features/contents/createPlatformContents'
import {
  getPlatformContentDocument,
  listPlatformContents,
  approvePlatformContent,
  withdrawPlatformApproval
} from '../../../features/contents/services/platform-contents.service'
import { saveDocumentBlob } from '../../../features/contents/services/document-download.browser'
import { formatFileSize } from '../../../features/contents/domain/file-size'
import { getBadgeInkClass } from '../../../features/contents/domain/contents-badges'
import { CONTENT_META_CLASS } from '../../../features/contents/domain/content-field-ui'
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

/**
 * The authenticated-document state machine of diffusion-9, reused as-is: its
 * only dependency is "fetch these bytes through the Bearer-authenticated route",
 * and its target's `slug` field is the route key — a slug for the client read,
 * the article id here. A second copy of the machine would be the pair that
 * diverges (AGENTS §11.6).
 */
const {
  downloading,
  errorMessage: downloadErrorMessage,
  download: downloadDocument
} = createClientDocumentDownload({
  fetchDocument: getPlatformContentDocument,
  save: saveDocumentBlob
})

function downloadPreviewDocument(): void {
  const current = previewItem.value
  if (!current?.document) return
  void downloadDocument({ slug: current.id, filename: current.document.filename })
}

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
