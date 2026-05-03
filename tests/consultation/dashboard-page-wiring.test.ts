import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-21 — behavioural coverage of `/client/dashboard` (AC-3 wiring).
 *
 * Finding 2 (Codex 2026-04-24) asked for a real wiring test on
 * `app/pages/client/dashboard.vue` so the AC-3 banner does not silently
 * disappear if someone deletes the `<UAlert>` while keeping the helper tests
 * green.
 *
 * These tests are structural but they target the exact lines that implement
 * the behaviour: removing the UAlert, unplugging the CTA from
 * `paymentBanner.url`, dropping the provider/date/amount from the title or
 * moving the alert below the grid will fail one of the assertions below.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const PAGE_PATH = 'pages/client/dashboard.vue'

function readPage(): string {
  return fs.readFileSync(path.join(appRoot, PAGE_PATH), 'utf-8')
}

describe('0-21 — /client/dashboard page wiring (AC-3 banner paiement)', () => {
  test('imports resolvePaymentBanner + resolveGreetingSubtitle from the dashboard-banner helper', () => {
    const source = readPage()
    assert.match(
      source,
      /import\s*\{\s*resolvePaymentBanner,\s*resolveGreetingSubtitle\s*\}\s*from\s*['"][^'"]*dashboard-banner['"]/,
      'dashboard.vue must import the pure helpers — otherwise AC-3/AC-4 wiring is bypassed'
    )
  })

  test('paymentBanner computed is wired to resolvePaymentBanner(consultationState.value)', () => {
    const source = readPage()
    assert.match(
      source,
      /const\s+paymentBanner\s*=\s*computed\(\s*\(\s*\)\s*=>\s*resolvePaymentBanner\(\s*consultationState\.value\s*\)\s*\)/
    )
  })

  test('greetingSubtitle computed forwards state + paymentsCount + paymentsPending to the helper', () => {
    const source = readPage()
    assert.match(source, /const\s+greetingSubtitle\s*=\s*computed\(/)
    assert.match(source, /resolveGreetingSubtitle\(\{[\s\S]*?state:\s*consultationState\.value/)
    assert.match(source, /paymentsCount:\s*payments\.value\.length/)
    assert.match(source, /paymentsPending:\s*paymentsPending\.value/)
  })

  test('MoleculesDashboardGreeting subtitle is bound to the computed greetingSubtitle', () => {
    const source = readPage()
    assert.match(source, /<MoleculesDashboardGreeting\s+:subtitle="greetingSubtitle"/)
  })

  test('UAlert is rendered under `v-if="paymentBanner"` with warning/credit-card affordances', () => {
    const source = readPage()
    assert.match(source, /<UAlert[\s\S]*?v-if="paymentBanner"/)
    assert.match(source, /color="warning"/)
    assert.match(source, /variant="subtle"/)
    assert.match(source, /icon="lucide:credit-card"/)
    assert.match(source, /:title="paymentBanner\.title"/)
  })

  test('CTA button is bound to paymentBanner.url and labelled "Payer et confirmer" (AC-3 verbatim)', () => {
    const source = readPage()
    // Button must consume the helper URL — otherwise the pay target drifts.
    assert.match(source, /:to="paymentBanner\.url"/)
    // Label verbatim from AC-3.
    assert.ok(
      source.includes('Payer et confirmer'),
      'CTA label must be the AC-3 verbatim wording "Payer et confirmer"'
    )
    // Trailing arrow icon matches the AC-3 design snippet.
    assert.match(source, /trailing-icon="i-lucide-arrow-right"/)
  })

  test('banner renders BEFORE the main content grid (AC-3: prominence)', () => {
    const source = readPage()
    const alertIndex = source.indexOf('v-if="paymentBanner"')
    const gridMarkerIndex = source.indexOf('Main content grid')

    assert.ok(alertIndex >= 0, 'UAlert with v-if="paymentBanner" must exist in dashboard.vue')
    assert.ok(gridMarkerIndex >= 0, 'Main content grid marker must exist in dashboard.vue')
    assert.ok(
      alertIndex < gridMarkerIndex,
      `AC-3: UAlert (idx=${alertIndex}) must appear before the main content grid (idx=${gridMarkerIndex}) in the template`
    )
  })

  test('banner sits OUTSIDE the ConsultationDashboardCard so the prominent alert is not duplicated inside the card', () => {
    const source = readPage()
    const alertIndex = source.indexOf('v-if="paymentBanner"')
    const cardIndex = source.indexOf('<OrganismsConsultationDashboardCard')

    assert.ok(alertIndex >= 0)
    assert.ok(cardIndex >= 0)
    assert.ok(
      alertIndex < cardIndex,
      'Banner must live above the dashboard card, not within it (AC-3: bannière prominente en haut de page)'
    )
  })
})
