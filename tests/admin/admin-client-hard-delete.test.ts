/**
 * Behavioral tests for the admin client hard-delete modal logic (story 0-30).
 *
 * Tests cover:
 * - The blocked vs confirm UI state, depending on the API impact response.
 * - The irreversibility checkbox gate before the destructive button enables.
 * - Error classification when the DELETE call fails (race-condition 409 vs
 *   other errors), so the modal can keep itself open and refresh the impact.
 *
 * These tests fail if the financial guard wording, the checkbox gate, or the
 * 409 race-condition handling regresses.
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'

import {
  classifyHardDeleteError,
  isDestructiveButtonDisabled,
  resolveHardDeleteModalState,
  type ClientDeletionImpact
} from '../../app/features/admin/clients/admin-client-hard-delete-helpers'

// Tests are compiled to `.tmp/test-dist/` so __dirname points there, not at
// the source. Resolve from the repo root via process.cwd() — same pattern as
// scheduling-page-wiring.test.ts.
const appRoot = resolve(process.cwd(), 'app')

const allowedImpact: ClientDeletionImpact = {
  appointmentsCount: 3,
  paymentsCount: 0,
  subscriptionsCount: 0,
  canDelete: true,
  blockReason: null
}

const blockedByPaymentsImpact: ClientDeletionImpact = {
  appointmentsCount: 5,
  paymentsCount: 2,
  subscriptionsCount: 0,
  canDelete: false,
  blockReason: 'HAS_PAYMENTS'
}

const blockedBySubscriptionsImpact: ClientDeletionImpact = {
  appointmentsCount: 0,
  paymentsCount: 0,
  subscriptionsCount: 1,
  canDelete: false,
  blockReason: 'HAS_SUBSCRIPTIONS'
}

// =============================================================================
// resolveHardDeleteModalState — UI state machine
// =============================================================================

test('resolveHardDeleteModalState: impact null → loading mode (no destructive action)', () => {
  const state = resolveHardDeleteModalState(null, true)
  assert.equal(state.mode, 'loading')
  assert.equal(state.canConfirm, false)
})

test('resolveHardDeleteModalState: blocked by payments → blocked mode + double-counter wording', () => {
  const state = resolveHardDeleteModalState(blockedByPaymentsImpact, true)
  assert.equal(state.mode, 'blocked')
  assert.equal(state.headerTitle, 'Suppression impossible')
  assert.equal(state.canConfirm, false)
  assert.ok(state.blockMessage)
  // Double counter (payments AND subscriptions) per AC-3 even when only payments block
  assert.match(state.blockMessage!, /2 paiement\(s\)/)
  assert.match(state.blockMessage!, /0 abonnement\(s\)/)
  assert.match(state.blockMessage!, /Désactiver/)
})

test('resolveHardDeleteModalState: blocked by subscriptions → blocked mode + double-counter wording', () => {
  const state = resolveHardDeleteModalState(blockedBySubscriptionsImpact, true)
  assert.equal(state.mode, 'blocked')
  assert.match(state.blockMessage!, /0 paiement\(s\)/)
  assert.match(state.blockMessage!, /1 abonnement\(s\)/)
})

test('resolveHardDeleteModalState: canDelete + checkbox unchecked → confirm mode but canConfirm=false', () => {
  const state = resolveHardDeleteModalState(allowedImpact, false)
  assert.equal(state.mode, 'confirm')
  assert.equal(state.headerTitle, 'Suppression définitive')
  assert.equal(state.canConfirm, false)
  assert.equal(state.blockMessage, null)
})

test('resolveHardDeleteModalState: canDelete + checkbox checked → canConfirm=true (destructive button enabled)', () => {
  const state = resolveHardDeleteModalState(allowedImpact, true)
  assert.equal(state.mode, 'confirm')
  assert.equal(state.canConfirm, true)
})

// =============================================================================
// classifyHardDeleteError — race-condition vs unknown errors
// =============================================================================

test('classifyHardDeleteError: 409 CLIENT_HAS_FINANCIAL_RECORDS → race-condition (modal stays open, refresh impact)', () => {
  const apiFetchError = {
    apiError: {
      code: 'CLIENT_HAS_FINANCIAL_RECORDS',
      message: 'Cannot hard-delete client with payments or active subscriptions.',
      details: { paymentsCount: 1, subscriptionsCount: 0 }
    }
  }

  const outcome = classifyHardDeleteError(apiFetchError)
  assert.equal(outcome.kind, 'race-condition')
})

test('classifyHardDeleteError: other ApiFetchError → unknown-error with message (toast)', () => {
  class ApiFetchErrorMock extends Error {
    apiError = { code: 'INTERNAL_ERROR', message: 'boom' }
  }
  const err = new ApiFetchErrorMock('boom')

  const outcome = classifyHardDeleteError(err)
  assert.equal(outcome.kind, 'unknown-error')
  // unknown-error preserves the JS message for the toast description
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'boom')
  }
})

test('classifyHardDeleteError: plain Error → unknown-error with .message', () => {
  const outcome = classifyHardDeleteError(new Error('network down'))
  assert.equal(outcome.kind, 'unknown-error')
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'network down')
  }
})

test('classifyHardDeleteError: non-Error throwable → unknown-error with default message', () => {
  const outcome = classifyHardDeleteError('something weird')
  assert.equal(outcome.kind, 'unknown-error')
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'Erreur inattendue')
  }
})

// =============================================================================
// Regression guards
// =============================================================================

test('regression: even when canDelete=true, omitting checkbox keeps the destructive action disabled', () => {
  // Critical UX guarantee: an admin must explicitly tick the checkbox; a
  // single click on the row should never delete a client.
  for (const ack of [false]) {
    const state = resolveHardDeleteModalState(allowedImpact, ack)
    assert.equal(state.canConfirm, false)
  }
})

test('regression: blocked impact never enables canConfirm, regardless of checkbox', () => {
  for (const ack of [false, true]) {
    const blockedState = resolveHardDeleteModalState(
      blockedByPaymentsImpact,
      ack
    )
    assert.equal(blockedState.canConfirm, false)
  }
})

// =============================================================================
// CR1 — Destructive button stays visible but disabled in blocked mode
// =============================================================================

test('isDestructiveButtonDisabled: blocked mode → disabled forever (regardless of checkbox)', () => {
  for (const ack of [false, true]) {
    const state = resolveHardDeleteModalState(blockedByPaymentsImpact, ack)
    assert.equal(state.mode, 'blocked')
    assert.equal(isDestructiveButtonDisabled(state), true)
  }
})

test('isDestructiveButtonDisabled: confirm mode + checkbox unchecked → disabled', () => {
  const state = resolveHardDeleteModalState(allowedImpact, false)
  assert.equal(state.mode, 'confirm')
  assert.equal(isDestructiveButtonDisabled(state), true)
})

test('isDestructiveButtonDisabled: confirm mode + checkbox checked → enabled', () => {
  const state = resolveHardDeleteModalState(allowedImpact, true)
  assert.equal(state.mode, 'confirm')
  assert.equal(isDestructiveButtonDisabled(state), false)
})

test('isDestructiveButtonDisabled: loading mode (impact null) → disabled', () => {
  const state = resolveHardDeleteModalState(null, true)
  assert.equal(state.mode, 'loading')
  assert.equal(isDestructiveButtonDisabled(state), true)
})

// =============================================================================
// CR1 — Structural guard: the modal template renders the destructive button
// without v-if, so it stays in the DOM in blocked mode (visible but disabled).
// Catches a regression that would re-introduce `v-if="canDelete"` and make the
// button vanish — the exact bug the review flagged.
// =============================================================================

const MODAL_SOURCE = readFileSync(
  join(appRoot, 'components/organisms/AdminClientHardDeleteModal.vue'),
  'utf-8'
)

test('AdminClientHardDeleteModal: destructive button is always rendered (no v-if/v-else gating it on mode)', () => {
  // The destructive UButton must NOT be wrapped in a v-if/v-else that ties
  // its rendering to the mode. Find the data-test marker and look at its
  // attributes: there must be no `v-if` / `v-else` directly on it.
  const match = MODAL_SOURCE.match(
    /<UButton[^>]*data-test="hard-delete-confirm"[^>]*>/m
  )
  assert.ok(match, 'destructive button (data-test="hard-delete-confirm") not found')
  assert.equal(match![0].includes('v-if'), false, 'destructive button must not have v-if')
  assert.equal(match![0].includes('v-else'), false, 'destructive button must not have v-else')
})

test('AdminClientHardDeleteModal: destructive button uses the shared isDestructiveButtonDisabled helper (DRY + state machine)', () => {
  // Either via `:disabled="destructiveDisabled"` (computed) or directly via
  // `:disabled="isDestructiveButtonDisabled(uiState)"`. Both prove the
  // disabled state is owned by the helper, not duplicated inline.
  assert.match(
    MODAL_SOURCE,
    /:disabled="(destructiveDisabled|isDestructiveButtonDisabled\(uiState\))"/
  )
})

test('AdminClientHardDeleteModal: "Désactiver à la place" button stays visible in blocked mode', () => {
  // The CTA must be rendered (with v-if mode==='blocked') so the admin can
  // jump to the deactivate flow.
  assert.match(MODAL_SOURCE, /data-test="hard-delete-go-deactivate"/)
  assert.match(MODAL_SOURCE, /Désactiver à la place/)
})

// =============================================================================
// CR1 — Structural guard: page wires goToDeactivate to openDeactivationModal.
// Catches a regression that would make the CTA close the modal silently
// without opening the deactivation flow.
// =============================================================================

const PAGE_SOURCE = readFileSync(
  join(appRoot, 'pages/admin/clients/[id].vue'),
  'utf-8'
)

test('admin/clients/[id].vue: goToDeactivate calls openDeactivationModal (chains into the real deactivate flow)', () => {
  // Match the function body of goToDeactivate up to the next top-level
  // function declaration (or end of file).
  const fnMatch = PAGE_SOURCE.match(
    /(?:async\s+)?function\s+goToDeactivate\s*\([^)]*\)\s*\{([\s\S]*?)(?:\n\}\s*\n|\n}\s*<\/script)/
  )
  assert.ok(fnMatch, 'goToDeactivate function not found in page')
  const body = fnMatch![1]
  // Must invoke the existing deactivation flow rather than a no-op close.
  assert.match(
    body,
    /openDeactivationModal\s*\(/,
    'goToDeactivate must call openDeactivationModal() to chain into the deactivate flow'
  )
})

test('admin/clients/[id].vue: AdminClientHardDeleteModal listens to @go-deactivate (wires the CTA into the page)', () => {
  // Catches a regression that would drop the @go-deactivate handler and
  // leave "Désactiver à la place" silently broken.
  assert.match(PAGE_SOURCE, /@go-deactivate="goToDeactivate"/)
})
