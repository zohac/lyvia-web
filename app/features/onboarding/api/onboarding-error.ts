export type OnboardingErrorCode
  = | 'LEGAL_CONSENT_REQUIRED'
    | 'EMAIL_ROLE_CONFLICT'
    | 'USER_INACTIVE'
    | 'DISCOVERY_ALREADY_EXISTS'
    | 'SLOT_ALREADY_BOOKED'
    | 'INVALID_PROVIDER'
    | 'IDEMPOTENCY_KEY_CONFLICT'
    | 'IDEMPOTENCY_IN_PROGRESS'
    | 'VALIDATION_ERROR'

export type OnboardingUserMessage = {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export function mapOnboardingErrorCodeToUserMessage(code: string): OnboardingUserMessage {
  switch (code as OnboardingErrorCode) {
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
