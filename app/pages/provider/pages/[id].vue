<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProviderPage, listProviderPages } from '~/features/pages/services/provider-pages.service'
import type { ProviderPageResponse } from '~/features/pages/api/pages.contract'
import { buildGuidedDestinations, selectGuidedPages, type GuidedDestination } from '~/features/pages/domain/guided-links'
import { shouldLoadProviderPages } from '~/features/pages/domain/pages-list-view'
import { useProviderAccount } from '~/features/account/useProviderAccount'
import { useCoachLink } from '~/composables/useCoachLink'
import { useFeatureGate } from '~/features/plans/useFeatureGate'
import { FEATURE_PAGE_BUILDER } from '~/features/plans/domain/feature-codes'
import { ApiFetchError } from '~/services/api/api-error'
import FeatureGate from '~/components/molecules/FeatureGate.vue'
import ProviderPageEditor from '~/components/organisms/ProviderPageEditor.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Éditeur de page'
})

const route = useRoute()
const pageId = computed(() => String(route.params.id ?? ''))

const pageTitle = ref('Éditeur de page')
const page = ref<ProviderPageResponse | null>(null)
const pending = ref(true)
const errorMessage = ref<string | null>(null)
const destinations = ref<GuidedDestination[]>([])

const providerAccount = useProviderAccount()
const gate = useFeatureGate()
const canUsePageBuilder = computed(() => gate.hasFeature(FEATURE_PAGE_BUILDER))

async function loadPage() {
  pending.value = true
  errorMessage.value = null

  try {
    const loaded = await getProviderPage(pageId.value)
    page.value = loaded
    pageTitle.value = loaded.title
  } catch (error: unknown) {
    errorMessage.value = error instanceof ApiFetchError && error.apiError.statusCode === 404
      ? 'Page introuvable.'
      : 'Impossible de charger cette page.'
  } finally {
    pending.value = false
  }
}

/**
 * The guided-link catalogue resolves against the coach's real public routes
 * (`useCoachLink`) plus every published page, so no internal link can 404.
 */
async function loadDestinations() {
  const account = providerAccount.account.value
  if (!account?.slug) return

  const link = useCoachLink({ slug: account.slug, domain: account.customDomain })

  let publishedPages: { slug: string, title: string }[] = []
  try {
    const pages = await listProviderPages()
    publishedPages = selectGuidedPages(pages, pageId.value)
  } catch {
    publishedPages = []
  }

  destinations.value = buildGuidedDestinations({
    site: link.site,
    booking: link.booking,
    pages: publishedPages
  })
}

async function load() {
  await loadPage()
  await providerAccount.fetchAccount()
  await loadDestinations()
}

// Only fetch once the plan is resolved AND carries `page_builder`: an Essentiel
// coach must never hit `/provider/pages/:id` (same rule as the list screen).
watch(
  canUsePageBuilder,
  (unlocked) => {
    if (!shouldLoadProviderPages(unlocked)) return
    void load()
  },
  { immediate: true }
)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <FeatureGate feature="page_builder">
      <div class="space-y-6">
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
          @retry="load()"
        />

        <div
          v-else-if="pending"
          class="space-y-4"
        >
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-40 w-full" />
        </div>

        <ProviderPageEditor
          v-else-if="page"
          :page="page"
          :destinations="destinations"
          @reload="loadPage"
        />
      </div>
    </FeatureGate>
  </div>
</template>
