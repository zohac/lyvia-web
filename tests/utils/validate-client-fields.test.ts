import * as assert from 'node:assert/strict'
import test from 'node:test'

import { validateClientFields } from '../../app/utils/validate-client-fields'

test('validateClientFields: returns empty errors when all fields are valid', () => {
  const errors = validateClientFields({ firstName: 'Sophie', lastName: 'Martin', email: 'sophie@example.com' })
  assert.deepStrictEqual(errors, {})
})

test('validateClientFields: requires firstName', () => {
  const errors = validateClientFields({ firstName: '', lastName: 'Martin', email: 'sophie@example.com' })
  assert.ok('firstName' in errors)
  assert.equal(errors.firstName, 'Le prénom est requis')
})

test('validateClientFields: requires lastName', () => {
  const errors = validateClientFields({ firstName: 'Sophie', lastName: '  ', email: 'sophie@example.com' })
  assert.ok('lastName' in errors)
  assert.equal(errors.lastName, 'Le nom est requis')
})

test('validateClientFields: requires email', () => {
  const errors = validateClientFields({ firstName: 'Sophie', lastName: 'Martin', email: '' })
  assert.ok('email' in errors)
  assert.equal(errors.email, 'L\'email est requis')
})

test('validateClientFields: rejects invalid email format', () => {
  const errors = validateClientFields({ firstName: 'Sophie', lastName: 'Martin', email: 'not-an-email' })
  assert.ok('email' in errors)
  assert.equal(errors.email, 'Format email invalide')
})

test('validateClientFields: accepts valid email formats', () => {
  const validEmails = ['test@example.com', 'user.name@domain.fr', 'a@b.co']
  for (const email of validEmails) {
    const errors = validateClientFields({ firstName: 'A', lastName: 'B', email })
    assert.ok(!('email' in errors), `Expected ${email} to be valid`)
  }
})

test('validateClientFields: returns multiple errors at once', () => {
  const errors = validateClientFields({ firstName: '', lastName: '', email: '' })
  assert.equal(Object.keys(errors).length, 3)
  assert.ok('firstName' in errors)
  assert.ok('lastName' in errors)
  assert.ok('email' in errors)
})

test('validateClientFields: trims whitespace for required check', () => {
  const errors = validateClientFields({ firstName: '   ', lastName: '   ', email: '   ' })
  assert.ok('firstName' in errors)
  assert.ok('lastName' in errors)
  assert.ok('email' in errors)
})
