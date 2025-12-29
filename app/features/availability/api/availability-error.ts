import { ApiFetchError } from '../../../services/api/api-error'

export type AvailabilityFieldErrors = Record<string, string>

export function mapAvailabilityErrorToMessage(err: unknown): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.code === 'RULE_OVERLAP') {
      return 'Cette règle chevauche une règle existante pour ce jour. Ajustez l’horaire ou la durée.'
    }
    if (err.apiError.code === 'VALIDATION_ERROR') {
      return 'Certains champs sont invalides. Vérifiez votre saisie.'
    }
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
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
export function extractValidationFieldErrors(details: unknown): AvailabilityFieldErrors {
  if (!isRecord(details)) return {}

  const raw = details.validationErrors
  if (!Array.isArray(raw)) return {}

  const output: AvailabilityFieldErrors = {}
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
