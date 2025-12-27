export type AppointmentErrorCode
  = | 'APPOINTMENT_NOT_FOUND'
    | 'APPOINTMENT_FORBIDDEN'
    | 'INVALID_STATUS_TRANSITION'
    | 'CANCELLED_BY_ROLE_REQUIRED'
    | 'APPOINTMENT_NOT_DISCOVERY'
    | 'DISCOVERY_NOT_COMPLETED'
    | 'VALIDATION_ERROR'

export function mapAppointmentErrorCodeToUserMessage(code: string): string {
  switch (code as AppointmentErrorCode) {
    case 'APPOINTMENT_NOT_FOUND':
      return 'Cet appel est introuvable. Il a peut-être été supprimé.'
    case 'APPOINTMENT_FORBIDDEN':
      return 'Action non autorisée.'
    case 'INVALID_STATUS_TRANSITION':
      return 'Cet appel n’est plus modifiable.'
    case 'CANCELLED_BY_ROLE_REQUIRED':
    case 'VALIDATION_ERROR':
      return 'Veuillez vérifier votre demande et réessayer.'
    case 'APPOINTMENT_NOT_DISCOVERY':
      return 'Cet appel ne peut pas être converti.'
    case 'DISCOVERY_NOT_COMPLETED':
      return 'Cet appel doit être marqué “terminé” avant conversion.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}
