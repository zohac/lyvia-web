import {
  createAdminWaitlistStore,
  type AdminWaitlistService,
  type AdminWaitlistStore
} from './admin-waitlist-store'
import type { WaitlistStatus } from './api/admin-waitlist.contract'
import {
  listAdminWaitlist,
  updateAdminWaitlistStatus
} from './services/admin-waitlist.service'
import { SPECIALTY_LABELS } from '~/features/waitlist/waitlist-labels'

export interface UseAdminWaitlistOptions {
  service?: AdminWaitlistService
  debounceMs?: number
}

export function useAdminWaitlist(options: UseAdminWaitlistOptions = {}): AdminWaitlistStore {
  const service: AdminWaitlistService = options.service ?? {
    list: listAdminWaitlist,
    updateStatus: updateAdminWaitlistStatus
  }
  return createAdminWaitlistStore({ service, debounceMs: options.debounceMs })
}

/**
 * Source unique des libellés de domaine, partagée avec le formulaire public.
 * Ré-exporté ici pour ne pas casser les consommateurs admin existants.
 */
export const WAITLIST_SPECIALTY_LABELS: Record<string, string> = SPECIALTY_LABELS

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  pending: 'En attente',
  contacted: 'Contacté',
  onboarded: 'Onboardé',
  declined: 'Décliné'
}
