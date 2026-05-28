// verified against OpenAPI spec
import {
  WAITLIST_SPECIALTY_VALUES,
  type WaitlistSpecialty
} from '~/features/waitlist/waitlist-validation'

export const WAITLIST_STATUS_VALUES = [
  'pending',
  'contacted',
  'onboarded',
  'declined'
] as const

export type WaitlistStatus = typeof WAITLIST_STATUS_VALUES[number]

export { WAITLIST_SPECIALTY_VALUES, type WaitlistSpecialty }

export interface AdminWaitlistLead {
  id: string
  firstName: string
  lastName: string
  email: string
  specialty: WaitlistSpecialty
  status: WaitlistStatus
  message: string | null
  createdAt: string
  contactedAt: string | null
  onboardedAt: string | null
  /** ISO 8601 UTC — bumped on every PATCH transition (Codex F2). */
  updatedAt: string
}

export interface AdminWaitlistPage {
  limit: number
  nextCursor: string | null
}

export interface ListAdminWaitlistResponse {
  items: AdminWaitlistLead[]
  page: AdminWaitlistPage
}

export interface AdminWaitlistFilters {
  status?: WaitlistStatus
  specialty?: WaitlistSpecialty
  search?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  cursor?: string
}
