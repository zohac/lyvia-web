import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('MedicalDisclaimer presence (U1.4a)', () => {
  test('MedicalDisclaimer component file exists', () => {
    const filePath = path.join(appRoot, 'components/atoms/MedicalDisclaimer.vue')
    assert.ok(fs.existsSync(filePath), 'MedicalDisclaimer.vue should exist')
  })

  test('MedicalDisclaimer contains the required YMYL text', () => {
    const content = readFile('components/atoms/MedicalDisclaimer.vue')
    assert.ok(
      content.includes('ne se substitue pas'),
      'Should contain the medical disclaimer text'
    )
  })

  test('CoachPublicPageTemplate includes MedicalDisclaimer', () => {
    const content = readFile('components/templates/CoachPublicPageTemplate.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Coach profile template should include MedicalDisclaimer'
    )
  })

  test('booking platform page includes MedicalDisclaimer', () => {
    const content = readFile('pages/coach/[slug]/onboarding/discovery.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Booking platform page should include MedicalDisclaimer'
    )
  })

  test('booking white-label page includes MedicalDisclaimer', () => {
    const content = readFile('pages/onboarding/discovery.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Booking white-label page should include MedicalDisclaimer'
    )
  })
})
