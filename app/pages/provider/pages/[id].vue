<script setup lang="ts">
import { getProviderPage } from '~/features/pages/services/provider-pages.service'
import { ApiFetchError } from '~/services/api/api-error'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Éditeur de page'
})

const route = useRoute()
const pageId = computed(() => String(route.params.id ?? ''))

const pageTitle = ref('Éditeur de page')
const pending = ref(true)
const errorMessage = ref<string | null>(null)

async function loadPage() {
  pending.value = true
  errorMessage.value = null

  try {
    const page = await getProviderPage(pageId.value)
    pageTitle.value = page.title
  } catch (error: unknown) {
    errorMessage.value = error instanceof ApiFetchError && error.apiError.statusCode === 404
      ? 'Page introuvable.'
      : 'Impossible de charger cette page.'
  } finally {
    pending.value = false
  }
}

onMounted(() => loadPage())
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <AtomsDsPageHeader
      :title="pageTitle"
      :accent-bar="false"
    >
      <template #back>
        <UButton
          to="/provider/pages"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
        />
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="loadPage()"
    />

    <div
      v-else-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-24 w-full" />
    </div>

    <UAlert
      v-else
      color="info"
      variant="soft"
      icon="i-lucide-info"
      title="L'éditeur de contenu arrive bientôt"
      description="Vous pourrez bientôt ajouter du texte, des images et organiser les blocs de cette page."
    />
  </div>
</template>
