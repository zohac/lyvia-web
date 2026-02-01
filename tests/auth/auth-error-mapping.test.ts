/**
 * Unit tests for auth error code mapping.
 *
 * Tests cover all branches of mapAuthErrorCodeToUserMessage() used by
 * useAuthActions composable for change-password and request-email-change flows.
 *
 * @see Story 2.2 — Review follow-up [L3]
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { mapAuthErrorCodeToUserMessage } from '../../app/services/api/api-error'

// =============================================================================
// Change-password error codes
// =============================================================================

test('mapAuthErrorCodeToUserMessage: INVALID_CURRENT_PASSWORD returns incorrect password message', () => {
  const result = mapAuthErrorCodeToUserMessage('INVALID_CURRENT_PASSWORD')
  assert.equal(result, 'Le mot de passe actuel est incorrect.')
})

test('mapAuthErrorCodeToUserMessage: SAME_PASSWORD returns different password required message', () => {
  const result = mapAuthErrorCodeToUserMessage('SAME_PASSWORD')
  assert.equal(result, 'Le nouveau mot de passe doit être différent de l\'ancien.')
})

test('mapAuthErrorCodeToUserMessage: PASSWORD_POLICY_FAILED returns policy message', () => {
  const result = mapAuthErrorCodeToUserMessage('PASSWORD_POLICY_FAILED')
  assert.equal(result, 'Le mot de passe ne respecte pas les exigences de sécurité.')
})

// =============================================================================
// Request-email-change error codes
// =============================================================================

test('mapAuthErrorCodeToUserMessage: SAME_EMAIL returns same email message', () => {
  const result = mapAuthErrorCodeToUserMessage('SAME_EMAIL')
  assert.equal(result, 'Cette adresse est déjà la vôtre.')
})

test('mapAuthErrorCodeToUserMessage: EMAIL_ALREADY_TAKEN returns email taken message', () => {
  const result = mapAuthErrorCodeToUserMessage('EMAIL_ALREADY_TAKEN')
  assert.equal(result, 'Cette adresse email est déjà utilisée par un autre compte.')
})

// =============================================================================
// Session / auth error codes
// =============================================================================

test('mapAuthErrorCodeToUserMessage: INVALID_CREDENTIALS returns invalid credentials message', () => {
  const result = mapAuthErrorCodeToUserMessage('INVALID_CREDENTIALS')
  assert.equal(result, 'Identifiants invalides. Vérifiez votre email et votre mot de passe.')
})

test('mapAuthErrorCodeToUserMessage: USER_INACTIVE returns same message as INVALID_CREDENTIALS', () => {
  const result = mapAuthErrorCodeToUserMessage('USER_INACTIVE')
  assert.equal(result, 'Identifiants invalides. Vérifiez votre email et votre mot de passe.')
})

test('mapAuthErrorCodeToUserMessage: INVALID_REFRESH_TOKEN returns session expired message', () => {
  const result = mapAuthErrorCodeToUserMessage('INVALID_REFRESH_TOKEN')
  assert.equal(result, 'Votre session a expiré. Veuillez vous reconnecter.')
})

test('mapAuthErrorCodeToUserMessage: REFRESH_REUSED_OR_REVOKED returns session expired message', () => {
  const result = mapAuthErrorCodeToUserMessage('REFRESH_REUSED_OR_REVOKED')
  assert.equal(result, 'Votre session a expiré. Veuillez vous reconnecter.')
})

test('mapAuthErrorCodeToUserMessage: INVALID_PASSWORD_RESET_TOKEN returns expired link message', () => {
  const result = mapAuthErrorCodeToUserMessage('INVALID_PASSWORD_RESET_TOKEN')
  assert.equal(result, 'Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.')
})

test('mapAuthErrorCodeToUserMessage: INVALID_OR_EXPIRED_TOKEN returns expired verification link message', () => {
  const result = mapAuthErrorCodeToUserMessage('INVALID_OR_EXPIRED_TOKEN')
  assert.equal(result, 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien de vérification.')
})

test('mapAuthErrorCodeToUserMessage: VALIDATION_ERROR returns form validation message', () => {
  const result = mapAuthErrorCodeToUserMessage('VALIDATION_ERROR')
  assert.equal(result, 'Veuillez vérifier les champs du formulaire.')
})

// =============================================================================
// Default / unknown codes
// =============================================================================

test('mapAuthErrorCodeToUserMessage: unknown code returns generic fallback', () => {
  const result = mapAuthErrorCodeToUserMessage('UNKNOWN_ERROR_CODE')
  assert.equal(result, 'Une erreur est survenue. Veuillez réessayer.')
})

test('mapAuthErrorCodeToUserMessage: empty string returns generic fallback', () => {
  const result = mapAuthErrorCodeToUserMessage('')
  assert.equal(result, 'Une erreur est survenue. Veuillez réessayer.')
})
