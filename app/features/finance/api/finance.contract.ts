export type StripeConnectStatus = {
  stripeAccountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirementsDue: string[]
  requirementsEventuallyDue: string[]
  requirementsPastDue: string[]
  disabledReason: string | null
  onboardingCompletedAt: string | null
}

export type ProviderFinancePayoutsSummary = {
  pendingPayoutCents: number
  pendingPayoutCount: number
}

// Live pending balance to display (HF18/HF19). verified against OpenAPI spec
export type ProviderFinanceBalance = {
  source: 'stripe' | 'shadow' | 'unavailable'
  // EUR cents (real Stripe pending or shadow cumul); null when source=unavailable.
  pendingCents: number | null
  currency: 'EUR'
}

export type ProviderFinanceSummary = {
  timezone: string
  stripe: StripeConnectStatus
  payouts: ProviderFinancePayoutsSummary
  balance: ProviderFinanceBalance
}

export type StripeConnectOnboardingResponse = {
  accountId: string
  onboardingUrl: string
}
