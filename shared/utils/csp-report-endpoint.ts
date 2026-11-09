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
 * Trois niveaux de certitude, volontairement distingues :
 *
 * - **Injection verifiee dans le code** : `www.googletagmanager.com`
 *   (`app/features/consent/google-ads-runtime.ts`, chargement de `gtag/js`) et
 *   `*.clarity.ms` (`app/features/clarity/microsoft-clarity-runtime.ts`,
 *   chargement de `/tag/<id>`).
 * - **Chargements en cascade de gtag**, comportement documente de Google Ads :
 *   `www.googleadservices.com` et `googleads.g.doubleclick.net` — cette derniere
 *   apparait deja comme URL de conversion dans `consent-logic.ts`.
 * - **Injection a l'edge, hors du depot** : `static.cloudflareinsights.com`
 *   (KEOVA-WEB-3, arbitre le 2026-11-09). Cloudflare Web Analytics injecte
 *   lui-meme `beacon.min.js` dans le HTML servi ; aucune occurrence n'existe
 *   dans `app/`, `server/` ni `shared/` (verifie le 2026-11-08). C'est la seule
 *   entree qu'un grep du depot ne peut pas justifier : elle est constatee en
 *   production, et documentee ici pour que la prochaine lecture sache pourquoi.
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
 *
 * **Source unique.** C'est la seule liste d'origines tierces du depot : une
 * seconde liste (dans `nuxt.config.ts`, dans un plugin serveur, ou dans un
 * docblock) divergerait de celle-ci sans qu'aucun test ne le voie.
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
 * ## ⚠️ Un hash-source n'est jamais neutre (CSP3 §6.7.3.2)
 *
 * Des qu'un `sha256-...` figure dans `script-src`, l'algorithme « Does a source
 * list allow all inline behavior » rend « Does Not Allow » : **`'unsafe-inline'`
 * est alors ignore pour cette directive**, quelle que soit sa presence dans la
 * liste. Les deux figurent ci-dessous, mais seul le hash agit — tout script
 * inline dont le corps ne correspond pas exactement a ce hash est signale.
 * En Report-Only il est rapporte sans etre bloque : les scripts inline emis par
 * Nuxt (`window.__NUXT__`) et tout snippet tiers non hashe deviennent donc du
 * signal. C'est le prix du hash, pas un effet de bord neutre : le retirer tant
 * que `'unsafe-inline'` est present est une sortie legitime, hasher les scripts
 * inline restants en est une autre.
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

/**
 * Registre machine-readable des violations CSP arbitrees et toujours en force.
 *
 * D3 (obs-4) : un arbitrage n'est pas un commentaire. `SPEC.md` (FR7) exige que
 * le sort d'une violation soit « tranche et encode dans la configuration » ;
 * un commentaire ne se teste pas, ces donnees si. Le consommateur est
 * `tests/marketing/csp-report-endpoint.test.ts`, qui verifie trois choses :
 * chaque entree est complete et en force, `unsafe-eval` y figure, et **aucun
 * motif arbitre n'apparait dans `script-src`** (un arbitrage « filtre » qui
 * reapparaitrait dans la politique serait une autorisation deguisee).
 *
 * Regle d'entretien : **le registre ne contient que ce qui est encore vrai.**
 * Une violation corrigee en sort, elle n'y est pas archivee — c'est ce qui
 * empeche le registre de devenir un cimetiere. `static.cloudflareinsights.com`
 * n'y figure donc pas : elle a ete corrigee par l'allowlist (AC-1), pas
 * acceptee.
 */
export interface CspArbitration {
  /** Motif de la violation, tel qu'il se reconnait dans les rapports (cle courte, testable). */
  motif: string
  /** Titre de l'issue Sentry, verbatim, pour retrouver l'issue a partir du registre. */
  violation: string
  /** Directive CSP concernee. */
  directive: string
  /** Resolution retenue. Doit enoncer la decision, pas seulement la decrire. */
  resolution: string
  /** Date de l'arbitrage (ISO 8601, jour). */
  date: string
  /** Issue Sentry concernee, le cas echeant. */
  sentryIssue: string | null
  /** URL publique de cette issue, pour la personne qui devra re-arbitrer. */
  sentryIssueUrl: string | null
  /** Toujours en force. Une entree qui n'est plus vraie se supprime, elle ne se desactive pas. */
  inForce: boolean
}

export const CSP_ARBITRATION_REGISTRY: readonly CspArbitration[] = [
  {
    motif: 'unsafe-eval',
    violation: 'Blocked unsafe eval() \'script\'',
    directive: 'script-src',
    resolution:
      'Filtre, pas autorise : unsafe-eval n\'est pas ajoute a script-src (tiers non identifiable, un seul navigateur, non corrigeable cote application). Le bruit est ignore dans Sentry (KEOVA-WEB-5, mode forever).',
    date: '2026-11-09',
    sentryIssue: 'KEOVA-WEB-5',
    sentryIssueUrl: 'https://keova-6u.sentry.io/issues/KEOVA-WEB-5',
    inForce: true
  }
] as const
