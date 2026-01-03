import { ApiFetchError } from '../../../services/api/api-error'

export type ConsultationFieldErrors = Record<string, string>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function extractValidationFieldErrors(details: unknown): ConsultationFieldErrors {
  if (!isRecord(details)) return {}

  const rawArray = details.validationErrors
  if (Array.isArray(rawArray)) {
    const output: ConsultationFieldErrors = {}
    for (const item of rawArray) {
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

  const direct = details as Record<string, unknown>
  const output: ConsultationFieldErrors = {}
  for (const [key, value] of Object.entries(direct)) {
    if (typeof value !== 'string') continue
    if (key === 'validationErrors') continue
    output[key] = value
  }
  return output
}

export type ConsultationErrorCode
  = | 'SLOT_ALREADY_BOOKED'
    | 'PAYMENT_PENDING'
    | 'ONBOARDING_NOT_COMPLETED'
    | 'PRICE_PLAN_INACTIVE'
    | 'VALIDATION_ERROR'

export function mapConsultationErrorToMessage(err: unknown, fallback = 'Une erreur est survenue. Veuillez réessayer.'): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      if (err.apiError.code === 'ONBOARDING_NOT_COMPLETED') {
        return 'Votre appel découverte doit être terminé avant de réserver une consultation.'
      }
      return 'Accès refusé. Vous n’avez pas les droits nécessaires.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Ressource introuvable.'
    }

    switch (err.apiError.code as ConsultationErrorCode) {
      case 'SLOT_ALREADY_BOOKED':
        return 'Désolé, ce créneau vient de partir. Choisissez-en un autre.'
      case 'PAYMENT_PENDING':
        return 'Un paiement est déjà en cours. Reprenez-le ou attendez quelques minutes.'
      case 'PRICE_PLAN_INACTIVE':
        return 'Ce tarif n’est plus disponible. Choisissez-en un autre.'
      case 'VALIDATION_ERROR':
        return 'Certains champs sont invalides. Vérifiez votre saisie.'
      default:
        return fallback
    }
  }

  return fallback
}
