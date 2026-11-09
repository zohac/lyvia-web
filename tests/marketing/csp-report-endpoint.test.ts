import * as assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import test from 'node:test'

import {
  buildCspReportEndpoint,
  buildCspReportOnlyPolicy,
  CSP_ARBITRATION_REGISTRY,
  CSP_BEASTIES_ONLOAD_HASH
} from '../../shared/utils/csp-report-endpoint'

// Les sources de `script-src`, tokenisees (cf. CR 0-14 : un `includes` sur la
// directive entiere matche aussi le prefixe d'une origine).
function scriptSources(): string[] {
  const scriptSrc = buildCspReportOnlyPolicy('https://e').split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')
  return scriptSrc.replace('script-src ', '').split(' ')
}

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

// CR 0-14 : par la grammaire host-source CSP, `https://*.clarity.ms` matche les
// sous-domaines mais PAS le domaine nu. Sans l'apex, un script servi depuis
// `clarity.ms` relancerait la boucle de violations que le joker visait a eteindre.
test('l\'apex clarity.ms est couvert en plus du joker de sous-domaines', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const scriptSrc = policy.split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')

  assert.ok(scriptSrc.includes('https://clarity.ms'), 'l\'apex doit etre liste a part du joker')
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
  const scriptSrc = policy.split('; ').find(d => d.startsWith('script-src '))
  if (!scriptSrc) throw new Error('directive script-src absente de la politique')
  const sources = scriptSrc.replace('script-src ', '').split(' ')

  // Elargir la whitelist ne doit jamais faire perdre la base : gtag pose des
  // snippets inline, et l'app sert ses propres scripts.
  assert.ok(sources.includes('\'self\''))
  assert.ok(sources.includes('\'unsafe-inline\''))
  // CR 0-14 : l'ancienne assertion (`/script-src 'self' 'unsafe-inline' https:/`)
  // matchait aussi le PREFIXE des origines enumerees — elle aurait valide un
  // scheme-source `https:` nu, qui autorise n'importe quel script https : la
  // pire regression possible de la directive. On tokenise donc.
  assert.ok(!sources.includes('https:'), 'un scheme-source https: nu est interdit')
})

// CR 0-14 — couplage AC-2 ↔ AC-6. beasties pose `onload="this.rel='stylesheet'"`
// sur chaque feuille asynchronisee : un event handler d'attribut, gouverne par
// script-src et JAMAIS couvert par un nonce (CSP3). Le CSS critique inline
// depend lui de style-src. Ce test tombe si un durcissement retire
// `unsafe-inline` sans poser l'equivalent — ce qui eteindrait silencieusement
// le chargement du CSS non critique sur toutes les pages publiques.
test('durcir unsafe-inline exige un equivalent pour la bascule onload de beasties', () => {
  const policy = buildCspReportOnlyPolicy('https://e')
  const directive = (name: string) => policy.split('; ').find(d => d.startsWith(`${name} `)) ?? ''

  const scriptSrc = directive('script-src')
  const scriptCoversOnload = scriptSrc.includes('\'unsafe-inline\'')
    || (scriptSrc.includes('\'unsafe-hashes\'')
      && scriptSrc.includes('\'sha256-F1noxsLOnJhyRSgc0zu5JgzoLjG2BBMaXaSG24k2mRM=\''))
  assert.ok(
    scriptCoversOnload,
    'script-src doit couvrir les handlers onload de beasties : unsafe-inline, ou unsafe-hashes + le hash de this.rel=\'stylesheet\''
  )

  const styleSrc = directive('style-src')
  const styleCoversInline = styleSrc.includes('\'unsafe-inline\'')
    || styleSrc.includes('\'sha256-')
    || styleSrc.includes('\'nonce-')
  assert.ok(styleCoversInline, 'style-src doit couvrir le CSS critique inline par beasties')
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

// --- OBS.4 AC-1 : allowlist Cloudflare Insights, hote exact -------------------
// `THIRD_PARTY_SCRIPT_ORIGINS` n'est pas exportee : on assertit l'artefact
// produit (la politique), ce qui couvre a la fois son contenu et sa place.

test('AC-1: script-src autorise l\'hote exact static.cloudflareinsights.com', () => {
  assert.ok(scriptSources().includes('https://static.cloudflareinsights.com'))
})

test('AC-1: l\'entree Cloudflare est l\'hote exact, sous aucune autre forme', () => {
  // La forme est assertee, pas seulement la presence : `https://*.cloudflareinsights.com`,
  // `*.cloudflareinsights.com` ou une variante avec port ouvrirait tout le
  // domaine d'un hote stable et documente (philosophie du fichier).
  // `deepEqual` sur la liste complete rend le test rouge des qu'une autre
  // graphie apparait, pas seulement pour le joker canonique.
  const cloudflare = scriptSources().filter(s => s.includes('cloudflareinsights'))
  assert.deepEqual(cloudflare, ['https://static.cloudflareinsights.com'])
})

// --- OBS.4 AC-2 : registre d'arbitrations -----------------------------------

// L'invariant « chaque entree porte au minimum ... » doit valoir pour la
// DEUXIEME entree aussi : un test qui ne regarde que `unsafe-eval` laisserait
// passer une entree future vide, donc un arbitrage non ecrit.
test('AC-2: chaque entree du registre est complete et toujours en force', () => {
  assert.ok(CSP_ARBITRATION_REGISTRY.length > 0, 'le registre ne peut pas etre vide')

  for (const entry of CSP_ARBITRATION_REGISTRY) {
    assert.ok(entry.motif, `motif manquant : ${JSON.stringify(entry)}`)
    assert.ok(entry.violation, `titre Sentry manquant pour ${entry.motif}`)
    assert.ok(entry.directive, `directive manquante pour ${entry.motif}`)
    assert.ok(entry.resolution, `resolution manquante pour ${entry.motif}`)
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `date non ISO 8601 pour ${entry.motif}`)
    assert.equal(entry.inForce, true, `entree plus en force (${entry.motif}) : elle doit etre supprimee`)
    if (entry.sentryIssue) {
      assert.ok(entry.sentryIssueUrl, `URL Sentry manquante pour ${entry.sentryIssue}`)
    }
  }
})

test('AC-2: le registre contient unsafe-eval avec une resolution qui ne l\'autorise pas', () => {
  const entry = CSP_ARBITRATION_REGISTRY.find(e => e.motif === 'unsafe-eval')
  if (!entry) throw new Error('entree unsafe-eval absente du registre')

  assert.equal(entry.directive, 'script-src')
  assert.equal(entry.sentryIssue, 'KEOVA-WEB-5')
  // La resolution doit enoncer la decision, pas la decrire mollement : c'est
  // elle qui doit tenir debout le jour ou quelqu'un rouvre le dossier.
  assert.match(entry.resolution, /pas ajoute a script-src|not added to script-src/i)
})

test('AC-2: aucun motif arbitre ne reapparait dans script-src', () => {
  // C'est l'invariant qui rend le registre falsifiable : un arbitrage « filtre,
  // pas autorise » qui reapparaitrait dans la politique serait une autorisation
  // silencieuse.
  // Les mots-cles CSP sont ecrits entre quotes dans la politique (`'unsafe-eval'`)
  // mais nus dans le registre : sans cette normalisation, la comparaison ne
  // pourrait jamais mordre et l'invariant serait decoratif.
  const sources = scriptSources().map(s => s.replace(/^'|'$/g, ''))
  for (const entry of CSP_ARBITRATION_REGISTRY) {
    assert.ok(
      !sources.includes(entry.motif),
      `${entry.motif} est arbitre mais present dans script-src`
    )
  }
})

test('AC-2: static.cloudflareinsights.com n\'est pas dans le registre (corrigee, pas acceptee)', () => {
  // cloudflareinsights a ete corrigee par l'allowlist : elle ne doit pas entrer
  // dans un registre qui ne contient que les arbitrages encore en force. Sans
  // ce test, le registre devient un cimetiere de violations resolues.
  assert.equal(
    CSP_ARBITRATION_REGISTRY.some(entry => JSON.stringify(entry).includes('cloudflareinsights')),
    false
  )
})

// --- OBS.4 AC-4 : Report-Only, tolerances inchangees -------------------------

test('AC-4: script-src ne contient pas unsafe-eval', () => {
  const sources = scriptSources()
  assert.ok(!sources.includes('\'unsafe-eval\''))
  assert.ok(!sources.some(s => s.includes('unsafe-eval')))
})

test('AC-4: unsafe-inline reste present sur script-src', () => {
  assert.ok(scriptSources().includes('\'unsafe-inline\''))
})

// CSP3 §6.7.3.2 « Does a source list allow all inline behavior for type ? » :
// des qu'une expression correspond a la grammaire nonce-source ou hash-source,
// l'algorithme rend « Does Not Allow ». `'unsafe-inline'` devient donc INERTE.
// Le HTML servi contient un script inline executable par page (le bootstrap
// `window.__NUXT__`) : avec un hash dans la liste, il est rapporte a chaque vue
// de page — le bruit qu'obs-4 supprime, multiplie par le trafic. Le hash de
// beasties vit dans `CSP_BEASTIES_ONLOAD_HASH` (docblock de
// `buildCspReportOnlyPolicy`), pas dans l'en-tete : c'est l'outil du JOUR DU
// DURCISSEMENT, quand `'unsafe-inline'` sera retire.
test('AC-4: tant qu\'unsafe-inline est present, script-src ne porte aucun hash-source', () => {
  const sources = scriptSources()
  assert.ok(sources.includes('\'unsafe-inline\''), 'le test ne vaut que si unsafe-inline est present')

  const neutralizing = sources.filter(s => /^'(sha256|sha384|sha512|nonce)-/.test(s))
  assert.deepEqual(
    neutralizing,
    [],
    'un hash-source ou un nonce-source neutralise unsafe-inline (CSP3 §6.7.3.2)'
  )
  assert.deepEqual(
    sources.filter(s => s === '\'unsafe-hashes\''),
    [],
    '\'unsafe-hashes\' n\'a de sens qu\'avec le hash du jour du durcissement'
  )
})

test('AC-4: script-src ne gagne aucun joker non documente', () => {
  // `*`, `https://*`, `https://*.cloudflareinsights.com` ou tout autre joker
  // passait les assertions ci-dessus (elles ne regardent que des origines
  // nommees). La regle est fermee : la seule source a joker de `script-src` est
  // celui de Clarity, borne a un fournisseur deja autorise et documente.
  const wildcards = scriptSources().filter(s => s.includes('*'))
  assert.deepEqual(wildcards, ['https://*.clarity.ms'])
})

// Le hash n'est PAS dans la politique (test ci-dessus), mais il reste documente
// pour le jour du durcissement : `CSP_BEASTIES_ONLOAD_HASH`, dans
// `shared/utils/csp-report-endpoint.ts`. Il doit rester JUSTE le jour ou on s'en
// servira — un bump de beasties qui change la bascule ne doit pas laisser un hash
// mort derriere lui. On derive donc le digest du handler REELLEMENT emis, avec
// la config exacte du plugin, et on le compare a la constante documentee.
test('AC-4: le hash documente pour le durcissement est celui que beasties emet', async () => {
  const mod = await import('beasties') as unknown as {
    default: new (options: Record<string, unknown>) => {
      process: (html: string) => Promise<string>
    }
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csp-beasties-'))
  try {
    fs.writeFileSync(path.join(dir, 'a.css'), '.x{color:red}')
    const beasties = new mod.default({
      path: dir,
      publicPath: '/',
      pruneSource: false,
      preload: 'swap',
      reduceInlineStyles: true,
      logLevel: 'error'
    })
    const processed = await beasties.process(
      '<html><head><link rel="stylesheet" href="/a.css"></head><body><div class="x">t</div></body></html>'
    )

    const handler = /onload="([^"]+)"/.exec(processed)?.[1]
    if (!handler) throw new Error('beasties doit emettre un handler onload de bascule')

    const digest = createHash('sha256').update(handler).digest('base64')
    assert.equal(
      CSP_BEASTIES_ONLOAD_HASH,
      `'sha256-${digest}'`,
      `CSP_BEASTIES_ONLOAD_HASH ne couvre plus le handler reellement emis (${handler})`
    )
    // Et il n'est pas dans la politique : le documenter n'est pas l'emettre.
    assert.ok(!scriptSources().includes(CSP_BEASTIES_ONLOAD_HASH))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// --- OBS.4 AC-4 : la politique emise ne change pas, hormis l'origine ajoutee --
//
// Snapshot de la politique REELLEMENT emise avant obs-4 (commit 90c74c1), mot
// pour mot — et donc de ce que la production sert encore : releve du 2026-11-09
// sur https://keova.app et https://sophiejouan.fr, en-tete
// `content-security-policy-report-only` identique au source, **sans
// `'unsafe-hashes'` ni `sha256-`**.
//
// C'est le garde-fou que la story n'avait pas : une story d'hygiene CSP peut
// AJOUTER une origine constatee, pas modifier discretement une directive. Toute
// autre difference — un mot-cle en plus, un ordre change, une directive ajoutee
// ou retiree — fait tomber ce test.
const BASELINE_POLICY = [
  'default-src \'self\'',
  'script-src \'self\' \'unsafe-inline\' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.clarity.ms https://clarity.ms',
  'style-src \'self\' \'unsafe-inline\'',
  'img-src \'self\' data: https:',
  'font-src \'self\' data:',
  'connect-src \'self\' https:',
  'frame-src \'self\' https://www.youtube-nocookie.com https://www.youtube.com',
  'base-uri \'self\'',
  'form-action \'self\'',
  'frame-ancestors \'none\'',
  'report-uri https://o456.ingest.sentry.io/api/789/security/?sentry_key=abc123def'
].join('; ')

function directives(policy: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const directive of policy.split('; ')) {
    const [name, ...sources] = directive.split(' ')
    map.set(name, sources)
  }
  return map
}

test('AC-4: la seule difference avec la politique d\'avant obs-4 est l\'origine Cloudflare', () => {
  const endpoint = 'https://o456.ingest.sentry.io/api/789/security/?sentry_key=abc123def'
  const before = directives(BASELINE_POLICY)
  const after = directives(buildCspReportOnlyPolicy(endpoint))

  // Memes directives, dans le meme ordre : en ajouter, en retirer ou en
  // deplacer une est un changement de politique.
  assert.deepEqual([...after.keys()], [...before.keys()])

  for (const [name, beforeSources] of before) {
    const afterSources = after.get(name) ?? []
    if (name === 'script-src') {
      assert.deepEqual(
        afterSources,
        [...beforeSources, 'https://static.cloudflareinsights.com'],
        'script-src ne doit porter QUE l\'ajout de l\'origine Cloudflare'
      )
    } else {
      assert.deepEqual(afterSources, beforeSources, `la directive ${name} ne doit pas changer`)
    }
  }
})

// --- OBS.4 AC-6 : report-uri derive d'un DSN valide --------------------------
// Le `null` sur DSN malforme est conserve : c'est la garantie que la recette de
// deploiement double (AC-6). On la rejoue ici, et on y ajoute la seule chose
// qu'aucun test ne couvrait : la FORME du `report-uri` emis. Un endpoint vide,
// ou un DSN qui perd son projectId, laisse un `report-uri` inutilisable sans
// casser le build — c'est exactement la perte silencieuse visee.

test('AC-6: DSN malforme => null, DSN valide => report-uri Sentry exploitable', () => {
  assert.equal(buildCspReportEndpoint('pas-un-dsn'), null)

  const endpoint = buildCspReportEndpoint('https://abc123def@o456.ingest.sentry.io/789')
  if (!endpoint) throw new Error('un DSN valide doit produire un endpoint')
  assert.match(
    buildCspReportOnlyPolicy(endpoint),
    /report-uri https:\/\/o456\.ingest\.sentry\.io\/api\/789\/security\/\?sentry_key=abc123def$/
  )
})
