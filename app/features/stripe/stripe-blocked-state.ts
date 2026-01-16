import type { StripeConnectStatus } from '../finance/api/finance.contract'

export type ProviderStripeBlockedState = {
  isBlocked: boolean
  blockMessage: string | null
}

/**
 * Determines if a Stripe account is blocked (critical state requiring action).
 *
 * An account is blocked if:
 * - disabledReason is set (account disabled by Stripe)
 * - requirementsPastDue has items (deadline passed)
 */
export function computeBlockedState(status: StripeConnectStatus | null): ProviderStripeBlockedState {
  if (!status || !status.stripeAccountId) {
    return { isBlocked: false, blockMessage: null }
  }

  // Account disabled by Stripe
  if (status.disabledReason) {
    return {
      isBlocked: true,
      blockMessage: 'Votre compte Stripe est désactivé. Certaines fonctionnalités sont indisponibles.'
    }
  }

  // Past due requirements (deadline passed)
  if (status.requirementsPastDue && status.requirementsPastDue.length > 0) {
    return {
      isBlocked: true,
      blockMessage: 'Des informations requises n\'ont pas été fournies à temps. Vos paiements peuvent être suspendus.'
    }
  }

  return { isBlocked: false, blockMessage: null }
}
