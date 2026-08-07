import * as assert from 'node:assert/strict'
import test from 'node:test'

import { buildCspReportEndpoint, buildCspReportOnlyPolicy } from '../../shared/utils/csp-report-endpoint'

// ============================================================================
// Story 0-14 AC-6 — endpoint de reporting CSP derive du DSN Sentry
// ============================================================================

// --- Absence de DSN : aucun endpoint, donc aucun header ----------------------
// C'est le cas nominal aujourd'hui (NUXT_PUBLIC_SENTRY_DSN vide). Le contrat
// est strict : pas d'endpoint => pas de CSP du tout. Une politique Report-Only
// sans report-uri est precisement ce qui avait ete retire en YC2.2.

test('DSN absent (undefined) → null', () => {
  assert.equal(buildCspReportEndpoint(undefined), null)
})

test('DSN vide → null', () => {
  assert.equal(buildCspReportEndpoint(''), null)
})

test('DSN malforme (pas une URL) → null', () => {
  assert.equal(buildCspReportEndpoint('pas-un-dsn'), null)
})

test('DSN sans cle publique → null (Sentry rejetterait les rapports)', () => {
  assert.equal(buildCspReportEndpoint('https://o123.ingest.sentry.io/456'), null)
})

test('DSN sans projectId → null', () => {
  assert.equal(buildCspReportEndpoint('https://abc123@o1.ingest.sentry.io/'), null)
})

// --- DSN valide --------------------------------------------------------------

test('DSN valide → endpoint /api/<projectId>/security/ avec sentry_key', () => {
  const endpoint = buildCspReportEndpoint('https://abc123def@o456.ingest.sentry.io/789')

  assert.equal(
    endpoint,
    'https://o456.ingest.sentry.io/api/789/security/?sentry_key=abc123def'
  )
})

test('DSN self-hosted avec port → origine preservee', () => {
  const endpoint = buildCspReportEndpoint('https://key@sentry.interne.fr:9000/42')

  assert.equal(
    endpoint,
    'https://sentry.interne.fr:9000/api/42/security/?sentry_key=key'
  )
})

test('DSN avec path prefixe → projectId = dernier segment', () => {
  const endpoint = buildCspReportEndpoint('https://key@sentry.example.com/prefix/99')

  assert.equal(
    endpoint,
    'https://sentry.example.com/api/99/security/?sentry_key=key'
  )
})

// --- Politique ---------------------------------------------------------------

test('la politique embarque le report-uri fourni', () => {
  const policy = buildCspReportOnlyPolicy('https://sentry.example.com/api/1/security/?sentry_key=k')

  assert.ok(policy.includes('report-uri https://sentry.example.com/api/1/security/?sentry_key=k'))
})

test('la politique autorise unsafe-inline sur style-src (requis par Nuxt UI)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  assert.ok(policy.includes('style-src \'self\' \'unsafe-inline\''))
})

test('la politique autorise les iframes YouTube nocookie (video demo 0-35)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  assert.ok(policy.includes('https://www.youtube-nocookie.com'))
})

test('la politique autorise les images https (S3, photos coachs)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  assert.ok(policy.includes('img-src \'self\' data: https:'))
})

test('la politique interdit le framing du site (frame-ancestors none)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  assert.ok(policy.includes('frame-ancestors \'none\''))
})

// --- Tiers whitelistes d'emblee ----------------------------------------------
// Sans eux, chaque page vue avec cookies acceptes reproduirait les memes
// violations en boucle : quota Sentry consomme (partage avec le projet API et
// ses alertes 5xx) pour redecouvrir du connu, et bruit qui noie l'inattendu.

test('script-src autorise les tiers reellement charges par le site', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const scriptSrc = policy.split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')

  // Injections verifiees dans le code.
  assert.ok(scriptSrc.includes('https://www.googletagmanager.com'), 'gtag (google-ads-runtime.ts)')
  assert.ok(scriptSrc.includes('https://*.clarity.ms'), 'Clarity (microsoft-clarity-runtime.ts)')
  // Chargements en cascade de gtag (Google Ads).
  assert.ok(scriptSrc.includes('https://www.googleadservices.com'))
  assert.ok(scriptSrc.includes('https://googleads.g.doubleclick.net'))
})

// Regression du premier rapport CSP recu en production (KEOVA-WEB-2, 2026-08-07).
// `www.clarity.ms/tag/<id>` charge lui-meme `scripts.clarity.ms/<version>/clarity.js` :
// une whitelist limitee a `www.clarity.ms` laissait donc passer une violation a
// chaque page vue avec cookies acceptes. Ce test tombe si quelqu'un ressert le
// joker en un hote unique.
test('Clarity est autorise sur tous ses sous-domaines, pas seulement www', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const scriptSrc = policy.split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')

  assert.ok(scriptSrc.includes('https://*.clarity.ms'))
  // Le joker rend l'entree exacte `https://www.clarity.ms` superflue : sa presence
  // signalerait un retour en arriere partiel.
  assert.ok(!scriptSrc.includes('https://www.clarity.ms'))
})

test('les hotes Google restent explicites (pas de joker sur googleapis/doubleclick)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const scriptSrc = policy.split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')

  // Un joker sur les domaines Google ouvrirait bien plus large que le besoin :
  // ils sont stables et documentes, donc enumerables.
  assert.ok(!scriptSrc.includes('https://*.google'))
  assert.ok(!scriptSrc.includes('https://*.doubleclick.net'))
})

test('script-src conserve self et unsafe-inline en plus des tiers', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  // Elargir la whitelist ne doit jamais faire perdre la base : gtag pose des
  // snippets inline, et l'app sert ses propres scripts.
  assert.match(policy, /script-src 'self' 'unsafe-inline' https:/)
})

test('aucune origine Stripe n\'est whitelistee (le front ne charge pas Stripe.js)', () => {
  const policy = buildCspReportOnlyPolicy('https://e')

  // Verifie : ni `@stripe/stripe-js` en dependance, ni `js.stripe.com` dans le
  // code. Le checkout est atteint par `window.location.assign()`, hors CSP.
  // Ce test tombe si quelqu'un ajoute Stripe a la whitelist sans que le front
  // charge quoi que ce soit — une permission gratuite est une regression.
  assert.doesNotMatch(policy, /stripe/i)
})

test('les tiers sont autorises sur script-src uniquement, pas sur frame-src', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const frameSrc = policy.split('; ').find(d => d.startsWith('frame-src '))
  if (!frameSrc) throw new Error('directive frame-src absente de la politique')

  // Seul YouTube (video demo 0-35) est autorise en iframe. Une eventuelle
  // iframe injectee par gtag doit remonter en rapport, pas etre pre-autorisee
  // sur simple presomption.
  assert.doesNotMatch(frameSrc, /googletagmanager|doubleclick|clarity/)
})
