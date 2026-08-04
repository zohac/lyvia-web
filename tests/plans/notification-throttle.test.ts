/**
 * Story 18.2 (CR) — Comportement du garde anti-empilement des toasts.
 *
 * Extrait de `feature-gate-toast.ts` (qui dépend de l'auto-import `useToast()`
 * et n'est donc pas compilable par le runner Node). Avant l'extraction, une
 * mutation supprimant la mémorisation de la dernière notification — ce qui
 * désactive entièrement le garde — laissait la suite complète verte.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  createNotificationThrottle,
  FEATURE_GATE_TOAST_COOLDOWN_MS
} from '../../app/features/plans/domain/notification-throttle'

describe('createNotificationThrottle', () => {
  test('la fenêtre par défaut est de 3 s (AC #5)', () => {
    assert.equal(FEATURE_GATE_TOAST_COOLDOWN_MS, 3_000)
  })

  test('la première notification passe toujours', () => {
    const throttle = createNotificationThrottle()

    assert.equal(throttle.shouldNotify(0), true)
  })

  test('REGRESSION: une seconde notification dans la fenêtre est supprimée', () => {
    // Une page déclenchant 5 appels gatés d'affilée ne doit pas empiler
    // 5 toasts identiques.
    const throttle = createNotificationThrottle()

    assert.equal(throttle.shouldNotify(1_000), true)
    assert.equal(throttle.shouldNotify(1_500), false)
    assert.equal(throttle.shouldNotify(3_999), false)
  })

  test('REGRESSION: la notification repasse une fois la fenêtre écoulée', () => {
    // Le garde ne doit pas museler définitivement les toasts suivants.
    const throttle = createNotificationThrottle()

    assert.equal(throttle.shouldNotify(1_000), true)
    assert.equal(throttle.shouldNotify(4_000), true)
    assert.equal(throttle.shouldNotify(7_000), true)
  })

  test('la fenêtre court depuis la dernière notification ÉMISE, pas depuis la dernière tentative', () => {
    const throttle = createNotificationThrottle()

    assert.equal(throttle.shouldNotify(0), true)
    assert.equal(throttle.shouldNotify(2_000), false)
    // 2 500 est à moins de 3 s de l'émission (0), donc toujours supprimé —
    // une tentative refusée ne doit pas réarmer le compteur.
    assert.equal(throttle.shouldNotify(2_500), false)
    assert.equal(throttle.shouldNotify(3_000), true)
  })

  test('reset() réarme le garde', () => {
    const throttle = createNotificationThrottle()

    assert.equal(throttle.shouldNotify(1_000), true)
    assert.equal(throttle.shouldNotify(1_500), false)

    throttle.reset()

    assert.equal(throttle.shouldNotify(1_500), true)
  })

  test('la fenêtre est configurable', () => {
    const throttle = createNotificationThrottle(100)

    assert.equal(throttle.shouldNotify(0), true)
    assert.equal(throttle.shouldNotify(50), false)
    assert.equal(throttle.shouldNotify(100), true)
  })
})
