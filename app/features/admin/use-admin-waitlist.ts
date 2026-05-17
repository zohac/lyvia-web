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

export const WAITLIST_SPECIALTY_LABELS: Record<string, string> = {
  'naturopathie': 'Naturopathie',
  'sophrologie': 'Sophrologie',
  'coaching-bien-etre': 'Coaching bien-être',
  'hypnose': 'Hypnose',
  'yoga-meditation': 'Yoga & méditation',
  'nutrition': 'Nutrition',
  'autre': 'Autre'
}

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  pending: 'En attente',
  contacted: 'Contacté',
  onboarded: 'Onboardé',
  declined: 'Décliné'
}
