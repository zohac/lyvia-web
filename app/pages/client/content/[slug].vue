<template>
  <div class="space-y-6">
    <UButton
      to="/client/content"
      variant="ghost"
      color="neutral"
      leading-icon="i-lucide-arrow-left"
      class="mb-2"
    >
      Retour aux ressources
    </UButton>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-48 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
    </div>

    <!-- Not found (404 masked existence) -->
    <div
      v-else-if="notFound"
      class="flex flex-col items-center gap-4 py-12 text-center"
    >
      <UIcon
        name="i-lucide-file-x"
        class="size-16 text-[color:var(--color-text-muted)]"
      />
      <h2 class="text-xl font-semibold text-[color:var(--color-text-primary)]">
        Contenu introuvable
      </h2>
      <p class="text-[color:var(--color-text-muted)]">
        Ce contenu n'existe pas ou n'est plus accessible.
      </p>
      <UButton
        to="/client/content"
        variant="soft"
        color="neutral"
      >
        Retour aux ressources
      </UButton>
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
      class="mx-auto max-w-3xl space-y-6"
    >
      <img
        v-if="content.coverImageUrl"
        :src="content.coverImageUrl"
        :alt="content.title"
        loading="lazy"
        class="w-full rounded-[var(--radius-lg)] object-cover"
      >

      <header class="space-y-3">
        <UBadge
          :color="getTypeBadge(content.type).color"
          variant="soft"
        >
          {{ getTypeBadge(content.type).label }}
        </UBadge>
        <h1 class="font-serif text-3xl font-bold leading-tight text-[color:var(--color-text-primary)]">
          {{ content.title }}
        </h1>
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Par {{ content.source === 'keova' ? 'Keova' : (content.providerName ?? 'Keova') }}
          <template v-if="content.publishedAt">
            · {{ formatDate(content.publishedAt) }}
          </template>
        </p>
        <UButton
          v-if="content.document"
          color="primary"
          variant="soft"
          size="sm"
          :loading="downloading"
          leading-icon="i-lucide-download"
          class="mt-2"
          @click="downloadDocument"
        >
          Télécharger le document
        </UButton>
        <p
          v-if="downloadErrorMessage"
          role="alert"
          class="text-sm text-[color:var(--color-text-muted)]"
        >
          {{ downloadErrorMessage }}
        </p>
      </header>

      <div
        class="prose prose-stone max-w-none whitespace-pre-line text-[color:var(--color-text-primary)]"
      >
        <template v-if="content.body">
          <AtomsContentBody :text="content.body" />
        </template>
        <p
          v-else
          class="italic text-[color:var(--color-text-muted)]"
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
import { getTypeBadge } from '../../../features/contents/domain/contents-badges'
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
