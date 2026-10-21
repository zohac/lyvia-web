import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it } from 'node:test'

import {
  isTrackingExemptPath,
  TRACKING_EXEMPT_PATHS
} from '../../app/features/tracking/tracking-exempt'

/**
 * R6 — `/preferences` ne doit exposer son token à aucun SDK tiers.
 *
 * Le token voyage dans la query string de la page (le fallback no-JS poste le
 * formulaire, donc le serveur doit pouvoir le rendre dans un champ caché).
 * Or les deux SDK du repo envoient l'URL de la page à un tiers :
 * `gtag('config', …)` porte `page_location`, et Clarity enregistre
 * `document.location.href`. Sans exemption, le token part chez Google et
 * chez Microsoft.
 *
 * Le repo n'a pas de runner Nuxt : l'orchestrateur (`tracking-mount.ts`)
 * n'est donc pas exécutable. La règle, elle, est pure et exécutée ; le
 * câblage est vérifié par lecture de source, comme les autres wiring tests.
 */

const appRoot = path.resolve(process.cwd(), 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

const TRACKING_MOUNT_SOURCE = readAppFile('features/tracking/tracking-mount.ts')
const TRACKING_PLUGIN_SOURCE = readAppFile('plugins/tracking.client.ts')
const NUXT_CONFIG = fs.readFileSync(path.join(process.cwd(), 'nuxt.config.ts'), 'utf-8')

describe('la règle d\'exemption', () => {
  it('exempte `/preferences`', () => {
    // La règle doit s'appliquer à CETTE page : c'est elle qui porte le token
    // dans l'URL.
    assert.equal(isTrackingExemptPath('/preferences'), true)
    assert.equal(TRACKING_EXEMPT_PATHS.includes('/preferences'), true)
  })

  it('tolère une barre oblique finale', () => {
    assert.equal(isTrackingExemptPath('/preferences/'), true)
  })

  it('n\'exempte que cette page — pas un préfixe', () => {
    // `/preferences-autre` est une AUTRE page : elle garde son analytics.
    assert.equal(isTrackingExemptPath('/preferences-autre'), false)
    assert.equal(isTrackingExemptPath('/preferences/recu'), false)
    assert.equal(isTrackingExemptPath('/'), false)
    assert.equal(isTrackingExemptPath('/coach/sophie'), false)
  })

  it('ne s\'applique à rien quand le chemin est absent', () => {
    assert.equal(isTrackingExemptPath(''), false)
    assert.equal(isTrackingExemptPath(null), false)
    assert.equal(isTrackingExemptPath(undefined), false)
  })
})

describe('l\'orchestrateur respecte l\'exemption', () => {
  it('interroge la règle d\'exemption', () => {
    assert.match(TRACKING_MOUNT_SOURCE, /isTrackingExemptPath\(/)
  })

  it('interroge la règle AVANT tout montage de SDK, et sort', () => {
    const guardIndex = TRACKING_MOUNT_SOURCE.indexOf('isTrackingExemptPath(')
    const adsIndex = TRACKING_MOUNT_SOURCE.indexOf('mountGoogleAds')
    const clarityIndex = TRACKING_MOUNT_SOURCE.indexOf('mountMicrosoftClarity')

    assert.ok(guardIndex > -1, 'la garde d\'exemption est introuvable')
    assert.ok(adsIndex > guardIndex, 'Google Ads doit être monté APRÈS la garde')
    assert.ok(clarityIndex > guardIndex, 'Clarity doit être monté APRÈS la garde')

    // La garde doit COUPURE le chemin : sans `return` entre la garde et le
    // montage, le SDK serait injecté quand même.
    const between = TRACKING_MOUNT_SOURCE.slice(guardIndex, adsIndex)
    assert.match(between, /\breturn\b/, 'la garde doit sortir avant le montage')
  })

  it('passe par l\'orchestrateur sur le premier montage ET sur les navigations', () => {
    // Sans cela, la garde ne vaudrait qu'au premier rendu : une navigation
    // vers la page réinjecterait les SDK.
    assert.match(TRACKING_PLUGIN_SOURCE, /app:mounted/)
    assert.match(TRACKING_PLUGIN_SOURCE, /page:finish/)
    assert.match(TRACKING_PLUGIN_SOURCE, /m\.mountTracking\(\)/)
    assert.equal(
      (TRACKING_PLUGIN_SOURCE.match(/void mount\(\)/g) ?? []).length,
      2,
      'les deux hooks doivent passer par mountTracking'
    )
  })
})

describe('le Referer ne doit jamais porter le token', () => {
  it('`/preferences` est servi en `no-referrer`', () => {
    const rule = NUXT_CONFIG.slice(NUXT_CONFIG.indexOf('\'/preferences\': {'))
    assert.match(
      rule.slice(0, 400),
      /'Referrer-Policy':\s*'no-referrer'/,
      'la page du token ne doit pas exposer son URL en Referer'
    )
  })

  it('le contrat global ne protège pas ce cas', () => {
    // `strict-origin-when-cross-origin` ne retire la query string que pour une
    // requête CROSS-origin. Une requête same-origin (un asset, un appel API,
    // un lien du même site) reçoit encore l'URL complète — token compris.
    // C'est pourquoi la route a besoin de sa propre règle.
    const globalRule = NUXT_CONFIG.slice(NUXT_CONFIG.indexOf('\'/**\': {'))
    assert.match(
      globalRule.slice(0, 400),
      /'Referrer-Policy':\s*'strict-origin-when-cross-origin'/
    )
  })

  it('la règle de la page est plus spécifique que le contrat global', () => {
    // Nitro fusionne les routeRules : la règle la plus spécifique gagne sur
    // la même clé d'en-tête. La règle de `/preferences` doit donc être
    // déclarée, et pas seulement espérée.
    const globalIndex = NUXT_CONFIG.indexOf('\'/**\': {')
    const pageIndex = NUXT_CONFIG.indexOf('\'/preferences\': {')

    assert.ok(globalIndex > -1 && pageIndex > -1)
    assert.ok(pageIndex > globalIndex, 'la règle de la page doit être déclarée')
  })
})
