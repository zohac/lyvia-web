// verified against OpenAPI spec
export interface AdminNotificationLogListItem {
  id: string
  type: string
  channel: string
  status: string
  recipient: string
  appointmentId: string | null
  createdAt: string
}

export interface AdminNotificationLogDetail {
  id: string
  type: string
  channel: string
  status: string
  recipient: string
  payloadPreview: string | null
  errorMessage: string | null
  providerMessageId: string | null
  attemptCount: number
  appointmentId: string | null
  /**
   * `null` depuis WA.4 : une notification d'administration (waitlist) n'a pas de
   * client. Le back-office rend alors `—` au lieu d'une valeur vide.
   */
  clientId: string | null
  createdAt: string
}
