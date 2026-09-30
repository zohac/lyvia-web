<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getProviderPagePreview } from '~/features/pages/services/provider-pages.service'
import type { ProviderPagePreviewResponse } from '~/features/pages/api/pages.contract'
import type { PageSaveError } from '~/features/pages/domain/page-editor'
import type { PublicHeaderState } from '~/features/public/state/public-header.state'
import PagePreviewBanner from '~/components/molecules/PagePreviewBanner.vue'
import PageBlockRenderer from '~/components/molecules/PageBlockRenderer.vue'
import PublicHeader from '~/components/organisms/PublicHeader.vue'
import PublicFooter from '~/components/organisms/PublicFooter.vue'

/**
 * V2.2e — Full-screen private preview of the draft.
 *
 * Fidelity by construction: it composes the **public** renderer
 * (`PageBlockRenderer`) and the branded envelope (`PublicHeader` with
 * `overrides` + `PublicFooter`) instead of reimplementing the look. It reads
 * the draft through `GET /provider/pages/:id/preview` (`private, no-store`)
 * and triggers **zero** tracking — no booking, payment or measurement call is
 * ever emitted (UX §4.1).
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    pageId: string
    /** Brand envelope, same shape as `PublicHeader`/`PublicFooter` overrides. */
    headerOverrides?: Partial<PublicHeaderState>
    /** True while a banner-triggered publish is in flight. */
    publishing?: boolean
    /** Publish failure kept visible inside the overlay (preview stays open). */
    publishError?: PageSaveError | null
    /** Contextual label of the close action ("Revenir à l'éditeur" by default). */
    closeLabel?: string
  }>(),
  {
    headerOverrides: undefined,
    publishing: false,
    publishError: null,
    closeLabel: 'Revenir à l\'éditeur'
  }
)

const emit = defineEmits<{
  (event: 'close' | 'publish'): void
}>()

const preview = ref<ProviderPagePreviewResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const dialog = ref<HTMLElement | null>(null)

/** Request generation: a fast close/reopen must never render a stale page. */
let requestSeq = 0
let wasOpen = false
let previouslyFocused: HTMLElement | null = null
let previousBodyOverflow: string | null = null

function lockScroll() {
  if (typeof document === 'undefined') return
  if (previousBodyOverflow === null) previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  if (typeof document === 'undefined') return
  if (previousBodyOverflow === null) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = null
}

async function loadPreview() {
  const seq = ++requestSeq
  loading.value = true
  error.value = null
  preview.value = null

  try {
    const result = await getProviderPagePreview(props.pageId)
    if (seq !== requestSeq) return
    preview.value = result
  } catch {
    if (seq !== requestSeq) return
    error.value = 'Impossible de charger la prévisualisation. Fermez cette fenêtre puis réessayez.'
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch(
  () => [props.open, props.pageId] as const,
  ([open]) => {
    if (open) {
      if (!wasOpen) {
        previouslyFocused = typeof document !== 'undefined'
          ? (document.activeElement as HTMLElement | null)
          : null
        lockScroll()
        publishLocked = false
      }
      wasOpen = true
      void loadPreview()
      void nextTick(() => dialog.value?.focus())
      return
    }

    if (!wasOpen) return
    wasOpen = false
    requestSeq += 1
    unlockScroll()
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }
)

onBeforeUnmount(() => {
  // Invalidate any in-flight preview fetch and release the scroll lock.
  requestSeq += 1
  unlockScroll()
})

function close() {
  if (props.publishing) return
  emit('close')
}

/**
 * Synchronous re-entry lock: two clicks in the same tick both see the same
 * (not yet updated) `publishing` prop, so the prop alone cannot guard them.
 */
let publishLocked = false

watch(() => props.publishing, (value) => {
  if (!value) publishLocked = false
})

function onBannerPublish() {
  if (publishLocked || props.publishing) return
  publishLocked = true
  emit('publish')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] overflow-y-auto bg-[color:var(--color-surface-page)]"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Prévisualisation privée de la page"
        tabindex="-1"
        class="min-h-full outline-none"
        @keydown.escape="close"
      >
        <PagePreviewBanner
          :publishing="publishing"
          :close-label="closeLabel"
          @close="close"
          @publish="onBannerPublish"
        />

        <div
          v-if="publishError"
          class="mx-auto w-full max-w-4xl px-4 pt-8 sm:px-6"
        >
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="publishError.title"
            :description="publishError.message"
          />
        </div>

        <PublicHeader
          :overrides="headerOverrides"
          :floating="false"
        />

        <div
          v-if="loading"
          class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
          role="status"
          aria-live="polite"
          aria-label="Chargement de la prévisualisation"
        >
          <USkeleton class="h-10 w-2/3" />
          <USkeleton class="mt-8 h-40 w-full" />
        </div>

        <div
          v-else-if="error"
          class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
        >
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            title="Prévisualisation indisponible"
            :description="error"
          />
          <UButton
            class="mt-4 min-h-11"
            color="primary"
            icon="i-lucide-arrow-left"
            @click="close"
          >
            {{ closeLabel }}
          </UButton>
        </div>

        <div
          v-else-if="preview"
          class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
        >
          <header class="mb-8 text-center sm:mb-12 sm:text-left">
            <h1 class="font-heading text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              {{ preview.title }}
            </h1>
          </header>

          <PageBlockRenderer :blocks="preview.contentBlocks" />
        </div>

        <PublicFooter :overrides="headerOverrides" />
      </div>
    </div>
  </Teleport>
</template>
