import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

// ============================================================================
// Story 0-14: Optimisations techniques — perf, sécurité, cleanup landing
//
// Tests structurels sur `nuxt.config.ts`. Les routeRules ne sont pas du code
// exécutable testable unitairement (le fichier est un `defineNuxtConfig` avec
// des globals Nuxt non résolvables hors build), donc on assert sur la source.
// Même pattern que les tests structurels admin (0-30).
// ============================================================================

// Les tests sont compilés vers `.tmp/test-dist/tests/...` : `__dirname` ne
// pointe donc pas sur l'arborescence source. On résout depuis la racine du
// projet (cwd = racine quand `pnpm test:unit` tourne).
const configPath = join(process.cwd(), 'nuxt.config.ts')
const config = readFileSync(configPath, 'utf-8')

// --- AC-3: cache IPX ---------------------------------------------------------
// Les images transformées par IPX sont déterministes (même URL → même output).
// Sans routeRule, IPX sert `s-maxage=60` → Cloudflare refetch toutes les 60 s.

test('AC-3: une routeRule cible les images IPX transformées', () => {
  assert.ok(
    config.includes('\'/_ipx/**\''),
    'nuxt.config.ts doit déclarer une routeRule `/_ipx/**`'
  )
})

test('AC-3: le Cache-Control IPX applique 24 h navigateur / 1 h CDN / immutable', () => {
  const ipxRule = config.slice(config.indexOf('\'/_ipx/**\''))
  const cacheControl = ipxRule.match(/'Cache-Control': '([^']+)'/)?.[1]

  assert.equal(cacheControl, 'public, max-age=86400, s-maxage=3600, immutable')
})

test('AC-3: la routeRule IPX ne casse pas le cache des images statiques', () => {
  // `/images/**` (0-12 AC-3) reste immutable 1 an — les deux règles coexistent.
  const staticRule = config.slice(config.indexOf('\'/images/**\''))
  const cacheControl = staticRule.match(/'Cache-Control': '([^']+)'/)?.[1]

  assert.equal(cacheControl, 'public, max-age=31536000, immutable')
})

// --- AC-2: critical CSS ------------------------------------------------------
// AC-2 est livrée par le plugin Nitro `server/plugins/critical-css.ts` (beasties)
// — PAS par ce module, inopérant en Nuxt 4 (il ne réécrit que les routes
// prérendues, cf. doc du plugin). Le module reste déclaré par décision de
// périmètre 0-14 ; `beasties` est une dépendance directe depuis la CR 0-14,
// ce module n'est donc plus son porteur dans le lockfile.

test('AC-2: le module critters reste déclaré (décision périmètre 0-14)', () => {
  assert.ok(
    config.includes('\'@nuxtjs/critters\''),
    'nuxt.config.ts doit conserver `@nuxtjs/critters` dans `modules` (décision périmètre 0-14)'
  )
})

// CR 0-14 : beasties est importé au runtime par le plugin critical-css. En
// transitif seul (via critters + hoisting), un retrait de critters l'aurait
// fait disparaître du lockfile — extinction SILENCIEUSE d'AC-2 (dégradation
// rattrapée, aucun crash). Il doit rester une dépendance directe, et inlinée
// dans le bundle serveur (même mécanique anti-pruning Scalingo que unhead).

test('AC-2: beasties est une dépendance directe, inlinée dans le bundle serveur', () => {
  const pkg = readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
  const dependencies = (JSON.parse(pkg) as { dependencies?: Record<string, string> }).dependencies ?? {}

  assert.ok('beasties' in dependencies, 'package.json doit déclarer beasties en dependencies')
  const externalsInline = config.slice(config.indexOf('externals'))
  assert.match(externalsInline, /inline:\s*\[[^\]]*'beasties'/, 'nitro.externals.inline doit contenir beasties')
})

// --- AC-6: CSP Report-Only conditionnée à un collecteur ----------------------
// Une politique Report-Only sans `report-uri` ne bloque rien et ne remonte rien :
// elle génère un warning navigateur pour zéro bénéfice (motif du retrait YC2.2).
// La règle n'est donc pas « pas de Report-Only » mais « jamais de Report-Only
// sans endpoint ». Ces tests verrouillent ce couplage.

test('AC-6: le header Report-Only n\'est jamais émis en dur', () => {
  // Il doit passer par le spread conditionnel, jamais être écrit littéralement
  // dans le bloc `headers` — sinon il serait présent même sans collecteur.
  const headerInRouteRules = /'Content-Security-Policy-Report-Only':\s*'/.test(config)

  assert.equal(
    headerInRouteRules,
    false,
    'le header doit être injecté via `...cspReportOnly`, pas en littéral'
  )
})

test('AC-6: la CSP est injectée via le spread conditionnel', () => {
  assert.ok(
    config.includes('...cspReportOnly'),
    'nuxt.config.ts doit spreader `cspReportOnly` dans les headers de `/**`'
  )
})

test('AC-6: le collecteur est dérivé du DSN Sentry', () => {
  assert.ok(
    config.includes('buildCspReportEndpoint(process.env.NUXT_PUBLIC_SENTRY_DSN)'),
    'l\'endpoint doit venir de NUXT_PUBLIC_SENTRY_DSN — pas d\'URL codée en dur'
  )
})
