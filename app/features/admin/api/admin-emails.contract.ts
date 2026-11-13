// verified against OpenAPI spec

export type EmailCatalogueEntry = {
  kind: string
  label: string
  category: string
  trigger: string
  channel: string | null
  channels: readonly string[]
  traceability: 'tracked' | 'untracked'
}

export type AdminEmailActivitySend = {
  id: string
  status: string
  channel: string
  createdAt: string
  providerMessageId: string | null
  /** `true` quand la passerelle a simulé l'envoi (mode `console`). */
  simulated: boolean
}

export type AdminEmailActivityFailure = {
  id: string
  createdAt: string
  errorMessage: string | null
}

export type AdminEmailActivityItem = {
  kind: string
  lastSend: AdminEmailActivitySend | null
  lastFailure: AdminEmailActivityFailure | null
}

export type AdminEmailsActivity = {
  provider: 'brevo' | 'mailtrap' | 'console'
  simulated: boolean
  items: AdminEmailActivityItem[]
}

export type SendAdminTestEmailResult = {
  kind: string
  channel: string
  status: 'sent' | 'failed'
  providerMessageId: string | null
  simulated: boolean
  notificationLogId: string
}

export type SendAdminTestEmailInput = {
  kind: string
  toEmail: string
}
