import type { ProgramStatus } from '../api/programs.contract'
import type { ProgramSubscriptionStatus } from '../api/program-subscription.contract'
import { formatCurrency } from '../../analytics/helpers/format-kpi'

export const PROGRAM_STATUS_META: Record<ProgramStatus, { label: string, color: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Brouillon', color: 'warning' },
  active: { label: 'Actif', color: 'success' },
  inactive: { label: 'Inactif', color: 'neutral' }
}

export const SUBSCRIPTION_STATUS_META: Record<ProgramSubscriptionStatus, { label: string, color: 'success' | 'warning' | 'neutral' | 'error' }> = {
  active: { label: 'Active', color: 'success' },
  frozen: { label: 'Gelée', color: 'warning' },
  completed: { label: 'Terminée', color: 'neutral' },
  cancelled: { label: 'Annulée', color: 'error' },
  expired: { label: 'Expirée', color: 'neutral' }
}

export function formatProgramInstallments(program: {
  allowInstallments: boolean
  installmentCount: number | null
  monthlyPriceCents: number | null
}): string | null {
  if (!program.allowInstallments || !program.installmentCount || !program.monthlyPriceCents) return null
  return `${formatCurrency(program.monthlyPriceCents)}/mois × ${program.installmentCount} mensualités`
}

export function formatSessionsProgress(used: number, total: number): string {
  return `${used}/${total} séances utilisées`
}

export function computeSessionsPercent(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(Math.round((used / total) * 100), 100)
}
