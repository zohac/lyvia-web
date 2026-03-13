import type { ProgramStatus } from '../api/programs.contract'
import { formatCurrency } from '../../analytics/helpers/format-kpi'

export const PROGRAM_STATUS_META: Record<ProgramStatus, { label: string, color: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Brouillon', color: 'warning' },
  active: { label: 'Actif', color: 'success' },
  inactive: { label: 'Inactif', color: 'neutral' }
}

export function formatProgramInstallments(program: {
  allowInstallments: boolean
  installmentCount: number | null
  monthlyPriceCents: number | null
}): string | null {
  if (!program.allowInstallments || !program.installmentCount || !program.monthlyPriceCents) return null
  return `${formatCurrency(program.monthlyPriceCents)}/mois × ${program.installmentCount} mensualités`
}
