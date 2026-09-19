import { EMAIL_REGEX } from '../../utils/validation-regex'

export const WAITLIST_SPECIALTY_VALUES = [
  'naturopathie', 'sophrologie', 'coaching-bien-etre',
  'hypnose', 'yoga-meditation', 'nutrition', 'autre'
] as const

export type WaitlistSpecialty = typeof WAITLIST_SPECIALTY_VALUES[number]

export const WAITLIST_ACTIVITY_STAGE_VALUES = [
  'preparation-lancement', 'lancement-recent', 'structuration', 'bien-installee'
] as const

export type WaitlistActivityStage = typeof WAITLIST_ACTIVITY_STAGE_VALUES[number]

export const WAITLIST_MAIN_BLOCKER_VALUES = [
  'creer-site', 'organiser-reservations', 'gerer-paiements',
  'suivre-clients', 'trop-outils', 'partie-technique', 'autre'
] as const

export type WaitlistMainBlocker = typeof WAITLIST_MAIN_BLOCKER_VALUES[number]

export const WAITLIST_DISCOVERY_SOURCE_VALUES = [
  'recommandation', 'autre-praticienne', 'google', 'reseaux-sociaux', 'autre'
] as const

export type WaitlistDiscoverySource = typeof WAITLIST_DISCOVERY_SOURCE_VALUES[number]

export interface WaitlistFormData {
  firstName: string
  lastName: string
  email: string
  specialty: string | undefined
  activityStage: string | undefined
  mainBlocker: string | undefined
  discoverySource: string | undefined
  message: string
}

export interface WaitlistFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  specialty?: string
  activityStage?: string
  mainBlocker?: string
  discoverySource?: string
  message?: string
}

export function validateWaitlistForm(form: WaitlistFormData): WaitlistFormErrors {
  const errors: WaitlistFormErrors = {}
  const trimmedFirstName = form.firstName.trim()
  const trimmedLastName = form.lastName.trim()

  if (trimmedFirstName.length < 2 || trimmedFirstName.length > 50) {
    errors.firstName = 'Entre 2 et 50 caractères'
  }
  if (trimmedLastName.length > 0 && (trimmedLastName.length < 2 || trimmedLastName.length > 50)) {
    errors.lastName = 'Entre 2 et 50 caractères'
  }
  if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = 'Format invalide — ex\u00A0: marie@monactivite.fr'
  }
  if (!form.specialty) {
    errors.specialty = 'Indiquez votre domaine'
  }
  if (!form.activityStage) {
    errors.activityStage = 'Indiquez où vous en êtes'
  }
  if (!form.mainBlocker) {
    errors.mainBlocker = 'Indiquez votre principal frein'
  }
  if (form.message && form.message.length > 500) {
    errors.message = 'Maximum 500 caractères'
  }

  return errors
}

export function isWaitlistFormValid(form: WaitlistFormData): boolean {
  const trimmedFirstName = form.firstName.trim()
  const trimmedLastName = form.lastName.trim()

  return trimmedFirstName.length >= 2
    && trimmedFirstName.length <= 50
    && (trimmedLastName.length === 0
      || (trimmedLastName.length >= 2 && trimmedLastName.length <= 50))
    && EMAIL_REGEX.test(form.email.trim())
    && !!form.specialty
    && !!form.activityStage
    && !!form.mainBlocker
    && (!form.message || form.message.length <= 500)
}
