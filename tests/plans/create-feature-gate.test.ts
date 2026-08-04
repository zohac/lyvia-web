/**
 * Story 18.2 — Comportement de `createFeatureGate`, testé sur la factory réelle
 * avec un fetch factice (pattern `use-admin-waitlist.test.ts` / `yc3-1`).
 *
 * C'est le même code que celui qu'importe `useFeatureGate()` : aucune
 * réimplémentation dans les tests.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ref } from 'vue'

import {
  createFeatureGate,
  createInitialFeatureGateState,
  type FeatureGateAccount,
  type FeatureGateState
} from '../../app/features/plans/createFeatureGate'

const ESSENTIEL: FeatureGateAccount = {
  plan: { slug: 'essentiel', name: 'Essentiel' },
  enabledFeatures: ['lead_magnet']
}

const PREMIUM: FeatureGateAccount = {
  plan: { slug: 'premium', name: 'Premium' },
  enabledFeatures: [
    'custom_domain',
    'white_label_branding',
    'coach_page_premium_templates',
    'lead_magnet'
  ]
}

function build(options: {
  account?: FeatureGateAccount
  fail?: boolean
  /** Retarde la résolution pour tester la déduplication des appels concurrents. */
  defer?: boolean
} = {}) {
  const state = ref<FeatureGateState>(createInitialFeatureGateState())
  let calls = 0
  let resolveDeferred: (() => void) | null = null

  const fetchAccount = async (): Promise<FeatureGateAccount> => {
    calls += 1
    if (options.defer) {
      await new Promise<void>((resolve) => {
        resolveDeferred = resolve
      })
    }
    if (options.fail) throw new Error('network down')
    return options.account ?? ESSENTIEL
  }

  const gate = createFeatureGate({ state, fetchAccount })
  return {
    gate,
    state,
    callCount: () => calls,
    release: () => resolveDeferred?.()
  }
}

describe('createFeatureGate', () => {
  test('REGRESSION: N ensureLoaded() concurrents ne déclenchent QU\'UN fetch', async () => {
    // Deux <FeatureGate> montés dans le même tick ne doivent pas produire deux
    // GET /provider/account.
    const { gate, callCount, release } = build({ defer: true })

    const a = gate.ensureLoaded()
    const b = gate.ensureLoaded()
    const c = gate.ensureLoaded()
    release()
    await Promise.all([a, b, c])

    assert.equal(callCount(), 1)
    assert.equal(gate.status.value, 'ready')
  })

  test('un ensureLoaded() après résolution ne refetch pas', async () => {
    const { gate, callCount } = build()

    await gate.ensureLoaded()
    await gate.ensureLoaded()

    assert.equal(callCount(), 1)
  })

  test('hasFeature reflète enabledFeatures une fois chargé', async () => {
    const { gate } = build({ account: PREMIUM })
    await gate.ensureLoaded()

    assert.equal(gate.hasFeature('white_label_branding'), true)
    assert.equal(gate.hasFeature('coach_page_premium_templates'), true)
    assert.deepEqual(gate.currentPlan.value, { slug: 'premium', name: 'Premium' })
  })

  test('hasFeature est faux pour une feature absente du plan Essentiel', async () => {
    const { gate } = build({ account: ESSENTIEL })
    await gate.ensureLoaded()

    assert.equal(gate.hasFeature('white_label_branding'), false)
    assert.equal(gate.hasFeature('lead_magnet'), true)
    assert.deepEqual(gate.currentPlan.value, {
      slug: 'essentiel',
      name: 'Essentiel'
    })
  })

  test('REGRESSION: avant chargement, hasFeature est faux (deny par défaut)', () => {
    // Un `hasFeature` optimiste afficherait brièvement une section premium à un
    // provider Essentiel.
    const { gate } = build({ account: PREMIUM })

    assert.equal(gate.status.value, 'unknown')
    assert.equal(gate.hasFeature('white_label_branding'), false)
  })

  test('invalidate() remet le gate à zéro et autorise un refetch (AC #6)', async () => {
    const { gate, callCount } = build()
    await gate.ensureLoaded()
    assert.equal(gate.status.value, 'ready')

    gate.invalidate()
    assert.equal(gate.status.value, 'unknown')
    assert.equal(gate.currentPlan.value, null)

    await gate.ensureLoaded()
    assert.equal(callCount(), 2)
  })

  test('REGRESSION: un fetch en échec passe en status error SANS lever, et verrouille', async () => {
    // Une panne réseau ne doit ni casser le rendu de la page, ni ouvrir une
    // section premium.
    const { gate } = build({ fail: true })

    await gate.ensureLoaded()

    assert.equal(gate.status.value, 'error')
    assert.equal(gate.hasFeature('white_label_branding'), false)
    assert.equal(gate.currentPlan.value, null)
  })

  test('la copie de enabledFeatures est détachée de la réponse API', async () => {
    const account: FeatureGateAccount = {
      plan: { slug: 'essentiel', name: 'Essentiel' },
      enabledFeatures: ['lead_magnet']
    }
    const { gate, state } = build({ account })
    await gate.ensureLoaded()

    assert.notEqual(state.value.enabledFeatures, account.enabledFeatures)
    assert.deepEqual(state.value.enabledFeatures, ['lead_magnet'])
  })
})
