/**
 * Story 18.2 — Tests structurels de la branche 403 `FEATURE_NOT_AVAILABLE`
 * dans `apiFetch.ts` et du garde anti-spam de `feature-gate-toast.ts`.
 *
 * `apiFetch` dépend d'auto-imports Nuxt (`useRuntimeConfig`, `useNuxtApp`,
 * `$fetch`) : il n'est pas compilable par le runner Node. Ces tests lisent donc
 * la source réelle — même approche que `coach-page-branding.test.ts`.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

const appRoot = path.resolve(process.cwd(), 'app')

function readApiFetch(): string {
  return fs.readFileSync(path.join(appRoot, 'services/api/apiFetch.ts'), 'utf8')
}

function readToastModule(): string {
  return fs.readFileSync(
    path.join(appRoot, 'features/plans/feature-gate-toast.ts'),
    'utf8'
  )
}

describe('apiFetch — branche FEATURE_NOT_AVAILABLE', () => {
  test('la branche existe, gardée import.meta.client + statut 403 + code exact', () => {
    const source = readApiFetch()
    assert.match(
      source,
      /import\.meta\.client\s*\n?\s*&&\s*statusCode === 403\s*\n?\s*&&\s*isErrorResponse\(data\)\s*\n?\s*&&\s*data\.code === 'FEATURE_NOT_AVAILABLE'/
    )
    assert.match(source, /notifyFeatureGate\(nuxtApp\)/)
  })

  test('REGRESSION: le toast ne remplace pas le throw — l\'ApiFetchError est toujours relancée', () => {
    const source = readApiFetch()
    const branchIndex = source.indexOf('data.code === \'FEATURE_NOT_AVAILABLE\'')
    assert.ok(branchIndex > 0, 'branche 403 introuvable')

    // Après la notification, le flux normal doit reprendre : le bloc générique
    // `if (isErrorResponse(data)) { throw new ApiFetchError(...) }` suit.
    const after = source.slice(branchIndex)
    assert.match(
      after,
      /if \(isErrorResponse\(data\)\) \{\s*throw new ApiFetchError\(/
    )
    // Et surtout : aucun `return` ne court-circuite le throw.
    const notifyIndex = after.indexOf('notifyFeatureGate(nuxtApp)')
    const throwIndex = after.indexOf('throw new ApiFetchError')
    assert.ok(
      notifyIndex < throwIndex,
      'notifyFeatureGate doit précéder le throw, pas le remplacer'
    )
    assert.doesNotMatch(
      after.slice(notifyIndex, throwIndex),
      /\breturn\b/,
      'aucun return ne doit court-circuiter le throw après le toast'
    )
  })

  test('REGRESSION: le contexte Nuxt est capturé AVANT le try (piège instance unavailable)', () => {
    const source = readApiFetch()
    const captureIndex = source.indexOf('const nuxtApp = captureNuxtApp()')
    assert.ok(captureIndex > 0, 'capture du contexte introuvable')

    const tryIndex = source.indexOf('  try {', captureIndex)
    assert.ok(
      tryIndex > captureIndex,
      'captureNuxtApp() doit précéder le try d\'apiFetch'
    )
    // La capture est tolérante : hors cycle Nuxt, elle rend null au lieu de lever.
    assert.match(source, /function captureNuxtApp\(\)[\s\S]*?catch \{\s*return null\s*\}/)
  })

  test('la branche 403 est placée après le bloc 401 (refresh prioritaire)', () => {
    const source = readApiFetch()
    const block401 = source.indexOf('if (statusCode === 401 && withAuth && retryOn401)')
    const block403 = source.indexOf('data.code === \'FEATURE_NOT_AVAILABLE\'')
    assert.ok(block401 > 0 && block403 > block401)
  })
})

describe('feature-gate-toast — garde anti-spam et contexte', () => {
  test('REGRESSION: cooldown de 3 s en module-scope', () => {
    const source = readToastModule()
    assert.match(source, /const TOAST_COOLDOWN_MS = 3_000/)
    assert.match(source, /let lastNotifiedAt = 0/)
    assert.match(source, /if \(now - lastNotifiedAt < TOAST_COOLDOWN_MS\) return/)
  })

  test('le toast passe par runWithContext et sort si aucun contexte n\'est disponible', () => {
    const source = readToastModule()
    assert.match(source, /if \(!context\) return/)
    assert.match(source, /context\.runWithContext\(\(\) => \{/)
  })

  test('REGRESSION: un contexte de repli est enregistré par un plugin client', () => {
    // Découvert en vérification browser : `useNuxtApp()` lève « instance
    // unavailable » quand apiFetch part d'un gestionnaire d'événement — cas de
    // TOUS les appels gatés (clic « Enregistrer », upload). Sans ce repli, le
    // toast ne s'affiche jamais alors que le 403 arrive bien.
    const source = readToastModule()
    assert.match(source, /let registeredNuxtApp/)
    assert.match(source, /export function registerFeatureGateToastContext/)
    assert.match(source, /const context = nuxtApp \?\? registeredNuxtApp/)

    const plugin = fs.readFileSync(
      path.join(appRoot, 'plugins/feature-gate-toast.client.ts'),
      'utf8'
    )
    assert.match(plugin, /export default defineNuxtPlugin\(\(nuxtApp\) => \{/)
    assert.match(plugin, /registerFeatureGateToastContext\(nuxtApp\)/)
  })

  test('wording et CTA importés du domaine, jamais réécrits', () => {
    const source = readToastModule()
    assert.match(source, /from '\.\/domain\/feature-gate-copy'/)
    assert.match(source, /title: FEATURE_GATE_TOAST_TITLE/)
    assert.match(source, /color: 'error'/)
    assert.match(source, /label: FEATURE_GATE_CTA_LABEL/)
    assert.match(source, /window\.location\.href = KEOVA_CONTACT_MAILTO/)
    assert.doesNotMatch(source, /Cette fonctionnalité nécessite/)
    assert.doesNotMatch(source, /contact@keova\.fr/)
  })
})
