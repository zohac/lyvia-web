import { computed, ref } from 'vue'

import {
  buildConsentSubmission,
  consentOutcomeFor,
  CONSENT_ERROR_MESSAGE,
  CONSENT_RATE_LIMIT_MESSAGE,
  type ConsentSubmitOutcome
} from './consent-submit'
import {
  hasConsentWithdrawal,
  type ConsentPageState,
  type ConsentWithdrawalChannel
} from './consent-page'
import type { UpdatePublicConsentRequest } from './public-consent.contract'

/**
 * CC.2b / R5 — the executable brain of the tokenized withdrawal page.
 *
 * Pattern `createFeatureGate` / `createAdminWaitlistStore` : this factory
 * imports nothing but `vue` and the pure rules, so the Node test runner can
 * mount it and observe every reactive read. The `.vue` page is the thin Nuxt
 * wrapper — it reads the query, injects the transport and renders.
 *
 * Why the state lives here and not in the page: the visitor's selection is
 * the one thing the submitted body depends on. If the page owned it, the body
 * would be built by code no test runs, and a page that submitted a fixed
 * list of channels instead of the visitor's own would keep the whole suite
 * green. Here, the page only *seeds* the selection (with what the query
 * carries) and then renders it: from that point on the module owns it, and
 * the submitted body is the module's own mapping of it.
 *
 * Nothing in this module consults the token's validity — see
 * `consent-submit.ts` for the invariant.
 */

export type ConsentWithdrawalPageDependencies = {
  /**
   * The bearer token, read at submit time.
   *
   * A getter, not a value: the page keeps it in a `computed` (the query can
   * change under the same route) and the module must read the current one,
   * not the one captured when the page was created.
   */
  getToken: () => string
  /** The channels checked when the page was (re)loaded. */
  initialChannels: ConsentWithdrawalChannel[]
  /** The neutral state carried by the redirect, if any. */
  initialState: ConsentPageState | null
  /** The transport: receives the body and resolves when the API accepted it. */
  send: (body: UpdatePublicConsentRequest) => Promise<void>
  /** Notified after every outcome, to let the page raise a toast. */
  notify?: (outcome: ConsentSubmitOutcome) => void
}

/**
 * Builds the page's reactive state and its submit action.
 *
 * The page renders what this returns; it never decides anything itself.
 */
export function createConsentWithdrawalPage(deps: ConsentWithdrawalPageDependencies) {
  const selection = ref<ConsentWithdrawalChannel[]>([...deps.initialChannels])
  const state = ref<ConsentPageState | null>(deps.initialState)
  const isSubmitting = ref(false)

  /**
   * An error and a throttled request are both "not saved", and both are
   * announced assertively — but they are not the same sentence.
   */
  const hasError = computed(
    () => state.value === 'error' || state.value === 'rate-limited'
  )
  const isSaved = computed(() => state.value === 'saved')
  const hasAnySelection = computed(() => hasConsentWithdrawal(selection.value))

  const errorMessage = computed(() => {
    if (state.value === 'rate-limited') return CONSENT_RATE_LIMIT_MESSAGE
    if (state.value === 'error') return CONSENT_ERROR_MESSAGE
    return ''
  })

  /**
   * Submits the visitor's withdrawal.
   *
   * A passive submission (nothing checked, or a token that cannot be acted on)
   * sends nothing at all and leaves the page neutral: re-opening the link and
   * pressing "Enregistrer" cannot withdraw anything by accident.
   */
  async function submit(): Promise<void> {
    if (isSubmitting.value) return

    const submission = buildConsentSubmission({
      token: deps.getToken(),
      channels: selection.value
    })

    if (submission.passive) {
      state.value = null
      return
    }

    isSubmitting.value = true

    try {
      await deps.send(submission.body)
      state.value = 'saved'
      deps.notify?.('saved')
    } catch (error: unknown) {
      // A throttled request and a transport failure are told apart here, and
      // nowhere else: the outcome says nothing about the token.
      const outcome = consentOutcomeFor(error)
      state.value = outcome
      deps.notify?.(outcome)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    selection,
    state,
    isSubmitting,
    hasError,
    isSaved,
    hasAnySelection,
    errorMessage,
    submit
  }
}

export type ConsentWithdrawalPage = ReturnType<typeof createConsentWithdrawalPage>
