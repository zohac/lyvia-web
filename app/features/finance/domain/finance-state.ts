import type { ProviderFinanceSummary, StripeConnectStatus } from '../api/finance.contract'

export type RequirementSeverity = 'critical' | 'warning' | 'info'

export type StripeRequirementAlert = {
  severity: RequirementSeverity
  message: string
}

export type ProviderFinanceUiStateKind = 'start' | 'incomplete' | 'ready' | 'shadow'

export type ProviderFinanceUiState = {
  kind: ProviderFinanceUiStateKind
  stripe: StripeConnectStatus
  pendingPayoutCents: number
  pendingPayoutCount: number
  timezone: string
}

/**
 * Pending-funds card content (HF19), resolved from the summary.
 *
 * - `connected`: payouts enabled + a real Stripe balance → show the live pending
 *   amount with a payout-schedule message (no misleading "N paiements en attente").
 * - `unavailable`: payouts enabled but Stripe was unreachable → degraded state,
 *   no fabricated amount.
 * - `shadow`: no Connect account yet → internal cumulative + "connect your bank"
 *   message (there it is true).
 */
export type PendingFundsCard
  = | { mode: 'connected', amountCents: number, message: string }
    | { mode: 'shadow', amountCents: number, count: number, message: string }
    | { mode: 'unavailable', message: string }

const PENDING_FUNDS_CONNECTED_MESSAGE
  = 'Virés automatiquement selon votre calendrier de virement Stripe.'
const PENDING_FUNDS_SHADOW_MESSAGE
  = 'Ces fonds seront virés dès que votre compte bancaire sera connecté.'
const PENDING_FUNDS_UNAVAILABLE_MESSAGE
  = 'Solde indisponible pour le moment — réessayez dans un instant.'

export function resolvePendingFundsCard(summary: ProviderFinanceSummary): PendingFundsCard {
  const { stripe, payouts, balance } = summary

  if (stripe.payoutsEnabled) {
    if (balance.source === 'stripe' && balance.pendingCents !== null) {
      return {
        mode: 'connected',
        amountCents: balance.pendingCents,
        message: PENDING_FUNDS_CONNECTED_MESSAGE
      }
    }
    return { mode: 'unavailable', message: PENDING_FUNDS_UNAVAILABLE_MESSAGE }
  }

  return {
    mode: 'shadow',
    amountCents: payouts.pendingPayoutCents,
    count: payouts.pendingPayoutCount,
    message: PENDING_FUNDS_SHADOW_MESSAGE
  }
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
 * Converts a single Stripe requirement key into a human-friendly French message.
 *
 * The backend intentionally stores raw Stripe keys; the UI MUST never expose them directly.
 */
export function mapRequirementKeyToMessage(key: string): string {
  const normalized = normalizeString(key)
  if (!normalized) return 'Finaliser la vérification de votre compte pour activer les virements.'

  switch (normalized) {
    case 'external_account':
      return 'Ajouter votre compte bancaire (IBAN) pour recevoir les virements.'
    case 'individual.verification.document':
    case 'company.verification.document':
      return 'Vérifier votre identité avec un document officiel.'
    case 'individual.verification.additional_document':
    case 'company.verification.additional_document':
      return 'Fournir un document complémentaire pour finaliser la vérification.'
    case 'individual.first_name':
    case 'individual.last_name':
    case 'individual.dob.day':
    case 'individual.dob.month':
    case 'individual.dob.year':
      return 'Compléter vos informations personnelles (identité).'
    case 'individual.address.line1':
    case 'individual.address.postal_code':
    case 'individual.address.city':
    case 'individual.address.country':
      return 'Renseigner votre adresse postale.'
    case 'business_profile.url':
      return 'Ajouter un lien public (site ou page) pour valider votre activité.'
    case 'business_profile.mcc':
    case 'business_profile.product_description':
      return 'Décrire votre activité pour valider votre dossier.'
    case 'company.tax_id':
    case 'company.vat_id':
      return 'Renseigner vos informations fiscales (si applicable).'
    default:
      if (normalized.startsWith('individual.')) {
        return 'Compléter vos informations personnelles pour finaliser la vérification.'
      }
      if (normalized.startsWith('company.')) {
        return 'Compléter les informations de votre structure pour finaliser la vérification.'
      }
      return 'Finaliser la vérification de votre compte pour activer les virements.'
  }
}

/**
 * Converts Stripe "requirements.currently_due" keys into human-friendly steps.
 *
 * @deprecated Use `mapAllStripeRequirements()` for new code. This function
 * is kept for backwards compatibility with existing UI components.
 */
export function mapStripeRequirementsToSteps(requirementsDue: string[]): string[] {
  const steps = new Set<string>()

  for (const key of requirementsDue) {
    steps.add(mapRequirementKeyToMessage(key))
  }

  return Array.from(steps)
}

/**
 * Maps a disabled_reason code to a human-friendly French message.
 */
function mapDisabledReasonToMessage(reason: string): string {
  const normalized = normalizeString(reason)
  if (!normalized) return 'Votre compte a été désactivé. Contactez le support pour plus d\'informations.'

  switch (normalized) {
    case 'requirements.past_due':
      return 'Des informations requises n\'ont pas été fournies à temps.'
    case 'requirements.pending_verification':
      return 'Vérification en cours par Stripe.'
    case 'listed':
      return 'Votre compte a été signalé. Contactez le support.'
    case 'platform_paused':
      return 'Les paiements sont temporairement suspendus par la plateforme.'
    case 'rejected.fraud':
      return 'Votre compte a été refusé pour suspicion de fraude.'
    case 'rejected.terms_of_service':
      return 'Votre compte a été refusé pour non-respect des conditions d\'utilisation.'
    case 'rejected.listed':
      return 'Votre compte a été refusé car il figure sur une liste de surveillance.'
    case 'rejected.other':
      return 'Votre compte a été refusé. Contactez le support pour plus d\'informations.'
    case 'under_review':
      return 'Votre compte est en cours d\'examen par Stripe.'
    case 'other':
    default:
      return 'Votre compte présente un problème. Contactez le support pour plus d\'informations.'
  }
}

/**
 * Maps all Stripe requirements (past_due, currently_due, eventually_due) and disabled_reason
 * into categorized alerts with severity levels.
 *
 * Severity levels:
 * - critical: past_due or disabled_reason (red)
 * - warning: currently_due (amber)
 * - info: eventually_due (neutral)
 *
 * The backend intentionally stores raw Stripe keys; the UI MUST never expose them directly.
 */
export function mapAllStripeRequirements(stripe: StripeConnectStatus): StripeRequirementAlert[] {
  const alerts: StripeRequirementAlert[] = []
  const seenMessages = new Set<string>()

  // Helper to add alert without duplicates
  const addAlert = (severity: RequirementSeverity, message: string) => {
    if (!seenMessages.has(message)) {
      seenMessages.add(message)
      alerts.push({ severity, message })
    }
  }

  // 1. Critical: disabled_reason (highest priority)
  if (stripe.disabledReason) {
    addAlert('critical', mapDisabledReasonToMessage(stripe.disabledReason))
  }

  // 2. Critical: past_due requirements
  for (const key of stripe.requirementsPastDue) {
    addAlert('critical', mapRequirementKeyToMessage(key))
  }

  // 3. Warning: currently_due requirements
  for (const key of stripe.requirementsDue) {
    addAlert('warning', mapRequirementKeyToMessage(key))
  }

  // 4. Info: eventually_due requirements
  for (const key of stripe.requirementsEventuallyDue) {
    addAlert('info', mapRequirementKeyToMessage(key))
  }

  return alerts
}
