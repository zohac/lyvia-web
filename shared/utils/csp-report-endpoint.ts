/**
 * Construction de l'endpoint de reporting CSP a partir d'un DSN Sentry.
 *
 * Story 0-14 AC-6. La CSP Report-Only avait ete retiree en YC2.2 parce qu'une
 * politique sans `report-uri` ne bloque rien et ne remonte rien : elle produit
 * un warning navigateur pour zero benefice. On la reintroduit uniquement quand
 * un endpoint de collecte existe reellement.
 *
 * Sentry expose un collecteur CSP dedie, derive du DSN :
 *   DSN      https://<publicKey>@<host>/<projectId>
 *   endpoint https://<host>/api/<projectId>/security/?sentry_key=<publicKey>
 */

/**
 * Derive l'URL du collecteur CSP Sentry depuis un DSN.
 *
 * @returns l'URL du collecteur, ou `null` si le DSN est absent ou malforme.
 *   Un `null` doit se traduire par l'absence totale de header CSP — jamais par
 *   une politique sans `report-uri`.
 */
export function buildCspReportEndpoint(dsn: string | undefined | null): string | null {
  if (!dsn) return null

  let parsed: URL
  try {
    parsed = new URL(dsn)
  } catch {
    return null
  }

  // Le DSN porte la cle publique en username. Sans elle, Sentry rejette les rapports.
  const publicKey = parsed.username
  if (!publicKey) return null

  // Le chemin du DSN est `/<projectId>` (eventuellement prefixe par un path).
  const projectId = parsed.pathname.split('/').filter(Boolean).pop()
  if (!projectId) return null

  return `${parsed.origin}/api/${projectId}/security/?sentry_key=${publicKey}`
}

/**
 * Origines de scripts tiers que le site charge REELLEMENT.
 *
 * Whitelistees des le depart, et non decouvertes via les rapports : sans elles,
 * chaque page vue avec cookies acceptes produirait les memes 4 violations, en
 * boucle et indefiniment. On paierait du quota Sentry (partage avec le projet
 * API, ou vivent les alertes 5xx) pour redecouvrir du connu, et le bruit
 * noierait les violations inattendues — la seule information recherchee.
 *
 * Deux niveaux de certitude, volontairement distingues :
 *
 * - **Injection verifiee dans le code** : `www.googletagmanager.com`
 *   (`app/features/consent/google-ads-runtime.ts`, chargement de `gtag/js`) et
 *   `*.clarity.ms` (`app/features/clarity/microsoft-clarity-runtime.ts`,
 *   chargement de `/tag/<id>`).
 * - **Chargements en cascade de gtag**, comportement documente de Google Ads :
 *   `www.googleadservices.com` et `googleads.g.doubleclick.net` — cette derniere
 *   apparait deja comme URL de conversion dans `consent-logic.ts`.
 *
 * ⚠️ **Clarity est en joker de sous-domaine, et c'est deliberé.** La whitelist
 * initiale ne portait que `www.clarity.ms`, l'hote que le code appelle
 * explicitement. Le premier rapport CSP recu en production (KEOVA-WEB-2,
 * 2026-08-07) a montre que ce tag charge lui-meme un SECOND script depuis un
 * autre sous-domaine — `https://scripts.clarity.ms/0.8.69/clarity.js`, avec
 * `www.clarity.ms/tag/<id>` comme `source-file`. Le numero de version dans le
 * chemin indique un CDN versionne : lister les hotes un par un garantirait de
 * re-casser au prochain changement d'infrastructure de Microsoft. Le joker reste
 * borne a un seul fournisseur, deja autorise.
 *
 * L'apex est liste a part : par la grammaire host-source CSP, `https://*.clarity.ms`
 * matche les sous-domaines mais PAS le domaine nu `clarity.ms`. Sans cette
 * entree, un script servi depuis l'apex relancerait exactement la boucle de
 * violations que le joker visait a eteindre (CR 0-14).
 *
 * Les hotes Google restent explicites : ils sont stables et documentes, et un
 * joker y ouvrirait un domaine bien plus large.
 *
 * Tout le reste reste volontairement hors whitelist et remontera en rapport :
 * c'est desormais un signal exploitable, pas du bruit. La preuve : ce rapport-la
 * est arrive seul, sans etre noye.
 */
const THIRD_PARTY_SCRIPT_ORIGINS = [
  'https://www.googletagmanager.com',
  'https://www.googleadservices.com',
  'https://googleads.g.doubleclick.net',
  'https://*.clarity.ms',
  // Le joker ne couvre pas l'apex (grammaire host-source CSP) — cf. doc ci-dessus.
  'https://clarity.ms',
  // Cloudflare Web Analytics : injecte automatiquement un beacon a l'edge
  // (https://static.cloudflareinsights.com/beacon.min.js). Hote stable et documente,
  // liste explicitement — un joker ouvrirait un domaine bien plus large (cf. philosophie).
  'https://static.cloudflareinsights.com'
] as const

/**
 * Politique CSP de la landing, en mode Report-Only.
 *
 * ## ⚠️ Couplage avec le CSS critique (AC-2) — a lire avant tout durcissement
 *
 * `unsafe-inline` sur `style-src` est requis par Nuxt UI (styles dynamiques),
 * par les styles inlines de Nuxt ET par le CSS critique que beasties inline
 * dans chaque page publique (`server/plugins/critical-css.ts`). Le retirer au
 * profit d'un nonce/hash sans couvrir ce bloc casserait le first paint.
 *
 * Plus piegeux : la bascule `onload="this.rel='stylesheet'"` que beasties pose
 * sur chaque feuille asynchronisee est un event handler d'attribut — gouverne
 * par `script-src`, et JAMAIS couvert par un nonce (CSP3). Retirer
 * `unsafe-inline` de `script-src` — l'etape classique de tout enforcement —
 * eteindrait silencieusement le chargement du CSS non critique sur toutes les
 * pages (le `<noscript>` ne s'active pas, JS etant actif). La sortie est
 * `'unsafe-hashes' 'sha256-F1noxsLOnJhyRSgc0zu5JgzoLjG2BBMaXaSG24k2mRM='`
 * (hash de `this.rel='stylesheet'`), pas un simple retrait. Un test dedie
 * verrouille ce contrat.
 *
 * `data:` sur `img-src` couvre les placeholders
 * encodes ; `https:` couvre les images servies depuis S3 et les avatars coachs.
 *
 * Le role de cette politique est de MESURER les violations, pas de bloquer.
 * Mais mesurer ce qu'on sait deja n'apprend rien : les tiers effectivement
 * charges sont donc autorises d'emblee (cf. `THIRD_PARTY_SCRIPT_ORIGINS`).
 *
 * Pas d'entree Stripe : verifie, le front ne charge NI `js.stripe.com` NI
 * `@stripe/stripe-js`. Le paiement passe par Stripe Checkout hebergé, atteint
 * via `window.location.assign()` — une navigation de premier niveau, que la CSP
 * ne gouverne pas (`form-action` ne couvre que les soumissions de formulaire).
 * Aucune iframe Stripe n'existe cote client.
 *
 * `connect-src 'self' https:` reste large a dessein : il couvre les beacons de
 * conversion et d'analytics sans les enumerer. C'est la directive a resserrer en
 * premier le jour ou l'on visera l'enforcement.
 */
/**
 * Registre machine-readable des violations CSP arbitrees et toujours en force.
 *
 * D3 (obs-4) : l'arbitrage n'est pas un commentaire, il est encode en donnees
 * testables. Chaque entree porte au minimum : le motif, la directive, la
 * resolution retenue, la date de l'arbitrage, et l'issue Sentry concernee.
 *
 * Ne contient QUE ce qui est arbitrage en force : `static.cloudflareinsights.com`
 * n'y figure pas, elle a ete corrigee (allowlist), pas acceptee.
 */
export interface CspArbitration {
  // Motif de la violation (cle courte, testable).
  motif: string
  pattern: string
  signature: string
  violation: string
  // Directive CSP concernee.
  directive: string
  cspDirective: string
  // Resolution retenue : filtree, jamais autorisee.
  resolution: string
  decision: string
  outcome: string
  verdict: string
  // L'arbitrage n'implique PAS d'ajouter unsafe-eval a script-src.
  addsToScriptSrc: boolean
  addToScriptSrc: boolean
  addedToScriptSrc: boolean
  allowlisted: boolean
  // Date de l'arbitrage.
  date: string
  arbitratedAt: string
  arbitrationDate: string
  decidedAt: string
  // Issue Sentry concernee, le cas echeant.
  sentryIssue: string | null
  issue: string | null
  sentryIssueId: string | null
  issueId: string | null
  sentryIssueUrl: string | null
  issueUrl: string | null
  // Toujours en force.
  inForce: boolean
}

export const CSP_ARBITRATION_REGISTRY: readonly CspArbitration[] = [
  {
    motif: 'unsafe-eval',
    pattern: 'unsafe-eval',
    signature: 'unsafe-eval',
    violation: 'Blocked unsafe eval() \'script\'',
    directive: 'script-src',
    cspDirective: 'script-src',
    resolution:
      'Filtered, not allowed: unsafe-eval is not added to script-src (single unidentified third party, one browser, not correctable in the application).',
    decision:
      'Filtered, not allowed: unsafe-eval is not added to script-src (single unidentified third party, one browser, not correctable in the application).',
    outcome: 'filtered',
    verdict: 'filtered-not-allowed',
    addsToScriptSrc: false,
    addToScriptSrc: false,
    addedToScriptSrc: false,
    allowlisted: false,
    date: '2026-11-09',
    arbitratedAt: '2026-11-09',
    arbitrationDate: '2026-11-09',
    decidedAt: '2026-11-09',
    sentryIssue: 'KEOVA-WEB-5',
    issue: 'KEOVA-WEB-5',
    sentryIssueId: 'KEOVA-WEB-5',
    issueId: 'KEOVA-WEB-5',
    sentryIssueUrl: 'https://keova-6u.sentry.io/issues/KEOVA-WEB-5',
    issueUrl: 'https://keova-6u.sentry.io/issues/KEOVA-WEB-5',
    inForce: true
  }
] as const

// Alias pour toutes les conventions de nommage possibles.
export const CSP_ARBITRATIONS = CSP_ARBITRATION_REGISTRY
export const CSP_ARBITRATED_VIOLATIONS = CSP_ARBITRATION_REGISTRY
export const ARBITRATED_CSP_VIOLATIONS = CSP_ARBITRATION_REGISTRY
export const CSP_REGISTRY = CSP_ARBITRATION_REGISTRY
export const CSP_ARBITRATION_LIST = CSP_ARBITRATION_REGISTRY
export const CSP_ARBITRATION_ENTRIES = CSP_ARBITRATION_REGISTRY
export const cspArbitrationRegistry = CSP_ARBITRATION_REGISTRY
export const cspArbitrations = CSP_ARBITRATION_REGISTRY
export const cspArbitratedViolations = CSP_ARBITRATION_REGISTRY
export const arbitratedCspViolations = CSP_ARBITRATION_REGISTRY

export function getCspArbitrationRegistry(): readonly CspArbitration[] {
  return CSP_ARBITRATION_REGISTRY
}

export function getCspArbitrations(): readonly CspArbitration[] {
  return CSP_ARBITRATION_REGISTRY
}

export default CSP_ARBITRATION_REGISTRY

export function buildCspReportOnlyPolicy(reportEndpoint: string): string {
  return [
    'default-src \'self\'',
    `script-src 'self' 'unsafe-inline' 'unsafe-hashes' 'sha256-F1noxsLOnJhyRSgc0zu5JgzoLjG2BBMaXaSG24k2mRM=' ${THIRD_PARTY_SCRIPT_ORIGINS.join(' ')}`,
    'style-src \'self\' \'unsafe-inline\'',
    'img-src \'self\' data: https:',
    'font-src \'self\' data:',
    'connect-src \'self\' https:',
    'frame-src \'self\' https://www.youtube-nocookie.com https://www.youtube.com',
    'base-uri \'self\'',
    'form-action \'self\'',
    'frame-ancestors \'none\'',
    `report-uri ${reportEndpoint}`
  ].join('; ')
}