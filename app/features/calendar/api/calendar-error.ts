import { ApiFetchError } from '../../../services/api/api-error'

export type CalendarFieldErrors = Record<string, string>

export function mapCalendarErrorToMessage(err: unknown, fallback = 'Une erreur est survenue. Veuillez réessayer.'): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (err.apiError.statusCode === 403) {
      return 'Accès refusé. Vous n’avez pas les droits nécessaires.'
    }

    if (err.apiError.statusCode === 404) {
      return 'Ressource introuvable.'
    }

    if (err.apiError.code === 'APPOINTMENT_OVERLAP') {
      return 'Ce créneau est déjà occupé. Veuillez choisir une autre date.'
    }

    if (err.apiError.code === 'APPOINTMENT_PAID_LOCK') {
      return 'Ce rendez-vous est verrouillé car il est payé. Contactez un administrateur.'
    }

    if (err.apiError.code === 'IDEMPOTENCY_KEY_CONFLICT') {
      return 'Cette action a déjà été prise en compte. Rafraîchissez la page si besoin.'
    }

    if (err.apiError.code === 'VALIDATION_ERROR') {
      return 'Certains champs sont invalides. Vérifiez votre saisie.'
    }

    if (err.apiError.code === 'PRICE_PLAN_INACTIVE') {
      return 'Ce tarif n\'est plus disponible. Sélectionnez-en un autre.'
    }

    // US-4: Messages spécifiques pour les gates de création RDV
    if (err.apiError.code === 'CLIENT_NOT_CONVERTED') {
      return 'Ce client doit d\'abord être converti après son appel découverte.'
    }

    if (err.apiError.code === 'DISCOVERY_NOT_ALLOWED_FOR_STAGE') {
      return 'Ce client est déjà actif, vous pouvez créer une consultation.'
    }

    if (err.apiError.code === 'DISCOVERY_ALREADY_EXISTS') {
      // Extraire la date si disponible dans details
      const existingDate = err.apiError.details?.existingDiscoveryDate as string | undefined
      if (existingDate) {
        const formatted = new Date(existingDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long'
        })
        return `Ce client a déjà un appel découverte planifié le ${formatted}.`
      }
      return 'Ce client a déjà un appel découverte planifié.'
    }
  }

  return fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Extracts DTO validation errors from the standard ErrorResponse.details shape.
 *
 * Expected shape:
 * `{ validationErrors: [{ property: string, constraints: Record<string, string> }] }`
 */
export function extractValidationFieldErrors(details: unknown): CalendarFieldErrors {
  if (!isRecord(details)) return {}

  const raw = details.validationErrors
  if (!Array.isArray(raw)) return {}

  const output: CalendarFieldErrors = {}
  for (const item of raw) {
    if (!isRecord(item)) continue
    const property = item.property
    if (typeof property !== 'string') continue

    const constraints = item.constraints
    const message = isRecord(constraints)
      ? Object.values(constraints).filter((value): value is string => typeof value === 'string').join(' ')
      : ''

    if (message) output[property] = message
  }

  return output
}

/**
 * Fallback for non-class-validator shapes.
 *
 * Some endpoints return a simple `details: { fieldName: 'message' }` object
 * (ex: missing `Idempotency-Key` header). This maps string entries directly.
 */
export function extractFieldErrorsFromDetails(details: unknown): CalendarFieldErrors {
  const errors = extractValidationFieldErrors(details)
  if (Object.keys(errors).length > 0) return errors

  if (!isRecord(details)) return {}

  const output: CalendarFieldErrors = {}
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string' && value.trim()) output[key] = value
  }
  return output
}
