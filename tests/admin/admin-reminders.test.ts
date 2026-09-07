import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAdminRemindersStore } from '../../app/features/admin/admin-reminders-store'
import { reminderBatchSummary } from '../../app/features/admin/admin-reminders-helpers'
import type { ReminderBatch, ReminderOverview, ReminderRun } from '../../app/features/admin/api/admin-reminders.contract'

const runResult = (patch: Partial<ReminderRun> = {}): ReminderRun => ({
  countsComplete: true,
  id: 'run-1', jobKey: 'discovery_j1', source: 'admin', status: 'completed',
  startedAt: '2026-09-05T10:00:00.000Z', finishedAt: '2026-09-05T10:00:01.000Z',
  scanned: 1, sent: 1, failed: 0, skipped: 0, errorCode: null, ...patch
})
const overview = (enabled = true): ReminderOverview => ({
  unfinishedRuns: [],
  enabled, schedulerEnabled: true, mailProvider: 'brevo',
  jobs: [{ key: 'discovery_j1', enabled: true, intervalMs: 60000, lastRun: null }]
})
const success: ReminderBatch = { runs: [runResult()], hasFailures: false }

test('no manual send before loading configuration or when reminders are disabled', async () => {
  let sends = 0
  const store = createAdminRemindersStore({
    get: async () => overview(false),
    run: async () => {
      sends++
      return success
    }
  })
  assert.equal(await store.run(), false)
  await store.refresh()
  assert.equal(await store.run(), false)
  assert.equal(sends, 0)
})

test('disabled individual jobs prevent manual launch when none remain enabled', async () => {
  const store = createAdminRemindersStore({
    get: async () => ({ ...overview(), jobs: [{ ...overview().jobs[0]!, enabled: false }] }),
    run: async () => { throw new Error('must not run') }
  })
  await store.refresh()
  assert.equal(await store.run(), false)
})

test('manual launch works when only automatic scheduling is disabled', async () => {
  const store = createAdminRemindersStore({ get: async () => ({ ...overview(), schedulerEnabled: false }), run: async () => success })
  await store.refresh()
  assert.equal(await store.run(), true)
  assert.equal(store.result.value, success)
})

test('double click sends once, remains busy and refreshes the final execution', async () => {
  let resolveRun!: (batch: ReminderBatch) => void
  let sends = 0
  let reads = 0
  const pending = new Promise<ReminderBatch>((resolve) => {
    resolveRun = resolve
  })
  const store = createAdminRemindersStore({
    get: async () => {
      reads++
      return overview()
    },
    run: () => {
      sends++
      return pending
    }
  })
  await store.refresh()
  const first = store.run()
  assert.equal(store.running.value, true)
  assert.equal(await store.run(), false)
  assert.equal(sends, 1)
  resolveRun(success)
  await first
  assert.equal(store.running.value, false)
  assert.equal(store.result.value, success)
  assert.equal(reads, 2)
})

test('uncertain network result is never replayed and prompts checking history', async () => {
  let sends = 0
  let reads = 0
  const store = createAdminRemindersStore({
    get: async () => {
      reads++
      return overview()
    },
    run: async () => {
      sends++
      throw new Error('private server error')
    }
  })
  await store.refresh()
  await store.run()
  assert.equal(sends, 1)
  assert.equal(reads, 2)
  assert.match(store.runError.value ?? '', /des emails ont pu être envoyés/)
  assert.doesNotMatch(store.runError.value ?? '', /private/)
  assert.equal(store.result.value, null)
  assert.equal(store.running.value, false)
})

test('history refresh failure does not erase a confirmed send result', async () => {
  let reads = 0
  const store = createAdminRemindersStore({
    get: async () => {
      if (reads++ > 0) throw new Error('unavailable')
      return overview()
    },
    run: async () => success
  })
  await store.refresh()
  await store.run()
  assert.equal(store.result.value, success)
  assert.equal(store.runError.value, null)
  assert.ok(store.loadError.value)
})

test('failed job without a failed email count is not reported as success', () => {
  const summary = reminderBatchSummary({ runs: [runResult({ status: 'failed', sent: 0 })], hasFailures: true })
  assert.equal(summary.error, true)
  assert.match(summary.message, /erreurs/)
})

test('skipped concurrent jobs do not claim all processing has completed', () => {
  const summary = reminderBatchSummary({ runs: [runResult({ status: 'skipped_running', sent: 0 })], hasFailures: false })
  assert.equal(summary.error, false)
  assert.match(summary.message, /déjà en cours/)
  assert.doesNotMatch(summary.message, /traitement est terminé/)
})

test('interrupted partial sends never display a misleading zero-send total', () => {
  const summary = reminderBatchSummary({ runs: [runResult({ countsComplete: false, status: 'failed', sent: 0 })], hasFailures: true })
  assert.equal(summary.error, true)
  assert.match(summary.message, /bilan est incomplet/)
  assert.doesNotMatch(summary.message, /0 email/)
})
