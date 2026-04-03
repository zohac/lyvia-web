import * as assert from 'node:assert/strict'
import test from 'node:test'

/**
 * Tests for DS3.1 — Calendar tab deep-linking logic.
 *
 * These test the pure logic extracted from calendar.vue:
 * - Tab parsing from query params
 * - Query param preservation when changing tabs
 * - Action param cleanup preserving tab
 */

// =============================================================================
// Tab parsing from query string
// =============================================================================

type CalendarTab = 'semaine' | 'mois' | 'demandes'

function parseTab(queryTab: string | null | undefined): CalendarTab {
  if (queryTab === 'mois' || queryTab === 'demandes') return queryTab
  return 'semaine'
}

test('parseTab: undefined → semaine (default)', () => {
  assert.equal(parseTab(undefined), 'semaine')
})

test('parseTab: null → semaine (default)', () => {
  assert.equal(parseTab(null), 'semaine')
})

test('parseTab: "semaine" → semaine', () => {
  assert.equal(parseTab('semaine'), 'semaine')
})

test('parseTab: "mois" → mois', () => {
  assert.equal(parseTab('mois'), 'mois')
})

test('parseTab: "demandes" → demandes', () => {
  assert.equal(parseTab('demandes'), 'demandes')
})

test('parseTab: unknown value → semaine (fallback)', () => {
  assert.equal(parseTab('unknown'), 'semaine')
})

// =============================================================================
// Query param preservation when changing tabs
// =============================================================================

function buildTabQuery(
  tab: CalendarTab,
  currentQuery: Record<string, string>
): Record<string, string> {
  const { tab: _oldTab, ...rest } = currentQuery
  return tab === 'semaine' ? { ...rest } : { ...rest, tab }
}

test('buildTabQuery: semaine removes tab param', () => {
  const result = buildTabQuery('semaine', { tab: 'mois' })
  assert.deepEqual(result, {})
})

test('buildTabQuery: mois sets tab=mois', () => {
  const result = buildTabQuery('mois', {})
  assert.deepEqual(result, { tab: 'mois' })
})

test('buildTabQuery: demandes sets tab=demandes', () => {
  const result = buildTabQuery('demandes', {})
  assert.deepEqual(result, { tab: 'demandes' })
})

test('buildTabQuery: preserves other query params when changing tab', () => {
  const result = buildTabQuery('mois', { tab: 'semaine', foo: 'bar' })
  assert.deepEqual(result, { foo: 'bar', tab: 'mois' })
})

test('buildTabQuery: semaine preserves non-tab params', () => {
  const result = buildTabQuery('semaine', { tab: 'mois', action: 'create' })
  assert.deepEqual(result, { action: 'create' })
})

// =============================================================================
// Action param cleanup preserving tab
// =============================================================================

function cleanActionParams(
  query: Record<string, string>
): Record<string, string> {
  const { action: _a, type: _t, clientProfileId: _c, ...keep } = query
  return keep
}

test('cleanActionParams: removes action, type, clientProfileId', () => {
  const result = cleanActionParams({
    action: 'create',
    type: 'discovery',
    clientProfileId: '123'
  })
  assert.deepEqual(result, {})
})

test('cleanActionParams: preserves tab when cleaning action params', () => {
  const result = cleanActionParams({
    tab: 'mois',
    action: 'create',
    type: 'consultation',
    clientProfileId: '456'
  })
  assert.deepEqual(result, { tab: 'mois' })
})

test('cleanActionParams: preserves unrelated params', () => {
  const result = cleanActionParams({
    action: 'create',
    foo: 'bar',
    tab: 'demandes'
  })
  assert.deepEqual(result, { foo: 'bar', tab: 'demandes' })
})

// =============================================================================
// Navigation active state — query param matching
// =============================================================================

type NavMatchMode = 'exact' | 'prefix'

function isItemActive(
  itemTo: string,
  match: NavMatchMode,
  routePath: string,
  routeQuery: Record<string, string>
): boolean {
  const qIdx = itemTo.indexOf('?')
  const itemPath = qIdx >= 0 ? itemTo.slice(0, qIdx) : itemTo

  const pathMatch = match === 'prefix'
    ? routePath.startsWith(itemPath)
    : routePath === itemPath

  if (!pathMatch) return false

  if (qIdx >= 0) {
    const params = new URLSearchParams(itemTo.slice(qIdx + 1))
    for (const [key, value] of params) {
      if (routeQuery[key] !== value) return false
    }
  }

  return true
}

test('isItemActive: prefix match without query → active on path', () => {
  assert.equal(
    isItemActive('/provider/calendar', 'prefix', '/provider/calendar', {}),
    true
  )
})

test('isItemActive: prefix match without query → active with any query', () => {
  assert.equal(
    isItemActive('/provider/calendar', 'prefix', '/provider/calendar', { tab: 'demandes' }),
    true
  )
})

test('isItemActive: exact match with query → active when query matches', () => {
  assert.equal(
    isItemActive('/provider/calendar?tab=demandes', 'exact', '/provider/calendar', { tab: 'demandes' }),
    true
  )
})

test('isItemActive: exact match with query → inactive when query differs', () => {
  assert.equal(
    isItemActive('/provider/calendar?tab=demandes', 'exact', '/provider/calendar', { tab: 'mois' }),
    false
  )
})

test('isItemActive: exact match with query → inactive when no query', () => {
  assert.equal(
    isItemActive('/provider/calendar?tab=demandes', 'exact', '/provider/calendar', {}),
    false
  )
})

test('isItemActive: different path → always inactive', () => {
  assert.equal(
    isItemActive('/provider/clients', 'prefix', '/provider/calendar', {}),
    false
  )
})
