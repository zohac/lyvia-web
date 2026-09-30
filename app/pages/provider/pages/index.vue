<script setup lang="ts">
import FeatureGate from '~/components/molecules/FeatureGate.vue'
import ProviderPageCreateModal from '~/components/organisms/ProviderPageCreateModal.vue'
import { useFeatureGate } from '~/features/plans/useFeatureGate'
import { FEATURE_PAGE_BUILDER } from '~/features/plans/domain/feature-codes'
import { useProviderAccount } from '~/features/account/useProviderAccount'
import { useProviderPages } from '~/features/pages/useProviderPages'
import { PAGE_STATUS_META, resolvePageStatus } from '~/features/pages/domain/page-status'
import { MAX_PROVIDER_PAGES, PAGE_LIMIT_BADGE_LABEL } from '~/features/pages/domain/page-limits'
import {
  resolveProviderPagesViewState,
  shouldLoadProviderPages
} from '~/features/pages/domain/pages-list-view'
import type { CreatePageErrorField } from '~/features/pages/domain/create-page-form'
import type { ProviderPageListItem } from '~/features/pages/api/pages.contract'
import { buildPreviewHeaderOverrides, isPreviewEnabled } from '~/features/pages/domain/preview-header-overrides'
import { publishPreviewPage } from '~/features/pages/domain/preview-publish'
import type { PageSaveError } from '~/features/pages/domain/page-editor'
import { publishProviderPage } from '~/features/pages/services/provider-pages.service'
import { formatDateShort } from '~/composables/useDateFormat'
import { useCoachLink } from '~/composables/useCoachLink'
import ProviderPagePreviewOverlay from '~/components/organisms/ProviderPagePreviewOverlay.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mes pages'
})

type PageActionItem = {
  label: string
  icon: string
  onSelect?: () => void
  to?: string
  target?: string
  rel?: string
  external?: boolean
  disabled?: boolean
}

const toast = useToast()

const gate = useFeatureGate()
const canUsePageBuilder = computed(() => gate.hasFeature(FEATURE_PAGE_BUILDER))

const providerAccount = useProviderAccount()

const {
  pages,
  pending,
  loaded,
  errorMessage,
  creating,
  isLimitReached,
  existingSlugs,
  load,
  createPage
} = useProviderPages()

const viewState = computed(() => resolveProviderPagesViewState({
  unlocked: canUsePageBuilder.value,
  pending: pending.value,
  loaded: loaded.value,
  errorMessage: errorMessage.value,
  pageCount: pages.value.length
}))

// The counter/badge only make sense once a successful load has happened.
const showCounter = computed(() => viewState.value === 'empty' || viewState.value === 'list')

// Only fetch pages once the plan is resolved AND carries `page_builder`:
// an Essentiel coach must never hit `/provider/pages` (global 403 toast stays
// the backend fallback). `FeatureGate` renders the lock.
//
// The account is the source of the coach's public origin (custom domain or
// platform `/coach/{slug}`), used for the slug prefix and the "Voir la page en
// ligne" link. `useProviderAccount` is the established provider-page pattern
// (`provider/seo.vue`); it is fetched here rather than extending the feature
// gate, whose job is gating only.
watch(
  canUsePageBuilder,
  (unlocked) => {
    if (!shouldLoadProviderPages(unlocked)) return
    void load()
    void providerAccount.fetchAccount()
  },
  { immediate: true }
)

const coachSite = computed(() => {
  const account = providerAccount.account.value
  if (!account?.slug) return ''
  // Same convention as `provider/coach-page.vue`: custom domain gives an
  // absolute URL, otherwise a relative `/coach/{slug}` (works on any host).
  return useCoachLink({
    slug: account.slug,
    domain: account.customDomain
  }).site
})

const slugPrefix = computed(() => (coachSite.value ? `${coachSite.value}/` : ''))

const decoratedPages = computed(() =>
  pages.value.map((page) => {
    const status = resolvePageStatus(page)
    return { page, meta: PAGE_STATUS_META[status] }
  })
)

const createModalOpen = ref(false)
const createServerError = ref<{ field: CreatePageErrorField, message: string } | null>(null)

const previewOpen = ref(false)
const previewPageId = ref('')
const previewPublishing = ref(false)
const previewError = ref<PageSaveError | null>(null)

/**
 * V2.2e — Brand envelope of the private preview, built from the coach account
 * and injected through `overrides` (no global public-header state mutation).
 */
const headerOverrides = computed(() => buildPreviewHeaderOverrides(providerAccount.account.value))

/** Shared predicate: the preview needs the resolved account for its envelope. */
const previewEnabled = computed(() => isPreviewEnabled(providerAccount.account.value))

function openPreview(page: ProviderPageListItem) {
  if (!previewEnabled.value) return
  previewError.value = null
  previewPageId.value = page.id
  previewOpen.value = true
}

/**
 * V2.2e — Publish from the preview banner (the list has no editor state). The
 * publish→reload sequence lives in a testable helper; the page only toasts.
 * On failure the preview stays open and shows the error inside the overlay.
 */
async function handlePreviewPublish() {
  previewPublishing.value = true
  previewError.value = null
  try {
    const result = await publishPreviewPage(previewPageId.value, {
      publish: publishProviderPage,
      reload: load
    })

    if (!result.ok) {
      previewError.value = result.error
      return
    }

    previewOpen.value = false
    if (result.reloadFailed) {
      toast.add({
        title: 'Page mise en ligne',
        description: 'Votre page est en ligne, mais la liste n\'a pas pu être actualisée.',
        color: 'warning'
      })
      return
    }
    toast.add({
      title: 'Page mise en ligne',
      description: 'Votre page est maintenant visible sur votre site public.',
      color: 'success'
    })
  } finally {
    previewPublishing.value = false
  }
}

function openCreateModal() {
  if (isLimitReached.value) return
  createServerError.value = null
  createModalOpen.value = true
}

async function handleCreate(payload: { title: string, slug: string }) {
  createServerError.value = null
  const outcome = await createPage(payload)

  if (outcome.ok) {
    createModalOpen.value = false
    if (outcome.reloadFailed) {
      // The page exists, but the list failed to refresh: do NOT claim success
      // while the screen shows an error state.
      toast.add({
        title: 'Page créée',
        description: 'Votre page a été créée, mais la liste n\'a pas pu être actualisée.',
        color: 'warning'
      })
      return
    }
    toast.add({
      title: 'Page créée',
      description: 'Votre page est enregistrée en brouillon.',
      color: 'success'
    })
    return
  }

  createServerError.value = { field: outcome.field, message: outcome.message }
  if (outcome.field === null) {
    toast.add({ title: 'Création impossible', description: outcome.message, color: 'error' })
  }
}

function actionsFor(page: ProviderPageListItem): PageActionItem[] {
  const items: PageActionItem[] = [
    {
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        void navigateTo(`/provider/pages/${page.id}`)
      }
    },
    {
      label: 'Prévisualiser',
      icon: 'i-lucide-eye',
      disabled: !previewEnabled.value,
      onSelect: () => openPreview(page)
    }
  ]

  if (page.status === 'published' && coachSite.value) {
    items.push({
      label: 'Voir la page en ligne',
      icon: 'i-lucide-external-link',
      to: `${coachSite.value}/${page.slug}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      external: true
    })
  }

  return items
}

function menuLabel(page: ProviderPageListItem): string {
  if (!page.includeInMenu) return 'Masquée du menu'
  return page.menuLabel ? `Au menu · ${page.menuLabel}` : 'Au menu'
}
</script>

<template>
  <div class="space-y-6">
    <FeatureGate feature="page_builder">
      <div class="space-y-6">
        <AtomsDsPageHeader
          title="Mes pages"
          subtitle="Créez des pages personnalisées pour présenter votre approche et vos conseils."
        >
          <template #actions>
            <UButton
              color="primary"
              icon="i-lucide-plus"
              :disabled="isLimitReached"
              @click="openCreateModal"
            >
              Créer une page
            </UButton>
          </template>
        </AtomsDsPageHeader>

        <div
          v-if="showCounter"
          class="flex flex-wrap items-center justify-between gap-3"
        >
          <p class="text-sm tabular-nums text-[color:var(--color-text-muted)]">
            <span class="font-semibold text-[color:var(--color-text-primary)]">{{ pages.length }}</span>
            / {{ MAX_PROVIDER_PAGES }} pages utilisées
          </p>
          <span
            v-if="isLimitReached"
            class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-sunset-100)] px-3 py-1 text-xs font-medium text-[color:var(--color-sunset-700)]"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="h-3.5 w-3.5"
            />
            {{ PAGE_LIMIT_BADGE_LABEL }}
          </span>
        </div>

        <AtomsDsErrorState
          v-if="viewState === 'error'"
          :message="errorMessage ?? undefined"
          @retry="load()"
        />

        <div
          v-else-if="viewState === 'loading'"
          class="space-y-4"
        >
          <USkeleton class="h-24 w-full" />
          <USkeleton class="h-24 w-full" />
        </div>

        <AtomsDsEmptyState
          v-else-if="viewState === 'empty'"
          icon="i-lucide-files"
          title="Aucune page personnalisée"
          description="Vous n'avez pas encore créé de page personnalisée. Présentez votre parcours, détaillez votre méthode ou partagez des conseils pratiques pour vos futures clientes."
        >
          <template #action>
            <UButton
              color="primary"
              icon="i-lucide-plus"
              @click="openCreateModal"
            >
              Créer ma première page
            </UButton>
          </template>
        </AtomsDsEmptyState>

        <div
          v-else-if="viewState === 'list'"
          class="grid gap-4"
        >
          <div
            v-for="entry in decoratedPages"
            :key="entry.page.id"
            class="rounded-xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    :to="`/provider/pages/${entry.page.id}`"
                    class="truncate text-lg font-semibold text-[color:var(--color-text-primary)] hover:text-crepuscule-700"
                  >
                    {{ entry.page.title }}
                  </NuxtLink>
                  <span :class="entry.meta.badge">
                    {{ entry.meta.label }}
                  </span>
                </div>

                <p class="mt-1 truncate text-sm text-[color:var(--color-text-muted)]">
                  /{{ entry.page.slug }}
                </p>

                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
                  <span>{{ menuLabel(entry.page) }}</span>
                  <span v-if="entry.page.publishedAt">
                    Mis en ligne le {{ formatDateShort(entry.page.publishedAt) }}
                  </span>
                </div>
              </div>

              <UDropdownMenu
                :items="actionsFor(entry.page)"
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :aria-label="`Actions pour ${entry.page.title}`"
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>

    <ProviderPageCreateModal
      v-model:open="createModalOpen"
      :prefix="slugPrefix"
      :submitting="creating"
      :server-error="createServerError"
      :existing-slugs="existingSlugs"
      @submit="handleCreate"
      @clear-error="createServerError = null"
    />

    <ProviderPagePreviewOverlay
      :open="previewOpen"
      :page-id="previewPageId"
      :header-overrides="headerOverrides ?? undefined"
      :publishing="previewPublishing"
      :publish-error="previewError"
      close-label="Fermer"
      @close="previewOpen = false"
      @publish="handlePreviewPublish"
    />
  </div>
</template>
