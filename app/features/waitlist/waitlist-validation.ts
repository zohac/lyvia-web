import { EMAIL_REGEX } from '../../utils/validation-regex'

export const WAITLIST_SPECIALTY_VALUES = [
  'naturopathie', 'sophrologie', 'coaching-bien-etre',
  'hypnose', 'yoga-meditation', 'nutrition', 'autre'
] as const

export type WaitlistSpecialty = typeof WAITLIST_SPECIALTY_VALUES[number]

export interface WaitlistFormData {
  firstName: string
  lastName: string
  email: string
  specialty: string | undefined
  message: string
  legalConsent: boolean
}

export interface WaitlistFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  specialty?: string
  message?: string
  legalConsent?: string
}

export function validateWaitlistForm(form: WaitlistFormData): WaitlistFormErrors {
  const errors: WaitlistFormErrors = {}
  const trimmedFirstName = form.firstName.trim()
  const trimmedLastName = form.lastName.trim()

  if (trimmedFirstName.length < 2 || trimmedFirstName.length > 50) {
    errors.firstName = 'Entre 2 et 50 caractères'
  }
  if (trimmedLastName.length < 2 || trimmedLastName.length > 50) {
    errors.lastName = 'Entre 2 et 50 caractères'
  }
  if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = 'Format invalide — ex\u00A0: marie@monactivite.fr'
  }
  if (!form.specialty) {
    errors.specialty = 'Indiquez votre domaine'
  }
  if (form.message && form.message.length > 500) {
    errors.message = 'Maximum 500 caractères'
  }
  if (!form.legalConsent) {
    errors.legalConsent = 'Le consentement est obligatoire'
  }

  return errors
}

export function isWaitlistFormValid(form: WaitlistFormData): boolean {
  const trimmedFirstName = form.firstName.trim()
  const trimmedLastName = form.lastName.trim()

  return trimmedFirstName.length >= 2
    && trimmedFirstName.length <= 50
    && trimmedLastName.length >= 2
    && trimmedLastName.length <= 50
    && EMAIL_REGEX.test(form.email.trim())
    && !!form.specialty
    && (!form.message || form.message.length <= 500)
    && form.legalConsent
}
