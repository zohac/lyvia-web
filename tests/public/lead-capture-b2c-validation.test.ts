import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * B2C LeadCaptureForm validation logic (extracted inline).
 * Tests the email validation regex and consent gate used in LeadCaptureForm.vue.
 */

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

function canSubmit(email: string, consent: boolean, isSubmitting: boolean): boolean {
  return isValidEmail(email) && consent && !isSubmitting
}

// --- Email validation ---

describe('LeadCaptureForm email validation', () => {
  it('accepts valid email', () => {
    assert.ok(isValidEmail('marie@example.fr'))
  })

  it('accepts email with subdomain', () => {
    assert.ok(isValidEmail('user@sub.domain.co.uk'))
  })

  it('rejects email without @', () => {
    assert.equal(isValidEmail('notanemail'), false)
  })

  it('rejects email without TLD >= 2 chars', () => {
    assert.equal(isValidEmail('user@example.a'), false)
  })

  it('rejects empty string', () => {
    assert.equal(isValidEmail(''), false)
  })

  it('trims whitespace before validation', () => {
    assert.ok(isValidEmail('  marie@example.fr  '))
  })
})

// --- canSubmit gate ---

describe('LeadCaptureForm canSubmit', () => {
  it('returns true when email valid, consent true, not submitting', () => {
    assert.ok(canSubmit('marie@example.fr', true, false))
  })

  it('returns false when consent is false (RGPD)', () => {
    assert.equal(canSubmit('marie@example.fr', false, false), false)
  })

  it('returns false when email is invalid', () => {
    assert.equal(canSubmit('invalid', true, false), false)
  })

  it('returns false when submitting', () => {
    assert.equal(canSubmit('marie@example.fr', true, true), false)
  })

  it('returns false when all conditions fail', () => {
    assert.equal(canSubmit('', false, true), false)
  })
})
