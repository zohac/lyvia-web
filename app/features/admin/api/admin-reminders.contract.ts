export type ReminderStatus = 'running' | 'completed' | 'failed' | 'skipped_disabled' | 'skipped_running'

export type ReminderRun = {
  countsComplete: boolean
  id: string | null
  jobKey: string
  source: 'scheduler' | 'admin' | 'cli'
  status: ReminderStatus
  startedAt: string
  finishedAt: string | null
  scanned: number
  sent: number
  failed: number
  skipped: number
  errorCode: string | null
}

export type ReminderOverview = {
  unfinishedRuns: ReminderRun[]
  enabled: boolean
  schedulerEnabled: boolean
  mailProvider: 'brevo' | 'mailtrap' | 'console'
  jobs: {
    key: string
    enabled: boolean
    intervalMs: number
    lastRun: ReminderRun | null
  }[]
}

export type ReminderBatch = { runs: ReminderRun[], hasFailures: boolean }
