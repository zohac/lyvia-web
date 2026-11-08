import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ProviderAccountResponse } from '~/features/account/api/provider-account.contract'

// Nuxt auto-imported helper; may be undefined in unit tests (node runtime).
const nuxtNavigateTo: ((to: string) => unknown) | undefined
  = (typeof (globalThis as { navigateTo?: unknown }).navigateTo === 'function')
    ? (globalThis as unknown as { navigateTo: (to: string) => unknown }).navigateTo
    : undefined

/**
 * CPD.9 — Cycle de publication (publier / dépublier) de la page coach, extrait
 * de `coach-page.vue`.
 *
 * Observable : checklistModalOpen, confirmUnpublishModalOpen, publishing,
 * publishError, et les actions openPublish / executePublish / unpublish /
 * navigateTo.
 */
export interface CoachPublishDeps {
  /** Compte provider courant (réactif). */
  account: Ref<ProviderAccountResponse | null> | { value: ProviderAccountResponse | null }
  /** Store éditeur (publishCoachPage / unpublishCoachPage). */
  editor?: {
    publishCoachPage?: () => Promise<
      { ok: true, data: ProviderAccountResponse } | { ok: false, errorCode?: string, details?: unknown }
    >
    unpublishCoachPage?: () => Promise<
      { ok: true, data: ProviderAccountResponse } | { ok: false, errorCode?: string }
    >
  } | null
  /** Toast adapter (Nuxt useToast). */
  toast?: { add: (options: unknown) => void } | null
}

export interface CoachPublish {
  checklistModalOpen: Ref<boolean>
  confirmUnpublishModalOpen: Ref<boolean>
  publishing: Ref<boolean>
  publishError: Ref<string | null>
  openPublish: () => Promise<void>
  executePublish: () => Promise<void>
  unpublish: () => Promise<void>
  navigateTo: (sectionId: string) => void
}

export function createCoachPublish(deps: CoachPublishDeps): CoachPublish {
  const account = deps.account as { value: ProviderAccountResponse | null }
  const editor = deps.editor ?? null
  const toast = deps.toast ?? { add: () => {} }

  const checklistModalOpen = ref(false)
  const confirmUnpublishModalOpen = ref(false)
  const publishing = ref(false)
  const publishError = ref<string | null>(null)

  // Idempotency guard for unpublish: a second call (in-flight or after a
  // successful run) must not write again nor emit a second toast.
  let unpublishDone = false
  let unpublishInFlight = false

  async function openPublish(): Promise<void> {
    const acc = account.value
    if (acc?.isTest) return
    if (!acc?.publishChecklist) return
    if (!acc.publishChecklist.isReady) {
      checklistModalOpen.value = true
      return
    }
    await executePublish()
  }

  async function executePublish(): Promise<void> {
    publishing.value = true
    publishError.value = null
    try {
      const result = await editor?.publishCoachPage?.()
      if (result?.ok) {
        checklistModalOpen.value = false
        toast.add({
          title: 'Page mise en ligne',
          description: 'Votre page coach est maintenant accessible publiquement.',
          color: 'success'
        })
      } else {
        publishError.value = 'Impossible de publier votre page coach.'
        checklistModalOpen.value = true
      }
    } catch {
      publishError.value = 'Une erreur inattendue est survenue.'
      checklistModalOpen.value = true
    } finally {
      publishing.value = false
    }
  }

  async function unpublish(): Promise<void> {
    if (publishing.value) return
    if (unpublishInFlight) return
    if (unpublishDone) return
    unpublishInFlight = true
    publishing.value = true
    try {
      const result = await editor?.unpublishCoachPage?.()
      if (result?.ok) {
        unpublishDone = true
        confirmUnpublishModalOpen.value = false
        toast.add({
          title: 'Page dépubliée',
          description: 'Votre page coach est désormais en brouillon.',
          color: 'neutral'
        })
      } else {
        toast.add({
          title: 'Erreur',
          description: 'Impossible de dépublier votre page coach.',
          color: 'error'
        })
      }
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur inattendue est survenue.',
        color: 'error'
      })
    } finally {
      publishing.value = false
      unpublishInFlight = false
    }
  }

  function navigateTo(sectionId: string): void {
    if (sectionId === 'template') {
      if (typeof document !== 'undefined') {
        document.getElementById('section-template')?.scrollIntoView({ behavior: 'smooth' })
      }
      checklistModalOpen.value = false
      return
    }
    if (sectionId === 'offers') {
      if (typeof nuxtNavigateTo === 'function') {
        nuxtNavigateTo('/provider/tarifs')
      }
      checklistModalOpen.value = false
      return
    }
    if (typeof document !== 'undefined') {
      document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth' })
    }
    checklistModalOpen.value = false
  }

  return {
    checklistModalOpen,
    confirmUnpublishModalOpen,
    publishing,
    publishError,
    openPublish,
    executePublish,
    unpublish,
    navigateTo
  }
}

export function useCoachPublish(deps: CoachPublishDeps): CoachPublish {
  return createCoachPublish(deps)
}
