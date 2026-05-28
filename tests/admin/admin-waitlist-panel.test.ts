/**
 * Story 0-33 — behavioural coverage of the admin Waitlist panel (AC-6, AC-8).
 *
 * The project ships no DOM-mount framework: Vue components are tested by
 * (1) running their pure helpers and (2) reading the .vue source to assert
 * the wiring matches the AC verbatim. These tests will fail if:
 *  - the action matrix per status diverges from AC-6,
 *  - the toast wording stops matching AC-6 verbatim ("Statut mis à jour"),
 *  - the slot `#waitlist` in tools.vue is no longer wired to AdminWaitlistPanel,
 *  - the empty/loading/error states regress.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  computeActionsForStatus,
  reconcileLead,
  statusBadgeClasses
} from '../../app/features/admin/admin-waitlist-helpers'

const appRoot = path.resolve(process.cwd(), 'app')
const PANEL_PATH = 'components/organisms/AdminWaitlistPanel.vue'
const TOOLS_PAGE_PATH = 'pages/admin/tools.vue'

function readPanel(): string {
  return fs.readFileSync(path.join(appRoot, PANEL_PATH), 'utf-8')
}

function readToolsPage(): string {
  return fs.readFileSync(path.join(appRoot, TOOLS_PAGE_PATH), 'utf-8')
}

describe('0-33 — Admin Waitlist Panel — action matrix (AC-6)', () => {
  test('pending → 3 actions: contacted, onboarded, declined (verbatim)', () => {
    const actions = computeActionsForStatus('pending')
    assert.equal(actions.length, 3)
    assert.deepEqual(
      actions.map(a => a.label),
      ['Marquer contacté', 'Marquer onboardé', 'Décliner']
    )
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['contacted', 'onboarded', 'declined']
    )
  })

  test('contacted → 3 actions: onboarded, pending (rollback), declined', () => {
    const actions = computeActionsForStatus('contacted')
    assert.equal(actions.length, 3)
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['onboarded', 'pending', 'declined']
    )
    assert.equal(actions[1].label, 'Repasser en attente')
  })

  test('onboarded → 2 actions: contacted (rollback), declined', () => {
    const actions = computeActionsForStatus('onboarded')
    assert.equal(actions.length, 2)
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['contacted', 'declined']
    )
    assert.equal(actions[0].label, 'Repasser en contacté')
  })

  test('declined → only 1 action: pending (revive)', () => {
    const actions = computeActionsForStatus('declined')
    assert.equal(actions.length, 1)
    assert.equal(actions[0].nextStatus, 'pending')
    assert.equal(actions[0].label, 'Repasser en attente')
  })

  test('statusBadgeClasses returns distinct color tokens per status', () => {
    const seen = new Set([
      statusBadgeClasses('pending'),
      statusBadgeClasses('contacted'),
      statusBadgeClasses('onboarded'),
      statusBadgeClasses('declined')
    ])
    assert.equal(seen.size, 4, 'each status must have a distinct badge color')
  })
})

describe('0-33 — Admin Waitlist Panel — optimistic reconciliation (AC-6)', () => {
  test('reconcileLead replaces the lead matching id and preserves order', () => {
    type LeadShape = { id: string, status: 'pending' | 'contacted' }
    const list: LeadShape[] = [
      { id: 'a', status: 'pending' },
      { id: 'b', status: 'pending' },
      { id: 'c', status: 'pending' }
    ]
    const updated: LeadShape = { id: 'b', status: 'contacted' }
    const next = reconcileLead(list, updated)
    assert.equal(next.length, 3)
    assert.equal(next[1].status, 'contacted')
    assert.equal(next[0].status, 'pending')
    assert.equal(next[2].status, 'pending')
    assert.notEqual(next, list, 'must return a new array (no mutation)')
  })

  test('reconcileLead is a no-op when id is not present', () => {
    type LeadShape = { id: string, status: 'pending' | 'contacted' }
    const list: LeadShape[] = [{ id: 'a', status: 'pending' }]
    const next = reconcileLead(list, { id: 'b', status: 'contacted' } as LeadShape)
    assert.equal(next.length, 1)
    assert.equal(next[0].status, 'pending')
  })
})

describe('0-33 — Panel source wiring (AC-6, A31 wording verbatim)', () => {
  test('toast on success uses the wording "Statut mis à jour" verbatim (A31)', () => {
    const source = readPanel()
    assert.ok(
      /title:\s*'Statut mis à jour'/.test(source),
      'Success toast title MUST be the AC wording verbatim — any paraphrase regresses A31'
    )
  })

  test('toast on failure uses the wording "Impossible de mettre à jour le statut" verbatim', () => {
    const source = readPanel()
    assert.ok(
      /title:\s*'Impossible de mettre à jour le statut'/.test(source),
      'Failure toast title MUST be the AC wording verbatim'
    )
  })

  test('panel uses computeActionsForStatus helper (DRY across panel + tests)', () => {
    const source = readPanel()
    assert.match(
      source,
      /computeActionsForStatus\(lead\.status\)/,
      'panel must build actions from the shared helper'
    )
  })

  test('panel renders DsEmptyState when isEmpty (AC-6 empty state)', () => {
    const source = readPanel()
    assert.match(source, /AtomsDsEmptyState[\s\S]*?icon="i-lucide-list"/)
    assert.match(source, /v-else-if="isEmpty"/)
  })

  test('panel renders DsErrorState with @retry → fetchInitial (AC-6 error state)', () => {
    const source = readPanel()
    assert.match(source, /AtomsDsErrorState/)
    assert.match(source, /@retry="fetchInitial"/)
  })

  test('"Charger plus" button is wired to loadMore (AC-6 pagination)', () => {
    const source = readPanel()
    assert.match(source, /@click="loadMore"/)
    assert.ok(source.includes('Charger plus'))
  })

  test('Codex F6 — status pills use filterPillClasses() helper (no inline classes)', () => {
    const source = readPanel()
    assert.match(source, /filterPillClasses\(statusFilter === opt\.value/)
    // The previous inline pill className must be gone.
    const removedPillClass
      = 'border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
    assert.ok(
      !source.includes(removedPillClass),
      'Status pill inline class strings must be removed in favor of filterPillClasses()'
    )
  })

  test('Codex F6 — specialty filter is a <USelect> (not a native <select>)', () => {
    const source = readPanel()
    assert.match(source, /<USelect[\s\S]*?id="specialtyFilter"/)
    assert.ok(
      !/<select\s+id="specialtyFilter"/.test(source),
      'Native <select> must be replaced by USelect'
    )
  })

  test('Codex F5 — error toast is sticky (duration: 0)', () => {
    const source = readPanel()
    // Confirm the error toast carries `duration: 0` (no auto-close).
    const errorToastBlock = source.match(/title:\s*'Impossible de mettre à jour le statut',[\s\S]*?\}\)/)
    assert.ok(errorToastBlock, 'Error toast block must exist')
    assert.match(errorToastBlock![0], /duration:\s*0/)
  })

  test('desktop table keeps the AC column wording "Nom complet"', () => {
    const source = readPanel()
    assert.ok(source.includes('Nom complet'))
  })
})

describe('0-33 — tools.vue slot wiring (AC-8)', () => {
  test('slot #waitlist renders <OrganismsAdminWaitlistPanel /> (no placeholder)', () => {
    const source = readToolsPage()
    assert.match(source, /<template #waitlist>[\s\S]*?<OrganismsAdminWaitlistPanel \/>/)
  })

  test('previous placeholder "Cette section sera bientôt disponible" is removed', () => {
    const source = readToolsPage()
    assert.ok(
      !source.includes('Cette section sera bientôt disponible'),
      'AC-8: the placeholder copy must be removed from tools.vue'
    )
  })

  test('UTabs parent retains :unmount-on-hide="false" (Convention DS4)', () => {
    const source = readToolsPage()
    assert.match(source, /:unmount-on-hide="false"/)
  })
})
