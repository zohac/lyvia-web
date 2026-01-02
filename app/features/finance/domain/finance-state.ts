import type { ProviderFinanceSummary, StripeConnectStatus } from '../api/finance.contract'

export type ProviderFinanceUiStateKind = 'start' | 'incomplete' | 'ready' | 'shadow'

export type ProviderFinanceUiState = {
  kind: ProviderFinanceUiStateKind
  stripe: StripeConnectStatus
  pendingPayoutCents: number
  pendingPayoutCount: number
  timezone: string
}

export function buildProviderFinanceUiState(summary: ProviderFinanceSummary): ProviderFinanceUiState {
  const pendingPayoutCents = summary.payouts.pendingPayoutCents
  const pendingPayoutCount = summary.payouts.pendingPayoutCount
  const stripe = summary.stripe

  const hasPendingFunds = pendingPayoutCents > 0
  const isReady = stripe.chargesEnabled && stripe.payoutsEnabled
  const isConfigured = stripe.stripeAccountId !== null

  const kind: ProviderFinanceUiStateKind = (() => {
    if (hasPendingFunds && !stripe.payoutsEnabled) return 'shadow'
    if (!isConfigured) return 'start'
    if (!isReady) return 'incomplete'
    return 'ready'
  })()

  return {
    kind,
    stripe,
    pendingPayoutCents,
    pendingPayoutCount,
    timezone: summary.timezone
  }
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Converts Stripe "requirements.currently_due" keys into human-friendly steps.
 *
 * The backend intentionally stores raw Stripe keys; the UI MUST never expose them directly.
 */
export function mapStripeRequirementsToSteps(requirementsDue: string[]): string[] {
  const steps = new Set<string>()

  for (const raw of requirementsDue) {
    const key = normalizeString(raw)
    if (!key) continue

    switch (key) {
      case 'external_account':
        steps.add('Ajouter votre compte bancaire (IBAN) pour recevoir les virements.')
        break
      case 'individual.verification.document':
      case 'company.verification.document':
        steps.add('Vérifier votre identité avec un document officiel.')
        break
      case 'individual.verification.additional_document':
      case 'company.verification.additional_document':
        steps.add('Fournir un document complémentaire pour finaliser la vérification.')
        break
      case 'individual.first_name':
      case 'individual.last_name':
      case 'individual.dob.day':
      case 'individual.dob.month':
      case 'individual.dob.year':
        steps.add('Compléter vos informations personnelles (identité).')
        break
      case 'individual.address.line1':
      case 'individual.address.postal_code':
      case 'individual.address.city':
      case 'individual.address.country':
        steps.add('Renseigner votre adresse postale.')
        break
      case 'business_profile.url':
        steps.add('Ajouter un lien public (site ou page) pour valider votre activité.')
        break
      case 'business_profile.mcc':
      case 'business_profile.product_description':
        steps.add('Décrire votre activité pour valider votre dossier.')
        break
      case 'company.tax_id':
      case 'company.vat_id':
        steps.add('Renseigner vos informations fiscales (si applicable).')
        break
      default:
        if (key.startsWith('individual.')) {
          steps.add('Compléter vos informations personnelles pour finaliser la vérification.')
        } else if (key.startsWith('company.')) {
          steps.add('Compléter les informations de votre structure pour finaliser la vérification.')
        } else {
          steps.add('Finaliser la vérification de votre compte pour activer les virements.')
        }
    }
  }

  return Array.from(steps)
}
