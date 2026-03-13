/**
 * Programs contracts (Provider program management + public display).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml
 * verified against OpenAPI spec
 */

// ============================================================================
// Program Status
// ============================================================================

export type ProgramStatus = 'draft' | 'active' | 'inactive'

// ============================================================================
// Provider Program Types
// ============================================================================

/**
 * Full program response (provider CRUD + detail).
 * Maps to ProgramResponseDto in OpenAPI.
 */
export type ProgramResponse = {
  id: string
  providerId: string
  name: string
  description: string
  totalSessions: number
  validityMonths: number
  gracePeriodDays: number
  priceCents: number
  allowInstallments: boolean
  installmentCount: number | null
  discoveryGate: boolean
  sessionDurationMinutes: number
  sortOrder: number
  status: ProgramStatus
  stripeProductId: string | null
  stripePriceId: string | null
  monthlyPriceCents: number | null
  createdAt: string
}

/**
 * Request body for creating a program.
 * Maps to CreateProgramDto in OpenAPI.
 */
export type CreateProgramRequest = {
  name: string
  description: string
  totalSessions: number
  validityMonths: number
  gracePeriodDays?: number
  priceCents: number
  allowInstallments?: boolean
  installmentCount?: number
  discoveryGate?: boolean
  sessionDurationMinutes: number
  sortOrder?: number
}

/**
 * Response for listing provider programs.
 * Maps to ProgramListResponseDto in OpenAPI.
 */
export type ProgramListResponse = {
  programs: ProgramResponse[]
}

// ============================================================================
// Public Program Types (for landing page — X2.2 dependency)
// ============================================================================

/**
 * Public program item for landing page display.
 * Subset of ProgramResponse with only public-safe fields.
 * Will be served by GET /public/programs (X2.2).
 */
export type PublicProgramListItem = {
  id: string
  name: string
  description: string
  totalSessions: number
  validityMonths: number
  priceCents: number
  allowInstallments: boolean
  installmentCount: number | null
  monthlyPriceCents: number | null
  discoveryGate: boolean
  sessionDurationMinutes: number
}
