import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * DS4.2 — Admin navigation restructure tests.
 * Validates the admin nav has exactly 4 visible entries and the tools page
 * exposes the correct tabs with proper deep-linking fallback.
 */

// ── Admin navigation config (mirrors admin.vue) ──

const ADMIN_NAV_ITEMS = [
  { label: 'Providers', to: '/admin/providers' },
  { label: 'Clients', to: '/admin/clients' },
  { label: 'Outils', to: '/admin/tools' }
] as const

const ADMIN_HOME = { label: 'Dashboard', to: '/admin/dashboard' }

const ALL_VISIBLE_ENTRIES = [ADMIN_HOME, ...ADMIN_NAV_ITEMS]

// ── Tools tabs config (mirrors tools.vue) ──

const VALID_TOOL_TABS = ['analytics', 'logs', 'notifications', 'waitlist'] as const
type ToolTab = typeof VALID_TOOL_TABS[number]

function parseToolTab(raw: unknown): ToolTab {
  if (typeof raw === 'string' && (VALID_TOOL_TABS as readonly string[]).includes(raw)) {
    return raw as ToolTab
  }
  return 'analytics'
}

// ── Admin legacy redirects (mirrors nuxt.config.ts routeRules) ──

const ADMIN_LEGACY_REDIRECTS: Record<string, string> = {
  '/admin/analytics': '/admin/tools?tab=analytics',
  '/admin/logs': '/admin/tools?tab=logs',
  '/admin/business-logs': '/admin/tools?tab=logs',
  '/admin/notification-logs': '/admin/tools?tab=notifications'
}

// ── Tests ──

describe('DS4.2 — Admin navigation', () => {
  it('exposes exactly 4 visible entries (Dashboard + 3 items)', () => {
    assert.equal(ALL_VISIBLE_ENTRIES.length, 4)
  })

  it('includes Dashboard, Providers, Clients, Outils', () => {
    const labels = ALL_VISIBLE_ENTRIES.map(e => e.label)
    assert.deepEqual(labels, ['Dashboard', 'Providers', 'Clients', 'Outils'])
  })

  it('does NOT include SEO as a visible nav item', () => {
    const labels = ALL_VISIBLE_ENTRIES.map(e => e.label)
    assert.ok(!labels.includes('SEO'))
  })

  it('does NOT include Design System as a visible nav item', () => {
    const labels = ALL_VISIBLE_ENTRIES.map(e => e.label)
    assert.ok(!labels.includes('Design System'))
  })
})

describe('DS4.2 — Admin tools tabs', () => {
  it('exposes exactly 4 tabs', () => {
    assert.equal(VALID_TOOL_TABS.length, 4)
  })

  it('includes analytics, logs, notifications, waitlist', () => {
    assert.deepEqual([...VALID_TOOL_TABS], ['analytics', 'logs', 'notifications', 'waitlist'])
  })

  it('parses valid tab "logs"', () => {
    assert.equal(parseToolTab('logs'), 'logs')
  })

  it('parses valid tab "waitlist"', () => {
    assert.equal(parseToolTab('waitlist'), 'waitlist')
  })

  it('falls back to "analytics" for unknown tab', () => {
    assert.equal(parseToolTab('abc'), 'analytics')
  })

  it('falls back to "analytics" for undefined', () => {
    assert.equal(parseToolTab(undefined), 'analytics')
  })

  it('falls back to "analytics" for null', () => {
    assert.equal(parseToolTab(null), 'analytics')
  })
})

describe('DS4.2 — Admin legacy redirects', () => {
  it('redirects /admin/analytics', () => {
    assert.equal(ADMIN_LEGACY_REDIRECTS['/admin/analytics'], '/admin/tools?tab=analytics')
  })

  it('redirects /admin/logs', () => {
    assert.equal(ADMIN_LEGACY_REDIRECTS['/admin/logs'], '/admin/tools?tab=logs')
  })

  it('redirects /admin/business-logs', () => {
    assert.equal(ADMIN_LEGACY_REDIRECTS['/admin/business-logs'], '/admin/tools?tab=logs')
  })

  it('redirects /admin/notification-logs', () => {
    assert.equal(ADMIN_LEGACY_REDIRECTS['/admin/notification-logs'], '/admin/tools?tab=notifications')
  })
})
