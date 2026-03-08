export type ClientStage = 'discovery' | 'lead' | 'active' | 'paused'

export const STAGE_LABELS: Record<ClientStage, string> = {
  discovery: 'En découverte',
  lead: 'À convertir',
  active: 'Actif',
  paused: 'Archivé'
}

export const STAGE_VARIANT: Record<ClientStage, 'neutral' | 'warning' | 'success' | 'error'> = {
  discovery: 'neutral',
  lead: 'warning',
  active: 'success',
  paused: 'error'
}
