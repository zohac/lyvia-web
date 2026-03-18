import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  validateWaitlistForm,
  isWaitlistFormValid,
  WAITLIST_SPECIALTY_VALUES
} from '../../app/features/waitlist/waitlist-validation'

const validForm = {
  firstName: 'Sophie',
  lastName: 'Jouan',
  email: 'sophie@moncoaching.fr',
  specialty: 'naturopathie',
  message: ''
}

// ── validateWaitlistForm ──

describe('validateWaitlistForm', () => {
  it('returns empty errors for valid form', () => {
    const errors = validateWaitlistForm(validForm)
    assert.deepStrictEqual(errors, {})
  })

  it('returns firstName error when too short', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'A' })
    assert.ok(errors.firstName)
  })

  it('returns firstName error when too long (> 50 chars)', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'A'.repeat(51) })
    assert.ok(errors.firstName)
  })

  it('accepts firstName of exactly 2 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'Jo' })
    assert.strictEqual(errors.firstName, undefined)
  })

  it('accepts firstName of exactly 50 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'A'.repeat(50) })
    assert.strictEqual(errors.firstName, undefined)
  })

  it('trims firstName before validation', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: '  Jo  ' })
    assert.strictEqual(errors.firstName, undefined)
  })

  it('returns lastName error when too short', () => {
    const errors = validateWaitlistForm({ ...validForm, lastName: 'J' })
    assert.ok(errors.lastName)
  })

  it('returns lastName error when too long (> 50 chars)', () => {
    const errors = validateWaitlistForm({ ...validForm, lastName: 'B'.repeat(51) })
    assert.ok(errors.lastName)
  })

  it('returns email error for invalid format', () => {
    const errors = validateWaitlistForm({ ...validForm, email: 'nope' })
    assert.ok(errors.email)
  })

  it('returns email error for empty email', () => {
    const errors = validateWaitlistForm({ ...validForm, email: '' })
    assert.ok(errors.email)
  })

  it('returns email error for whitespace-only email', () => {
    const errors = validateWaitlistForm({ ...validForm, email: '   ' })
    assert.ok(errors.email)
  })

  it('returns specialty error when empty', () => {
    const errors = validateWaitlistForm({ ...validForm, specialty: '' })
    assert.ok(errors.specialty)
  })

  it('returns specialty error when undefined', () => {
    const errors = validateWaitlistForm({ ...validForm, specialty: undefined })
    assert.ok(errors.specialty)
  })

  it('returns message error when > 500 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, message: 'A'.repeat(501) })
    assert.ok(errors.message)
  })

  it('accepts message of exactly 500 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, message: 'A'.repeat(500) })
    assert.strictEqual(errors.message, undefined)
  })

  it('accepts empty message (optional field)', () => {
    const errors = validateWaitlistForm({ ...validForm, message: '' })
    assert.strictEqual(errors.message, undefined)
  })
})

// ── isWaitlistFormValid ──

describe('isWaitlistFormValid', () => {
  it('returns true for valid form', () => {
    assert.strictEqual(isWaitlistFormValid(validForm), true)
  })

  it('returns false when firstName too short', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, firstName: 'A' }), false)
  })

  it('returns false when firstName too long', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, firstName: 'A'.repeat(51) }), false)
  })

  it('returns false when email invalid', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, email: 'bad' }), false)
  })

  it('returns false when specialty empty', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, specialty: '' }), false)
  })

  it('returns false when specialty undefined', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, specialty: undefined }), false)
  })

  it('returns false when message exceeds 500', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, message: 'X'.repeat(501) }), false)
  })

  it('returns true with valid message', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, message: 'Je suis naturopathe' }), true)
  })
})

// ── WAITLIST_SPECIALTY_VALUES ──

describe('WAITLIST_SPECIALTY_VALUES', () => {
  it('contains exactly 7 specialties', () => {
    assert.strictEqual(WAITLIST_SPECIALTY_VALUES.length, 7)
  })

  it('includes all expected values', () => {
    const expected = ['naturopathie', 'sophrologie', 'coaching-bien-etre', 'hypnose', 'yoga-meditation', 'nutrition', 'autre']
    for (const v of expected) {
      assert.ok(WAITLIST_SPECIALTY_VALUES.includes(v as never), `Missing: ${v}`)
    }
  })
})
