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
      v-if="loading"
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
      v-else-if="loadError"
      :message="loadError"
      @retry="load"
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
          Par {{ content.providerName }}
          <template v-if="content.publishedAt">
            · {{ formatDate(content.publishedAt) }}
          </template>
        </p>
      </header>

      <div
        class="prose prose-stone max-w-none whitespace-pre-line text-[color:var(--color-text-primary)]"
      >
        <template v-if="content.body">
          {{ content.body }}
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
import type { ClientContentDetail } from '../../../features/contents/api/contents.contract'
import { getClientContentBySlug } from '../../../features/contents/services/client-contents.service'
import { mapClientContentsErrorToMessage, isClientContentNotFound } from '../../../features/contents/api/client-contents-error'
import { getTypeBadge } from '../../../features/contents/domain/contents-badges'
import { formatDateShort } from '~/composables/useDateFormat'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Ressource'
})

const route = useRoute()

const loading = ref(true)
const loadError = ref<string | null>(null)
const notFound = ref(false)
const content = ref<ClientContentDetail | null>(null)

const slug = computed(() => String(route.params.slug))

let requestId = 0

async function load() {
  const currentSlug = slug.value
  requestId += 1
  const id = requestId
  loading.value = true
  loadError.value = null
  notFound.value = false
  content.value = null
  try {
    const data = await getClientContentBySlug(currentSlug)
    if (requestId !== id) return
    content.value = data
  } catch (err) {
    if (requestId !== id) return
    if (isClientContentNotFound(err)) {
      notFound.value = true
    } else {
      loadError.value = mapClientContentsErrorToMessage(err, 'Impossible de charger le contenu.')
    }
  } finally {
    if (requestId === id) loading.value = false
  }
}

onMounted(load)
watch(slug, load)

function formatDate(value: string | null): string {
  if (!value) return ''
  return formatDateShort(value)
}
</script>
