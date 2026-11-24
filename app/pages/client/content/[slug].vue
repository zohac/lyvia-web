<template>
  <div class="space-y-6">
    <div class="mx-auto max-w-[36rem]">
      <UButton
        to="/client/content"
        variant="ghost"
        color="neutral"
        size="md"
        leading-icon="i-lucide-arrow-left"
      >
        Retour aux ressources
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-48 w-full rounded-[12px]" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
    </div>

    <!-- Not found (404 masked existence) -->
    <div
      v-else-if="notFound"
      class="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
    >
      <AtomsDsEmptyState
        icon="i-lucide-file-x"
        title="Contenu introuvable"
        description="Ce contenu n'existe pas ou n'est plus accessible."
      >
        <template #action>
          <UButton
            to="/client/content"
            variant="outline"
            color="neutral"
            size="md"
          >
            Retour aux ressources
          </UButton>
        </template>
      </AtomsDsEmptyState>
    </div>

    <!-- Error -->
    <AtomsDsErrorState
      v-else-if="errorMessage"
      :message="errorMessage"
      @retry="retry"
    />

    <!-- Content -->
    <article
      v-else-if="content"
      class="mx-auto max-w-[36rem] space-y-6"
    >
      <img
        v-if="content.coverImageUrl"
        :src="content.coverImageUrl"
        :alt="content.title"
        loading="lazy"
        class="h-56 w-full rounded-[12px] border border-[color:var(--color-border-subtle)] object-cover"
      >

      <header class="space-y-3">
        <UBadge
          :color="getTypeBadge(content.type).color"
          variant="soft"
          size="md"
          :class="getBadgeInkClass(getTypeBadge(content.type).color)"
        >
          {{ getTypeBadge(content.type).label }}
        </UBadge>
        <h1 class="font-serif text-3xl font-bold leading-tight text-[color:var(--color-text-primary)]">
          {{ content.title }}
        </h1>
        <p class="text-sm text-[color:var(--color-text-secondary)]">
          Par {{ content.source === 'keova' ? 'Keova' : (content.providerName ?? 'Keova') }}
          <template v-if="content.publishedAt">
            · {{ formatDate(content.publishedAt) }}
          </template>
        </p>
        <div
          v-if="content.document"
          class="flex flex-wrap items-center gap-3 rounded-[12px] border border-[color:var(--color-border-subtle)] px-4 py-3"
        >
          <UIcon
            name="i-lucide-file-text"
            class="size-5 shrink-0 text-[color:var(--color-brand-secondary)]"
          />
          <UButton
            color="primary"
            variant="soft"
            size="md"
            :loading="downloading"
            leading-icon="i-lucide-download"
            @click="downloadDocument"
          >
            Télécharger le document
          </UButton>
        </div>
        <p
          v-if="downloadErrorMessage"
          role="alert"
          class="text-xs font-medium text-[color:var(--color-error-700)]"
        >
          {{ downloadErrorMessage }}
        </p>
      </header>

      <div
        class="prose prose-stone max-w-none whitespace-pre-line text-base leading-relaxed text-[color:var(--color-text-primary)]"
      >
        <template v-if="content.body">
          <AtomsContentBody :text="content.body" />
        </template>
        <p
          v-else
          class="italic text-[color:var(--color-text-secondary)]"
        >
          Aucun contenu.
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import AtomsContentBody from '../../../components/atoms/ContentBody.vue'
import { createClientContent } from '../../../features/contents/createClientContent'
import { createClientDocumentDownload } from '../../../features/contents/createClientDocumentDownload'
import { getClientContentBySlug, getClientContentDocument } from '../../../features/contents/services/client-contents.service'
import { saveDocumentBlob } from '../../../features/contents/services/document-download.browser'
import { getTypeBadge, getBadgeInkClass } from '../../../features/contents/domain/contents-badges'
import { formatDateShort } from '~/composables/useDateFormat'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Ressource'
})

const route = useRoute()

const { pending, notFound, errorMessage, content, load } = createClientContent({
  load: getClientContentBySlug
})

const {
  downloading,
  errorMessage: downloadErrorMessage,
  download: downloadDocumentBlob
} = createClientDocumentDownload({
  fetchDocument: getClientContentDocument,
  save: saveDocumentBlob
})

/**
 * The document route is authenticated by an in-memory Bearer token, so the
 * button cannot be a link: it fetches the blob and keeps the reader here.
 */
async function downloadDocument(): Promise<void> {
  const current = content.value
  if (!current?.document) return
  await downloadDocumentBlob({ slug: current.slug, filename: current.document.filename })
}

const slug = computed(() => String(route.params.slug))

function retry() {
  void load(slug.value)
}

onMounted(retry)
watch(slug, retry)

function formatDate(value: string | null): string {
  if (!value) return ''
  return formatDateShort(value)
}
</script>
