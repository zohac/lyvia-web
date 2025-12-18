import type { ErrorResponse } from './contracts/error-response'

export type ApiError = {
  statusCode: number
  code: string
  message: string
  details?: Record<string, unknown>
}

export class ApiFetchError extends Error {
  readonly apiError: ApiError

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiFetchError'
    this.apiError = apiError
  }
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.code === 'string' && typeof v.message === 'string'
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_INACTIVE'
  | 'INVALID_REFRESH_TOKEN'
  | 'REFRESH_REUSED_OR_REVOKED'
  | 'PASSWORD_POLICY_FAILED'
  | 'INVALID_PASSWORD_RESET_TOKEN'
  | 'VALIDATION_ERROR'

export function mapAuthErrorCodeToUserMessage(code: string): string {
  switch (code as AuthErrorCode) {
    case 'INVALID_CREDENTIALS':
    case 'USER_INACTIVE':
      return 'Identifiants invalides. Vérifiez votre email et votre mot de passe.'
    case 'INVALID_REFRESH_TOKEN':
    case 'REFRESH_REUSED_OR_REVOKED':
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    case 'PASSWORD_POLICY_FAILED':
      return 'Le mot de passe ne respecte pas les exigences de sécurité.'
    case 'INVALID_PASSWORD_RESET_TOKEN':
      return 'Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.'
    case 'VALIDATION_ERROR':
      return 'Veuillez vérifier les champs du formulaire.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}
