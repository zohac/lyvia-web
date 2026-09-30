import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  validateWaitlistForm,
  isWaitlistFormValid,
  WAITLIST_SPECIALTY_VALUES,
  WAITLIST_ACTIVITY_STAGE_VALUES,
  WAITLIST_MAIN_BLOCKER_VALUES,
  WAITLIST_DISCOVERY_SOURCE_VALUES
} from '../../app/features/waitlist/waitlist-validation'

const validForm = {
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie@monactivite.fr',
  specialty: 'naturopathie',
  activityStage: 'preparation-lancement',
  mainBlocker: 'partie-technique',
  discoverySource: 'recommandation',
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

  it('trims firstName before validation', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: '  Jo  ' })
    assert.strictEqual(errors.firstName, undefined)
  })

  // Bornes basses et hautes acceptées : la règle 2..50 est inchangée par la
  // refonte, seuls ses tests avaient disparu.
  it('accepts firstName of exactly 2 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'Jo' })
    assert.strictEqual(errors.firstName, undefined)
  })

  it('accepts firstName of exactly 50 chars', () => {
    const errors = validateWaitlistForm({ ...validForm, firstName: 'A'.repeat(50) })
    assert.strictEqual(errors.firstName, undefined)
  })

  it('accepts an empty optional lastName', () => {
    const errors = validateWaitlistForm({ ...validForm, lastName: '' })
    assert.strictEqual(errors.lastName, undefined)
  })

  it('returns lastName error when non-empty and too short', () => {
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

  it('returns activityStage error when undefined', () => {
    const errors = validateWaitlistForm({ ...validForm, activityStage: undefined })
    assert.ok(errors.activityStage)
  })

  it('returns mainBlocker error when undefined', () => {
    const errors = validateWaitlistForm({ ...validForm, mainBlocker: undefined })
    assert.ok(errors.mainBlocker)
  })

  it('accepts an optional discoverySource when undefined', () => {
    const errors = validateWaitlistForm({ ...validForm, discoverySource: undefined })
    assert.strictEqual(errors.discoverySource, undefined)
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

  it('returns true when optional lastName is empty', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, lastName: '' }), true)
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

  it('returns false when activityStage undefined', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, activityStage: undefined }), false)
  })

  it('returns false when mainBlocker undefined', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, mainBlocker: undefined }), false)
  })

  it('returns false when message exceeds 500', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, message: 'X'.repeat(501) }), false)
  })

  it('returns true with valid message', () => {
    assert.strictEqual(isWaitlistFormValid({ ...validForm, message: 'Je suis naturopathe' }), true)
  })
})

// ── Enum values ──

describe('waitlist select values', () => {
  // La longueur seule ne protège pas d'une valeur manquante ou mal orthographiée :
  // ces enums sont recopiés à l'identique dans les CHECK de la migration API et
  // dans les libellés d'UI. On assert donc la liste exhaustive, pas sa taille.
  it('contains exactly the expected specialties', () => {
    assert.deepStrictEqual([...WAITLIST_SPECIALTY_VALUES], [
      'naturopathie',
      'sophrologie',
      'coaching-bien-etre',
      'hypnose',
      'yoga-meditation',
      'nutrition',
      'autre'
    ])
  })

  it('contains exactly the expected activity stages', () => {
    assert.deepStrictEqual([...WAITLIST_ACTIVITY_STAGE_VALUES], [
      'preparation-lancement',
      'lancement-recent',
      'structuration',
      'bien-installee'
    ])
  })

  it('contains exactly the expected main blockers', () => {
    assert.deepStrictEqual([...WAITLIST_MAIN_BLOCKER_VALUES], [
      'creer-site',
      'organiser-reservations',
      'gerer-paiements',
      'suivre-clients',
      'trop-outils',
      'partie-technique',
      'autre'
    ])
  })

  it('contains exactly the expected discovery sources', () => {
    assert.deepStrictEqual([...WAITLIST_DISCOVERY_SOURCE_VALUES], [
      'recommandation',
      'autre-praticienne',
      'google',
      'reseaux-sociaux',
      'autre'
    ])
  })
})
