import type { ReminderBatch, ReminderStatus } from './api/admin-reminders.contract'

const JOB_LABELS: Record<string, string> = {
  discovery_j1: 'Appel découverte · J−1',
  consultation_j1: 'Consultation · J−1',
  consultation_h2: 'Consultation · H−2',
  free_followup_j1: 'Suivi offert · J−1',
  free_followup_h2: 'Suivi offert · H−2',
  program_session_j1: 'Séance de programme · J−1',
  program_session_h2: 'Séance de programme · H−2',
  activation: 'Activation du compte · J+1'
}

const STATUS_LABELS: Record<ReminderStatus, string> = {
  running: 'Démarrée, fin non confirmée',
  completed: 'Terminée',
  failed: 'Échec',
  skipped_disabled: 'Désactivée',
  skipped_running: 'Déjà en cours'
}

export function reminderJobLabel(key: string): string {
  return JOB_LABELS[key] ?? key
}

export function reminderStatusLabel(status: ReminderStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function reminderBatchSummary(batch: ReminderBatch): { error: boolean, message: string } {
  if (batch.runs.some(run => !run.countsComplete)) {
    return { error: true, message: 'Le bilan est incomplet. Des emails ont pu être envoyés avant l’interruption ; consultez les logs de notifications avant de relancer.' }
  }
  const sent = batch.runs.reduce((sum, run) => sum + run.sent, 0)
  const failed = batch.runs.reduce((sum, run) => sum + run.failed, 0)
  const busy = batch.runs.filter(run => run.status === 'skipped_running').length
  const error = batch.hasFailures || failed > 0 || batch.runs.some(run => run.status === 'failed')
  if (error) return { error, message: `${sent} email(s) envoyé(s). Des erreurs sont survenues ; consultez le suivi et les notifications ci-dessous.` }
  if (batch.runs.every(run => run.status === 'skipped_disabled')) {
    return { error: false, message: 'Aucun traitement lancé : les rappels sont désactivés.' }
  }
  return { error: false, message: `${sent} email(s) envoyé(s).${busy ? ` ${busy} traitement(s) déjà en cours ; actualisez pour consulter leur résultat.` : ' Le traitement est terminé.'}` }
}
