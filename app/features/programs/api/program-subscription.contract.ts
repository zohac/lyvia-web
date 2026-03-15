/**
 * Program subscription contracts (provider view of client subscriptions).
 *
 * Source of truth: PRD Feature X2 — FR-X2-13 + data model.
 * Endpoint: GET /provider/clients/:id/subscriptions
 */

// ============================================================================
// Subscription Status
// ============================================================================

export type ProgramSubscriptionStatus = 'active' | 'frozen' | 'completed' | 'cancelled' | 'expired'

// ============================================================================
// Subscription Response (Provider view)
// ============================================================================

/**
 * Program subscription item as returned by the provider endpoint.
 * Maps to the ProgramSubscription entity snapshot fields.
 */
export type ProgramSubscriptionItem = {
  id: string
  programId: string
  status: ProgramSubscriptionStatus
  snapshotName: string
  snapshotTotalSessions: number
  snapshotPriceCents: number
  snapshotValidityMonths: number
  snapshotSessionDurationMinutes: number
  sessionsUsed: number
  sessionsRemaining: number
  paymentMode: 'one_time' | 'installments'
  startedAt: string
  expiresAt: string
  graceExpiresAt: string
  cancelledAt: string | null
}

/**
 * Response for listing client subscriptions.
 */
export type ProgramSubscriptionListResponse = {
  subscriptions: ProgramSubscriptionItem[]
}
