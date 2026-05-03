/**
 * Pure helpers for the admin client hard-delete flow (story 0-30).
 *
 * Extracted as standalone functions so behavioral tests can prove the UI
 * mechanics without mounting Vue components.
 */
export type ClientDeletionImpact = {
  appointmentsCount: number
  paymentsCount: number
  subscriptionsCount: number
  canDelete: boolean
  blockReason: 'HAS_PAYMENTS' | 'HAS_SUBSCRIPTIONS' | null
}

export type HardDeleteModalUiState = {
  /** Mode the modal is in: blocked vs confirm. */
  mode: 'loading' | 'blocked' | 'confirm'
  /** Title to render in the modal header. */
  headerTitle: string
  /** Whether the destructive button can be clicked. */
  canConfirm: boolean
  /**
   * Wording shown to the admin when blocked. Always includes both counters
   * (per AC-3) so the admin understands which liability to clear first.
   */
  blockMessage: string | null
}

const HEADER_BLOCKED = 'Suppression impossible'
const HEADER_CONFIRM = 'Suppression définitive'

/**
 * Compute the UI state of the hard-delete modal from the API impact response
 * and the local "I understand" checkbox state.
 *
 * The mapping to the rendered template is:
 * - `mode='loading'`  → spinner (impact not loaded yet)
 * - `mode='blocked'`  → red alert + "Désactiver à la place" CTA + destructive button stays visible but disabled
 * - `mode='confirm'`  → warning alert + irreversibility checkbox + destructive button
 *
 * Important: the destructive "Supprimer définitivement" button is rendered
 * in BOTH `blocked` and `confirm` modes (no v-if). In `blocked` mode it is
 * disabled forever via `isDestructiveButtonDisabled` so the admin sees a
 * locked door rather than a button that vanishes.
 */
export function resolveHardDeleteModalState(
  impact: ClientDeletionImpact | null,
  irreversibleAcknowledged: boolean
): HardDeleteModalUiState {
  if (!impact) {
    return {
      mode: 'loading',
      headerTitle: HEADER_CONFIRM,
      canConfirm: false,
      blockMessage: null
    }
  }

  if (!impact.canDelete) {
    return {
      mode: 'blocked',
      headerTitle: HEADER_BLOCKED,
      canConfirm: false,
      blockMessage: `Cette cliente a ${impact.paymentsCount} paiement(s) ou ${impact.subscriptionsCount} abonnement(s) actif(s). Utilisez « Désactiver » à la place pour préserver l'historique comptable.`
    }
  }

  return {
    mode: 'confirm',
    headerTitle: HEADER_CONFIRM,
    canConfirm: irreversibleAcknowledged,
    blockMessage: null
  }
}

/**
 * Whether the destructive "Supprimer définitivement" button must be disabled.
 *
 * In `blocked` mode the button stays visible (rendered) but disabled forever
 * — the admin reads the lock instead of seeing the button disappear. In
 * `confirm` mode it is disabled until the irreversibility checkbox is
 * acknowledged. In `loading` mode the impact has not arrived yet.
 */
export function isDestructiveButtonDisabled(state: HardDeleteModalUiState): boolean {
  return state.mode === 'blocked' || !state.canConfirm
}

export type HardDeleteErrorOutcome
  = | { kind: 'race-condition' }
    | { kind: 'unknown-error', message: string }

/**
 * Classify a thrown error coming back from the DELETE call.
 *
 * Race condition (409 CLIENT_HAS_FINANCIAL_RECORDS): a payment was inserted
 * between the GET deletion-impact and the DELETE. Modal stays open with a
 * refreshed impact so the admin reads the new block reason.
 *
 * Any other error is reported with a fallback message.
 */
export function classifyHardDeleteError(
  err: unknown
): HardDeleteErrorOutcome {
  if (
    err
    && typeof err === 'object'
    && 'apiError' in err
    && err.apiError
    && typeof err.apiError === 'object'
    && 'code' in err.apiError
    && err.apiError.code === 'CLIENT_HAS_FINANCIAL_RECORDS'
  ) {
    return { kind: 'race-condition' }
  }

  if (err instanceof Error) {
    return { kind: 'unknown-error', message: err.message }
  }

  return { kind: 'unknown-error', message: 'Erreur inattendue' }
}
