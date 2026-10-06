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
  lastName: string | null
  email: string
  specialty: WaitlistSpecialty
  activityStage: string | null
  mainBlocker: string | null
  discoverySource: string | null
  status: WaitlistStatus
  message: string | null
  createdAt: string
  contactedAt: string | null
  onboardedAt: string | null
  /**
   * ISO 8601 UTC — dernière intention de la personne (WA.2).
   *
   * Rafraîchie par la **réinscription** uniquement : le changement de statut
   * admin ne la touche plus (décision 3a), sinon le panneau admin afficherait
   * « Réinscrite le <date du clic admin> ». Sur la population antérieure à WA.2,
   * la migration `1791247800000-normalize-waitlist-updated-at` l'a ramenée à
   * `createdAt`, donc `updatedAt > createdAt` signifie bien « réinscrite ».
   *
   * Cas de base : une demande **jamais réinscrite** a `updatedAt === createdAt`
   * (les deux colonnes prennent le même `now()` à l'INSERT). C'est cette égalité
   * qui garantit qu'aucun indicateur ne s'affiche pour une demande neuve.
   */
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
