/**
 * Story 18.2 — Comportement de `createFeatureGate`, testé sur la factory réelle
 * avec un fetch factice (pattern `use-admin-waitlist.test.ts` / `yc3-1`).
 *
 * C'est le même code que celui qu'importe `useFeatureGate()` : aucune
 * réimplémentation dans les tests. Depuis la revue de code, la déduplication
 * est le MÊME module dans les deux cas (`createInFlightDeduper`) — le wrapper
 * ne fait qu'injecter l'instance partagée portée par `nuxtApp`.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ref, type Ref } from 'vue'

import {
  createFeatureGate,
  createInitialFeatureGateState,
  type FeatureGateAccount,
  type FeatureGateState
} from '../../app/features/plans/createFeatureGate'
import {
  createInFlightDeduper,
  type InFlightDeduper
} from '../../app/features/plans/in-flight-deduper'

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
  /** Nombre d'appels initiaux qui échouent (les suivants réussissent). */
  failTimes?: number
  /** Retarde la résolution pour tester la déduplication des appels concurrents. */
  defer?: boolean
  /** Déduper partagé — reproduit l'injection faite par `useFeatureGate()`. */
  dedupe?: InFlightDeduper
  /** État partagé — reproduit le `useState` de session. */
  state?: Ref<FeatureGateState>
} = {}) {
  const state: Ref<FeatureGateState>
    = options.state ?? ref<FeatureGateState>(createInitialFeatureGateState())
  let calls = 0
  let pending: Array<() => void> = []

  const fetchAccount = async (): Promise<FeatureGateAccount> => {
    calls += 1
    const attempt = calls
    if (options.defer) {
      await new Promise<void>((resolve) => {
        pending.push(resolve)
      })
    }
    if (options.fail) throw new Error('network down')
    if (options.failTimes && attempt <= options.failTimes) {
      throw new Error('network down')
    }
    return options.account ?? ESSENTIEL
  }

  const gate = createFeatureGate({ state, fetchAccount, dedupe: options.dedupe })
  return {
    gate,
    state,
    callCount: () => calls,
    /** Libère TOUS les fetchs différés en attente. */
    release: () => {
      const waiting = pending
      pending = []
      waiting.forEach(resolve => resolve())
    }
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

  test('REGRESSION: deux gates distincts partageant le déduper injecté ne font QU\'UN fetch', async () => {
    // Reproduit la production : `useFeatureGate()` construit une instance de
    // factory par appel (une par <FeatureGate>), mais leur injecte le MÊME
    // déduper (`nuxtApp.__lyvia_feature_gate__`) et le même `useState`. Avant
    // la revue, seule la déduplication interne à une instance était testée —
    // le mécanisme réellement embarqué ne l'était pas.
    const dedupe = createInFlightDeduper()
    const state: Ref<FeatureGateState> = ref(createInitialFeatureGateState())

    const first = build({ defer: true, dedupe, state })
    const second = build({ defer: true, dedupe, state })

    const a = first.gate.ensureLoaded()
    const b = second.gate.ensureLoaded()
    first.release()
    second.release()
    await Promise.all([a, b])

    // Un seul des deux fetchs a démarré : le second gate a rejoint la promesse.
    assert.equal(first.callCount() + second.callCount(), 1)
    assert.equal(first.gate.status.value, 'ready')
    assert.equal(second.gate.status.value, 'ready')
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

  test('REGRESSION: le status error est RÉCUPÉRABLE — un ensureLoaded() ultérieur refetch', async () => {
    // Avant la revue, la sortie anticipée portait sur « statut résolu » : un
    // blip réseau verrouillait toutes les sections gatées pour toute la session
    // SPA, et une coach Premium se voyait proposer de passer à Premium.
    const { gate, callCount } = build({ failTimes: 1, account: PREMIUM })

    await gate.ensureLoaded()
    assert.equal(gate.status.value, 'error')

    await gate.ensureLoaded()

    assert.equal(callCount(), 2)
    assert.equal(gate.status.value, 'ready')
    assert.equal(gate.hasFeature('white_label_branding'), true)
  })

  test('REGRESSION: invalidate() pendant un fetch en vol — la réponse périmée n\'écrase pas', async () => {
    // Le re-check de statut se fait AVANT l'await : sans jeton de génération,
    // la réponse pré-invalidation se réinstallait silencieusement en `ready`.
    const { gate, state, callCount, release } = build({
      defer: true,
      account: PREMIUM
    })

    const inFlight = gate.ensureLoaded()
    gate.invalidate()
    release()
    await inFlight

    assert.equal(state.value.status, 'unknown')
    assert.equal(state.value.plan, null)
    assert.equal(callCount(), 1)
  })

  test('REGRESSION: après invalidate() en vol, le prochain ensureLoaded() relance un VRAI fetch', async () => {
    // `invalidate()` doit aussi libérer le créneau de déduplication : sinon le
    // prochain appelant réattend la promesse périmée et reste bloqué en
    // `unknown`, sans jamais refetch.
    const { gate, callCount, release } = build({ defer: true, account: PREMIUM })

    const inFlight = gate.ensureLoaded()
    gate.invalidate()
    release()
    await inFlight

    const retried = gate.ensureLoaded()
    release()
    await retried

    assert.equal(callCount(), 2)
    assert.equal(gate.status.value, 'ready')
    assert.equal(gate.hasFeature('white_label_branding'), true)
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
