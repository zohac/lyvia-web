import type { ProviderClientStatus } from '../api/clients.contract'

/**
 * Minimal client identity for display functions.
 * Shared by ProviderClientListItem and ProviderClientDetailProfile.
 */
type ClientIdentity = {
  firstname: string
  lastname: string
}

const STATUS_LABELS: Record<ProviderClientStatus, { label: string, color: 'warning' | 'primary' | 'neutral' }> = {
  onboarding: { label: 'Onboarding', color: 'warning' },
  in_progress: { label: 'En cours', color: 'primary' },
  completed: { label: 'Terminé', color: 'neutral' }
}

export function formatClientName(client: ClientIdentity): string {
  return `${client.firstname} ${client.lastname}`.trim()
}

export function getClientInitials(client: ClientIdentity): string {
  const first = client.firstname.trim().charAt(0)
  const last = client.lastname.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || 'CL'
}

export function getClientStatusMeta(status: ProviderClientStatus): { label: string, color: 'warning' | 'primary' | 'neutral' } {
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

export function formatProgramMonth(currentProgramMonth: number | null, totalMonths = 6): string {
  if (!currentProgramMonth) return 'Terminé'
  return `M${currentProgramMonth}/${totalMonths}`
}

export function getClientStatusMicrocopy(status: ProviderClientStatus): string {
  if (status === 'onboarding') {
    return 'Onboarding en cours, la cliente n’a pas encore terminé son appel découverte.'
  }
  if (status === 'in_progress') {
    return 'Accompagnement actif, la cliente est dans son programme en cours.'
  }
  return 'Parcours terminé, la cliente a clôturé son accompagnement.'
}
