/**
 * Story 18.2 (CR) — Comportement du déduper de promesse en vol.
 *
 * Ce module porte la déduplication réellement embarquée : `useFeatureGate()`
 * en stocke une instance sur `nuxtApp` et l'injecte dans chaque factory. Avant
 * l'extraction, il vivait inline dans le wrapper — hors `tsconfig.tests.json`,
 * donc intestable.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  createInFlightDeduper,
  NOOP_IN_FLIGHT_DEDUPER
} from '../../app/features/plans/in-flight-deduper'

/** Promesse dont la résolution est pilotée par le test. */
function deferred(): { promise: Promise<void>, resolve: () => void } {
  const handlers = { resolve: () => {} }
  const promise = new Promise<void>((res) => {
    handlers.resolve = res
  })
  return { promise, resolve: () => handlers.resolve() }
}

/** Tâche dont la résolution est pilotée par le test. */
function deferredTask() {
  let calls = 0
  let resolvers: Array<() => void> = []

  const task = () => {
    calls += 1
    return new Promise<void>((resolve) => {
      resolvers.push(resolve)
    })
  }

  return {
    task,
    callCount: () => calls,
    release: () => {
      const waiting = resolvers
      resolvers = []
      waiting.forEach(resolve => resolve())
    }
  }
}

describe('createInFlightDeduper', () => {
  test('REGRESSION: N run() concurrents n\'exécutent la tâche QU\'UNE fois', async () => {
    const deduper = createInFlightDeduper()
    const { task, callCount, release } = deferredTask()

    const a = deduper.run(task)
    const b = deduper.run(task)
    const c = deduper.run(task)
    release()
    await Promise.all([a, b, c])

    assert.equal(callCount(), 1)
  })

  test('les appelants concurrents reçoivent la MÊME promesse', () => {
    const deduper = createInFlightDeduper()
    const { task, release } = deferredTask()

    const a = deduper.run(task)
    const b = deduper.run(task)
    assert.equal(a, b)

    release()
    return a
  })

  test('le créneau se libère après résolution : un run() ultérieur réexécute', async () => {
    const deduper = createInFlightDeduper()
    const { task, callCount, release } = deferredTask()

    const first = deduper.run(task)
    release()
    await first

    const second = deduper.run(task)
    release()
    await second

    assert.equal(callCount(), 2)
  })

  test('le créneau se libère aussi après un rejet', async () => {
    const deduper = createInFlightDeduper()
    let calls = 0
    const failing = () => {
      calls += 1
      return Promise.reject(new Error('boom'))
    }

    await assert.rejects(() => deduper.run(failing))
    await assert.rejects(() => deduper.run(failing))

    assert.equal(calls, 2)
  })

  test('REGRESSION: reset() libère le créneau sans attendre la tâche en vol', async () => {
    // C'est ce qui permet à `invalidate()` de relancer un VRAI fetch au lieu de
    // réattendre la promesse périmée.
    const deduper = createInFlightDeduper()
    const { task, callCount, release } = deferredTask()

    const stale = deduper.run(task)
    deduper.reset()
    const fresh = deduper.run(task)

    assert.notEqual(stale, fresh)
    assert.equal(callCount(), 2)

    release()
    await Promise.all([stale, fresh])
  })

  test('REGRESSION: la tâche périmée n\'efface pas le créneau de sa remplaçante', async () => {
    // Sans garde d'identité, la résolution de la promesse d'avant le `reset()`
    // remettait `current` à null et un 3ᵉ appelant relançait un fetch de plus.
    const deduper = createInFlightDeduper()

    let calls = 0
    const staleTask = deferred()
    const freshTask = deferred()

    const stale = deduper.run(() => {
      calls += 1
      return staleTask.promise
    })

    deduper.reset()

    const fresh = deduper.run(() => {
      calls += 1
      return freshTask.promise
    })

    // La périmée se résout la première : elle ne doit pas libérer le créneau.
    staleTask.resolve()
    await stale

    const joined = deduper.run(() => {
      calls += 1
      return Promise.resolve()
    })
    assert.equal(joined, fresh, 'un nouvel appelant doit rejoindre la tâche courante')
    assert.equal(calls, 2)

    freshTask.resolve()
    await fresh
  })
})

describe('NOOP_IN_FLIGHT_DEDUPER', () => {
  test('REGRESSION: n\'exécute jamais la tâche (garde SSR)', async () => {
    // Côté serveur aucun token n'est en mémoire : un GET /provider/account
    // répondrait 401 et verrouillerait le gate pour rien.
    let calls = 0
    await NOOP_IN_FLIGHT_DEDUPER.run(() => {
      calls += 1
      return Promise.resolve()
    })

    assert.equal(calls, 0)
  })
})
