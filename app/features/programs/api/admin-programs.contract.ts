/**
 * X4.3: Admin programs and subscriptions contracts.
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml
 * verified against OpenAPI spec
 */

import type { ProgramSubscriptionStatus } from './program-subscription.contract'
import type { ProgramStatus } from './programs.contract'

// ============================================================================
// Admin Program Item (per provider)
// ============================================================================

export type AdminProgramItem = {
  id: string
  name: string
  description: string
  totalSessions: number
  validityMonths: number
  priceCents: number
  allowInstallments: boolean
  installmentCount: number | null
  sessionDurationMinutes: number
  status: ProgramStatus
  activeSubscriptionsCount: number
  createdAt: string
}

export type AdminProviderProgramsResponse = {
  programs: AdminProgramItem[]
}

// ============================================================================
// Admin Subscription Item (per provider)
// ============================================================================

export type AdminSubscriptionItem = {
  id: string
  programId: string
  snapshotName: string
  clientFirstName: string
  clientLastName: string
  clientProfileId: string
  status: ProgramSubscriptionStatus
  sessionsUsed: number
  sessionsRemaining: number
  snapshotTotalSessions: number
  snapshotPriceCents: number
  paymentMode: 'one_time' | 'installments'
  startedAt: string
  expiresAt: string
  cancelledAt: string | null
}

export type AdminProviderSubscriptionsResponse = {
  subscriptions: AdminSubscriptionItem[]
}

// ============================================================================
// Admin Program Analytics (platform-wide KPIs)
// ============================================================================

export type ActiveProgramsByProviderItem = {
  providerId: string
  providerName: string
  activeProgramsCount: number
}

export type AdminProgramAnalytics = {
  activePrograms: number
  activeSubscriptions: number
  frozenSubscriptions: number
  completedSubscriptions: number
  cancelledSubscriptions: number
  expiredSubscriptions: number
  totalRevenueCents: number
  totalCommissionCents: number
  completionRate: number
  paymentFailureRate: number
  activeProgramsByProvider: ActiveProgramsByProviderItem[]
}
