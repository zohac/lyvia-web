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
  'https://clarity.ms'
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
export function buildCspReportOnlyPolicy(reportEndpoint: string): string {
  return [
    'default-src \'self\'',
    `script-src 'self' 'unsafe-inline' ${THIRD_PARTY_SCRIPT_ORIGINS.join(' ')}`,
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
