import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

/**
 * Convention AD-DS6 — Modal vs Slideover
 *
 * Rule: count interactive fields (UInput, USelect, UTextarea, USwitch, date pickers).
 * - 0, 1, or 2 fields → UModal
 * - 3 or more fields → USlideover
 *
 * Exception: Marketing landing page popups (MarketingLandingB2B.vue) keep UModal.
 */

describe('DS4.4 — Convention modal vs slideover (AD-DS6)', () => {
  describe('Long forms (>= 3 fields) must use USlideover', () => {
    test('ProviderCalendarCreateAppointmentModal uses USlideover', () => {
      const content = readFile('components/organisms/ProviderCalendarCreateAppointmentModal.vue')
      assert.ok(content.includes('<USlideover'), 'Should use USlideover (8 fields)')
      assert.ok(!content.includes('<UModal'), 'Should NOT contain UModal')
    })

    test('ProviderCalendarEditAppointmentModal uses USlideover', () => {
      const content = readFile('components/organisms/ProviderCalendarEditAppointmentModal.vue')
      assert.ok(content.includes('<USlideover'), 'Should use USlideover (5 fields)')
      assert.ok(!content.includes('<UModal'), 'Should NOT contain UModal')
    })

    test('ProviderCreateConsultationPricePlanModal uses USlideover', () => {
      const content = readFile('components/organisms/ProviderCreateConsultationPricePlanModal.vue')
      assert.ok(content.includes('<USlideover'), 'Should use USlideover (5 fields)')
      assert.ok(!content.includes('<UModal'), 'Should NOT contain UModal')
    })

    test('availability.vue — Create Block uses USlideover', () => {
      const content = readFile('pages/provider/availability.vue')
      // Create Block modal has createBlockModalOpen bound to USlideover
      const createBlockSection = content.slice(
        content.indexOf('createBlockModalOpen'),
        content.indexOf('<!-- Delete Block Modal -->')
      )
      assert.ok(createBlockSection.includes('<USlideover'), 'Create Block should use USlideover (4 fields)')
    })

    test('availability.vue — Create Rule uses USlideover', () => {
      const content = readFile('pages/provider/availability.vue')
      const createRuleSection = content.slice(
        content.indexOf('createRuleModalOpen'),
        content.indexOf('<!-- Update Rule Modal -->')
      )
      assert.ok(createRuleSection.includes('<USlideover'), 'Create Rule should use USlideover (7 fields)')
    })

    test('availability.vue — Update Rule uses USlideover', () => {
      const content = readFile('pages/provider/availability.vue')
      const updateRuleSection = content.slice(
        content.indexOf('<!-- Update Rule Modal -->'),
        content.indexOf('<!-- Delete Rule Modal -->')
      )
      assert.ok(updateRuleSection.includes('<USlideover'), 'Update Rule should use USlideover (6 fields)')
    })
  })

  describe('Short actions (< 3 fields) must use UModal', () => {
    test('ConfirmActionModal uses UModal', () => {
      const content = readFile('components/molecules/ConfirmActionModal.vue')
      assert.ok(content.includes('<UModal'), 'Should use UModal (0 fields)')
    })

    test('ProviderCalendarCancelAppointmentModal uses UModal', () => {
      const content = readFile('components/organisms/ProviderCalendarCancelAppointmentModal.vue')
      assert.ok(content.includes('<UModal'), 'Should use UModal (2 fields)')
    })

    test('ProviderRejectRequestModal uses UModal', () => {
      const content = readFile('components/organisms/ProviderRejectRequestModal.vue')
      assert.ok(content.includes('<UModal'), 'Should use UModal (1 field)')
    })

    test('ProviderEditConsultationPricePlanModal uses UModal', () => {
      const content = readFile('components/organisms/ProviderEditConsultationPricePlanModal.vue')
      assert.ok(content.includes('<UModal'), 'Should use UModal (1 field)')
    })

    test('availability.vue — Copy Rules uses UModal', () => {
      const content = readFile('pages/provider/availability.vue')
      const copySection = content.slice(
        content.indexOf('<!-- Copy Rules Modal -->'),
        content.indexOf('<!-- Error/Notice alerts -->')
      )
      assert.ok(copySection.includes('<UModal'), 'Copy Rules should use UModal (2 fields)')
    })
  })

  describe('Detail slideovers (read-only, long content) use USlideover', () => {
    test('AdminBusinessLogsPanel uses USlideover for detail', () => {
      const content = readFile('components/organisms/AdminBusinessLogsPanel.vue')
      assert.ok(content.includes('<USlideover'), 'Should use USlideover for log detail')
    })

    test('AdminNotificationLogsPanel uses USlideover for detail', () => {
      const content = readFile('components/organisms/AdminNotificationLogsPanel.vue')
      assert.ok(content.includes('<USlideover'), 'Should use USlideover for notification detail')
    })
  })

  describe('Exception: marketing landing page popup keeps UModal', () => {
    test('MarketingLandingB2B waitlist popup uses UModal (marketing exception)', () => {
      const content = readFile('components/templates/MarketingLandingB2B.vue')
      // The waitlist modal section
      const waitlistSection = content.slice(
        content.indexOf('WAITLIST MODAL'),
        content.indexOf('</ClientOnly>')
      )
      assert.ok(waitlistSection.includes('<UModal'), 'Waitlist popup should use UModal (marketing exception)')
    })
  })
})
