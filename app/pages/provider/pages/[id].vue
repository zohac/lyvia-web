<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProviderPage, listProviderPages } from '~/features/pages/services/provider-pages.service'
import type { ProviderPageResponse } from '~/features/pages/api/pages.contract'
import { buildGuidedDestinations, selectGuidedPages, type GuidedDestination } from '~/features/pages/domain/guided-links'
import { shouldLoadProviderPages } from '~/features/pages/domain/pages-list-view'
import { buildPreviewHeaderOverrides } from '~/features/pages/domain/preview-header-overrides'
import type { PageCommandOutcome } from '~/features/pages/createPageEditor'
import { useProviderAccount } from '~/features/account/useProviderAccount'
import { useCoachLink } from '~/composables/useCoachLink'
import { useFeatureGate } from '~/features/plans/useFeatureGate'
import { FEATURE_PAGE_BUILDER } from '~/features/plans/domain/feature-codes'
import { ApiFetchError } from '~/services/api/api-error'
import FeatureGate from '~/components/molecules/FeatureGate.vue'
import ProviderPageEditor from '~/components/organisms/ProviderPageEditor.vue'
import ProviderPagePreviewOverlay from '~/components/organisms/ProviderPagePreviewOverlay.vue'

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
const previewOpen = ref(false)
const previewPublishing = ref(false)

const providerAccount = useProviderAccount()
const gate = useFeatureGate()
const canUsePageBuilder = computed(() => gate.hasFeature(FEATURE_PAGE_BUILDER))

interface PageEditorHandle {
  requestPublish: () => Promise<PageCommandOutcome>
}

const editorRef = ref<PageEditorHandle | null>(null)

/**
 * V2.2e — Brand envelope of the private preview, built from the coach account
 * and passed to `PublicHeader`/`PublicFooter` through `overrides`, so the
 * overlay never mutates the global public header state (no re-seed pitfall).
 */
const headerOverrides = computed(() => buildPreviewHeaderOverrides(providerAccount.account.value))

/**
 * V2.2e — Publish from the preview banner: the editor runs the command (toast +
 * error surface). The preview closes only on success so a refused publication
 * keeps the coach in context.
 */
async function handlePreviewPublish() {
  previewPublishing.value = true
  try {
    const outcome = await editorRef.value?.requestPublish()
    if (outcome?.ok) previewOpen.value = false
  } finally {
    previewPublishing.value = false
  }
}

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
    pages: publishedPages,
    pricingEnabled: account.sectionsConfig?.pricing
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
          ref="editorRef"
          :page="page"
          :destinations="destinations"
          :preview-disabled="!providerAccount.account.value"
          @reload="loadPage"
          @preview="previewOpen = true"
        />
      </div>
    </FeatureGate>

    <ProviderPagePreviewOverlay
      :open="previewOpen"
      :page-id="pageId"
      :header-overrides="headerOverrides ?? undefined"
      :publishing="previewPublishing"
      @close="previewOpen = false"
      @publish="handlePreviewPublish"
    />
  </div>
</template>
