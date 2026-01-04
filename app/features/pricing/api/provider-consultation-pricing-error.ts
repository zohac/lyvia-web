import { ApiFetchError } from '../../../services/api/api-error'

export type ProviderConsultationPricingFieldErrors = Record<string, string>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function extractProviderConsultationPricingFieldErrors(details: unknown): ProviderConsultationPricingFieldErrors {
  if (!isRecord(details)) return {}

  const rawArray = details.validationErrors
  if (Array.isArray(rawArray)) {
    const output: ProviderConsultationPricingFieldErrors = {}
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
  const output: ProviderConsultationPricingFieldErrors = {}
  for (const [key, value] of Object.entries(direct)) {
    if (typeof value !== 'string') continue
    if (key === 'validationErrors') continue
    output[key] = value
  }
  return output
}

export function mapProviderConsultationPricingErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger vos tarifs de consultation.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) return 'Votre session a expiré. Veuillez vous reconnecter.'
    if (err.apiError.statusCode === 403) return 'Accès refusé.'
    if (err.apiError.statusCode === 404) return 'Tarif introuvable.'
    if (err.apiError.statusCode === 422) {
      if (err.apiError.code === 'PRICE_PLAN_IMMUTABLE') {
        return 'Pour changer le prix ou la durée, créez un nouveau tarif puis désactivez l’ancien.'
      }
      return 'Certains champs sont invalides. Vérifiez votre saisie.'
    }
    return fallback
  }
  return fallback
}
