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

export type ProviderFinanceSummary = {
  timezone: string
  stripe: StripeConnectStatus
  payouts: ProviderFinancePayoutsSummary
}

export type StripeConnectOnboardingResponse = {
  accountId: string
  onboardingUrl: string
}
