export type OnboardingErrorCode
  = | 'TENANT_NOT_FOUND'
    | 'SLUG_REQUIRED'
    | 'LEGAL_CONSENT_REQUIRED'
    | 'EMAIL_ROLE_CONFLICT'
    | 'USER_INACTIVE'
    | 'DISCOVERY_ALREADY_EXISTS'
    | 'SLOT_ALREADY_BOOKED'
    | 'SLOT_NOT_AVAILABLE'
    | 'INVALID_PROVIDER'
    | 'IDEMPOTENCY_KEY_CONFLICT'
    | 'IDEMPOTENCY_IN_PROGRESS'
    | 'VALIDATION_ERROR'

const SLOT_UNAVAILABLE_ERROR_CODES: ReadonlySet<OnboardingErrorCode> = new Set([
  'SLOT_ALREADY_BOOKED',
  'SLOT_NOT_AVAILABLE'
])

export function isSlotUnavailableErrorCode(code: string): boolean {
  return SLOT_UNAVAILABLE_ERROR_CODES.has(code as OnboardingErrorCode)
}

export type OnboardingErrorRecoveryAction = {
  targetStep: 1 | 2 | null
  reloadAvailability: boolean
  clearSelectedSlot: boolean
  applyBackendValidationErrors: boolean
  preserveUserMessage: boolean
}

export function resolveOnboardingErrorRecovery(code: string): OnboardingErrorRecoveryAction {
  if (code === 'VALIDATION_ERROR') {
    return {
      targetStep: 2,
      reloadAvailability: false,
      clearSelectedSlot: false,
      applyBackendValidationErrors: true,
      preserveUserMessage: true
    }
  }

  if (isSlotUnavailableErrorCode(code)) {
    return {
      targetStep: 1,
      reloadAvailability: true,
      clearSelectedSlot: true,
      applyBackendValidationErrors: false,
      preserveUserMessage: true
    }
  }

  return {
    targetStep: null,
    reloadAvailability: false,
    clearSelectedSlot: false,
    applyBackendValidationErrors: false,
    preserveUserMessage: true
  }
}

export type OnboardingUserMessage = {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export function mapOnboardingErrorCodeToUserMessage(code: string): OnboardingUserMessage {
  switch (code as OnboardingErrorCode) {
    case 'TENANT_NOT_FOUND':
      return {
        title: 'Coach introuvable',
        description: 'Impossible de trouver ce coach. Vérifiez le lien ou réessayez plus tard.'
      }
    case 'SLUG_REQUIRED':
      return {
        title: 'Lien invalide',
        description: 'Ce lien nécessite un identifiant coach. Retournez à la page du coach et réessayez.'
      }
    case 'LEGAL_CONSENT_REQUIRED':
      return {
        title: 'Consentement requis',
        description: 'Veuillez accepter les conditions générales et la politique de confidentialité pour continuer.'
      }
    case 'EMAIL_ROLE_CONFLICT':
      return {
        title: 'Email non éligible',
        description:
          'Cette adresse e-mail est déjà associée à un compte interne. Utilisez une autre adresse ou contactez l’assistance.'
      }
    case 'USER_INACTIVE':
      return {
        title: 'Compte inactif',
        description: 'Ce compte est inactif. Contactez l’assistance pour réactiver votre accès.'
      }
    case 'DISCOVERY_ALREADY_EXISTS':
      return {
        title: 'Appel déjà programmé',
        description: 'Vous avez déjà un appel découverte planifié. Consultez vos emails pour retrouver la confirmation.'
      }
    case 'SLOT_ALREADY_BOOKED':
      return {
        title: 'Créneau indisponible',
        description: 'Oups, ce créneau vient d’être réservé. Veuillez en choisir un autre.'
      }
    case 'SLOT_NOT_AVAILABLE':
      return {
        title: 'Créneau indisponible',
        description: 'Ce créneau n’est plus disponible. Veuillez en choisir un autre dans la liste.'
      }
    case 'INVALID_PROVIDER':
      return {
        title: 'Indisponible',
        description: 'Impossible de charger les disponibilités pour le moment. Veuillez réessayer.'
      }
    case 'IDEMPOTENCY_KEY_CONFLICT':
      return {
        title: 'Demande déjà envoyée',
        description: 'Votre demande est déjà en cours de traitement. Veuillez patienter quelques secondes.'
      }
    case 'IDEMPOTENCY_IN_PROGRESS':
      return {
        title: 'Traitement en cours',
        description: 'Votre réservation est en cours. Ne rafraîchissez pas la page, nous finalisons la confirmation.'
      }
    case 'VALIDATION_ERROR':
      return {
        title: 'Vérifiez vos informations',
        description: 'Certains champs semblent incorrects. Merci de vérifier le formulaire.'
      }
    default:
      return {
        title: 'Une erreur est survenue',
        description: 'Veuillez réessayer dans quelques instants.'
      }
  }
}
