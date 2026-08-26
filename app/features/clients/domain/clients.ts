import type {
  AppointmentDisplayItem,
  AppointmentPaymentStatus,
  AppointmentStatus,
  AppointmentType,
  CancellationReason,
  NotificationChannel,
  NotificationLogItem,
  PaymentStatus,
  ProviderClientDetailPayment,
  ProviderClientStage,
  ProviderClientStatus
} from '../api/clients.contract'

/**
 * Minimal client identity for display functions.
 * Shared by ProviderClientListItem and ProviderClientDetailProfile.
 */
type ClientIdentity = {
  firstname: string
  lastname: string
}

/**
 * Status metadata for display purposes.
 * Used by getClientStatusMeta for standard status display.
 */
type StatusMeta = {
  label: string
  shortLabel: string
  color: 'warning' | 'primary' | 'neutral' | 'success' | 'error'
  icon: string
  description: string
}

const STATUS_LABELS: Record<ProviderClientStatus, StatusMeta> = {
  // 4-stage model validated by PM (2026-01-21)
  discovery: {
    label: 'En découverte',
    shortLabel: 'Découverte',
    color: 'warning',
    icon: 'lucide:search',
    description: 'Appel découverte planifié'
  },
  lead: {
    label: 'À convertir',
    shortLabel: 'À convertir',
    color: 'success',
    icon: 'lucide:user-check',
    description: 'Discovery effectué, en attente de décision'
  },
  active: {
    label: 'Actives',
    shortLabel: 'Active',
    color: 'primary',
    icon: 'lucide:rocket',
    description: 'Accompagnement en cours'
  },
  paused: {
    label: 'Archivées',
    shortLabel: 'Archivée',
    color: 'neutral',
    icon: 'lucide:archive',
    description: 'Parcours clôturé ou en pause'
  }
}

export function formatClientName(client: ClientIdentity): string {
  return `${client.firstname} ${client.lastname}`.trim()
}

export function getClientInitials(client: ClientIdentity): string {
  const first = client.firstname.trim().charAt(0)
  const last = client.lastname.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || 'CL'
}

export function getClientStatusMeta(status: ProviderClientStatus): StatusMeta {
  return STATUS_LABELS[status]
}

export function formatNextAppointment(
  iso: string | null,
  timeZone = 'Europe/Paris'
): string | null {
  if (!iso) return null

  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return formatter.format(new Date(iso))
}

export function formatProgramMonth(currentProgramMonth: number | null): string | null {
  // Return null if no program month (don't display "Terminé" badge)
  if (!currentProgramMonth) return null
  // Simple counter without max (flexible program duration per PM decision)
  return `M${currentProgramMonth}`
}

export function getClientStatusMicrocopy(status: ProviderClientStatus): string {
  return STATUS_LABELS[status].description
}

// ============================================================================
// Discovery Cancelled Detection (US - distinguish cancelled discoveries)
// ============================================================================

/**
 * Metadata for cancelled discovery state.
 * Shows error color to draw attention to clients needing replanification.
 */
const DISCOVERY_CANCELLED_META: StatusMeta = {
  label: 'Discovery annulé',
  shortLabel: 'Annulé',
  color: 'error',
  icon: 'lucide:calendar-x',
  description: 'Appel découverte annulé — à replanifier'
}

/**
 * Checks if a client is in discovery stage with a cancelled discovery.
 * This indicates the discovery was cancelled and needs to be rescheduled.
 */
export function hasDiscoveryCancelled(client: {
  computedStatus: ProviderClientStatus
  hasScheduledDiscovery: boolean
}): boolean {
  return client.computedStatus === 'discovery' && !client.hasScheduledDiscovery
}

/**
 * Returns display metadata for a client, considering cancelled discovery state.
 * Use this instead of getClientStatusMeta when you need to distinguish cancelled discoveries.
 */
export function getClientDisplayMeta(client: {
  computedStatus: ProviderClientStatus
  hasScheduledDiscovery: boolean
}): StatusMeta {
  if (hasDiscoveryCancelled(client)) {
    return DISCOVERY_CANCELLED_META
  }
  return STATUS_LABELS[client.computedStatus]
}

/**
 * Valid stages for 4-stage model.
 */
const VALID_STAGES: ProviderClientStage[] = ['discovery', 'lead', 'active', 'paused']

/**
 * Derives client stage from computedStatus.
 * With 4-stage model, computedStatus === stage.
 * Logs warning and defaults to 'discovery' for unknown values.
 */
export function deriveStageFromStatus(computedStatus: ProviderClientStatus): ProviderClientStage {
  if (!VALID_STAGES.includes(computedStatus as ProviderClientStage)) {
    console.warn(`[deriveStageFromStatus] Unknown status: ${computedStatus}, defaulting to 'discovery'`)
    return 'discovery'
  }
  return computedStatus
}

/**
 * Returns Tailwind classes for client avatar based on status.
 * Uses crepuscule (primary) for active clients to match design system.
 */
export function getClientAvatarClass(status: ProviderClientStatus): string {
  switch (status) {
    case 'discovery':
      return 'bg-amber-100 text-amber-700'
    case 'lead':
      return 'bg-emerald-100 text-emerald-700'
    case 'active':
      return 'bg-crepuscule-100 text-crepuscule-700'
    case 'paused':
      return 'bg-stone-100 text-stone-700'
    default:
      return 'bg-stone-100 text-stone-700'
  }
}

/**
 * Returns Tailwind classes for client avatar, considering cancelled discovery state.
 * Use this instead of getClientAvatarClass when you need to distinguish cancelled discoveries.
 */
export function getClientDisplayAvatarClass(client: {
  computedStatus: ProviderClientStatus
  hasScheduledDiscovery: boolean
}): string {
  if (hasDiscoveryCancelled(client)) {
    return 'bg-red-100 text-red-700'
  }
  return getClientAvatarClass(client.computedStatus)
}

// ============================================================================
// Appointment Formatting
// ============================================================================

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  discovery: 'Appel découverte',
  consultation: 'Consultation',
  free_followup: 'Suivi gratuit'
}

const APPOINTMENT_STATUS_META: Record<AppointmentStatus, { label: string, color: 'warning' | 'primary' | 'neutral' | 'success' | 'error' }> = {
  scheduled: { label: 'À venir', color: 'primary' },
  completed: { label: 'Terminé', color: 'success' },
  cancelled: { label: 'Annulé', color: 'error' }
}

const APPOINTMENT_PAYMENT_STATUS_LABELS: Record<AppointmentPaymentStatus, string> = {
  not_required: 'Non requis',
  unpaid: 'Non payé',
  paid: 'Payé',
  covered_by_program: 'Couvert par programme'
}

const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  client_request: 'Demande cliente',
  provider_unavailable: 'Indisponibilité coach',
  client_no_show: 'Absence cliente',
  emergency: 'Urgence',
  other: 'Autre'
}

/**
 * Returns the human-readable label for an appointment type.
 */
export function getAppointmentTypeLabel(type: AppointmentType): string {
  return APPOINTMENT_TYPE_LABELS[type]
}

/**
 * Returns display metadata for an appointment status (label + color).
 */
export function getAppointmentStatusMeta(status: AppointmentStatus): { label: string, color: 'warning' | 'primary' | 'neutral' | 'success' | 'error' } {
  return APPOINTMENT_STATUS_META[status]
}

/**
 * Returns the human-readable label for an appointment payment status.
 */
export function getAppointmentPaymentStatusLabel(status: AppointmentPaymentStatus): string {
  return APPOINTMENT_PAYMENT_STATUS_LABELS[status]
}

/**
 * Returns the human-readable label for a cancellation reason.
 */
export function getCancellationReasonLabel(reason: CancellationReason): string {
  return CANCELLATION_REASON_LABELS[reason]
}

/**
 * Formats an appointment's scheduled date/time for display.
 * Returns date and time parts separately for flexible display.
 */
export function formatAppointmentDateTime(
  iso: string,
  timeZone = 'Europe/Paris'
): { date: string, time: string, full: string } {
  const d = new Date(iso)

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit'
  })

  const fullFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    dateStyle: 'long',
    timeStyle: 'short'
  })

  return {
    date: dateFormatter.format(d),
    time: timeFormatter.format(d),
    full: fullFormatter.format(d)
  }
}

/**
 * Determines if an appointment is in the past based on scheduledAt.
 */
export function isAppointmentInPast(scheduledAt: string): boolean {
  return new Date(scheduledAt) < new Date()
}

/**
 * Hotfix-20: the "Renvoyer le lien de paiement" button is only shown for an
 * unpaid scheduled consultation. Hidden for paid, cancelled, completed
 * appointments and for discovery calls (free, no payment link).
 */
export function canResendPaymentLink(
  appointment: Pick<AppointmentDisplayItem, 'type' | 'status' | 'paymentStatus'>
): boolean {
  return appointment.type === 'consultation'
    && appointment.status === 'scheduled'
    && appointment.paymentStatus === 'unpaid'
}

/**
 * Partitions appointments into past and upcoming.
 * Past appointments are sorted by scheduledAt DESC (most recent first).
 * Upcoming appointments are sorted by scheduledAt ASC (next one first).
 */
export function partitionAppointmentsByTime<T extends AppointmentDisplayItem>(
  appointments: T[]
): { past: T[], upcoming: T[] } {
  const now = new Date()
  const past: T[] = []
  const upcoming: T[] = []

  for (const apt of appointments) {
    if (new Date(apt.scheduledAt) < now) {
      past.push(apt)
    } else {
      upcoming.push(apt)
    }
  }

  // Sort past DESC (most recent first)
  past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  // Sort upcoming ASC (next one first)
  upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  return { past, upcoming }
}

// ============================================================================
// Payment Formatting
// ============================================================================

const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string, color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'En attente', color: 'warning' },
  succeeded: { label: 'Payé', color: 'success' },
  failed: { label: 'Échoué', color: 'error' }
}

/**
 * Returns display metadata for a payment status (label + color).
 */
export function getPaymentStatusMeta(status: PaymentStatus): { label: string, color: 'warning' | 'success' | 'error' } {
  return PAYMENT_STATUS_META[status]
}

/**
 * Formats an amount in cents to a human-readable currency string.
 * Example: 8000 → "80,00 €"
 */
export function formatAmountCents(amountCents: number, currency = 'EUR'): string {
  const amount = amountCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Formats the provider's net payout ("Vous recevez") for display (HF18).
 *
 * Returns the placeholder "—" while the actual Stripe fee is unknown
 * (`netAmountCents === null`): never present an exact net computed with a 0 fee.
 */
export function formatNetAmountCents(
  netAmountCents: number | null | undefined,
  currency = 'EUR'
): string {
  if (netAmountCents === null || netAmountCents === undefined) return '—'
  return formatAmountCents(netAmountCents, currency)
}

/**
 * Formats a payment date for display.
 */
export function formatPaymentDate(iso: string, timeZone = 'Europe/Paris'): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return formatter.format(new Date(iso))
}

/**
 * Sorts payments by createdAt DESC (most recent first).
 */
export function sortPaymentsByDate(
  payments: ProviderClientDetailPayment[]
): ProviderClientDetailPayment[] {
  return [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// ============================================================================
// Notification Status Helpers (H4)
// ============================================================================

const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  discovery_confirmation: 'Confirmation envoyée',
  discovery_reminder_j1: 'Rappel J-1 envoyé',
  consultation_confirmation: 'Confirmation envoyée',
  consultation_reminder_j1: 'Rappel J-1 envoyé',
  consultation_reminder_h2: 'Rappel H-2 envoyé',
  consultation_payment_resend: 'Lien de paiement renvoyé'
}

/**
 * Returns the human-readable label for a notification channel.
 */
export function getNotificationChannelLabel(channel: NotificationChannel): string {
  return NOTIFICATION_CHANNEL_LABELS[channel] || channel
}

/**
 * Derives notification summary for an appointment.
 * Returns what has been sent and what is expected.
 */
export function getAppointmentNotificationSummary(
  appointment: { type: AppointmentType, status: 'scheduled' | 'cancelled' | 'completed', notifications?: NotificationLogItem[] }
): { confirmationSent: boolean, remindersSent: string[], allExpectedSent: boolean } {
  const notifications = appointment.notifications ?? []
  const sentChannels = new Set(notifications.filter(n => n.status === 'sent').map(n => n.channel))

  const isDiscovery = appointment.type === 'discovery'
  const confirmationChannel = isDiscovery ? 'discovery_confirmation' : 'consultation_confirmation'
  const confirmationSent = sentChannels.has(confirmationChannel)

  const remindersSent: string[] = []
  if (isDiscovery) {
    if (sentChannels.has('discovery_reminder_j1')) remindersSent.push('J-1')
  } else {
    if (sentChannels.has('consultation_reminder_j1')) remindersSent.push('J-1')
    if (sentChannels.has('consultation_reminder_h2')) remindersSent.push('H-2')
  }

  // For scheduled appointments, check if all expected notifications have been sent
  // Confirmation is always expected. Reminders are only expected for completed/past appointments.
  let allExpectedSent = confirmationSent
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    // If appointment is done, all reminders should have been sent (unless cancelled early)
    if (isDiscovery) {
      allExpectedSent = confirmationSent && sentChannels.has('discovery_reminder_j1')
    } else {
      allExpectedSent = confirmationSent
        && sentChannels.has('consultation_reminder_j1')
        && sentChannels.has('consultation_reminder_h2')
    }
  }

  return { confirmationSent, remindersSent, allExpectedSent }
}
