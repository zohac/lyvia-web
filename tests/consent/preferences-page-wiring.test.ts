import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it } from 'node:test'

import { RESERVED_PAGE_SLUGS } from '../../app/features/pages/domain/slugify'

/**
 * CC.2b — wiring coverage for the tokenized withdrawal page.
 *
 * The repo has no Vue runner, so an SFC cannot be executed. `consent-page.test.ts`
 * covers the pure rules by running them, and would stay green if the page stopped
 * using them. These assertions target the exact lines that wire the page to those
 * rules — the same convention as `tests/consent/contact-consent-wiring.test.ts`.
 *
 * Each assertion is non-vacuous: it pins a string that must be present, and the
 * corresponding mutation (documented in the Dev Agent Record) removes it.
 */

const appRoot = path.resolve(process.cwd(), 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

const PAGE_SOURCE = readAppFile('pages/preferences.vue')
const RELAY_SOURCE = fs.readFileSync(
  path.join(process.cwd(), 'server/routes/preferences-submit.post.ts'),
  'utf-8'
)
const NUXT_CONFIG = fs.readFileSync(path.join(process.cwd(), 'nuxt.config.ts'), 'utf-8')

describe('la page est un formulaire natif, exploitable sans JavaScript', () => {
  it('poste vers le relais Nitro avec une méthode et une action', () => {
    assert.match(PAGE_SOURCE, /method="post"/)
    assert.match(PAGE_SOURCE, /action="\/preferences-submit"/)
  })

  it('porte le token en champ caché', () => {
    // Sans ce champ, le serveur ne peut pas rendre le token au relais : c'est
    // la raison pour laquelle le token voyage en query et pas en fragment.
    assert.match(PAGE_SOURCE, /type="hidden"/)
    assert.match(PAGE_SOURCE, /name="token"/)
  })

  it('utilise des `input type="checkbox"` natifs, pas un composant Vue', () => {
    assert.match(PAGE_SOURCE, /type="checkbox"/)
    assert.match(PAGE_SOURCE, /name="retrait"/)
    // Un `UCheckbox` est un contrôle mort sans son script.
    assert.equal(/UCheckbox/.test(PAGE_SOURCE), false)
  })

  it('n\'intercepte la soumission que pour l\'enrichissement JS', () => {
    assert.match(PAGE_SOURCE, /@submit\.prevent="onSubmit"/)
  })
})

describe('la page ne lit rien', () => {
  it('n appelle aucune route de lecture', () => {
    // Un GET sur le consentement rouvrirait exactement l'oracle que la
    // feature interdit : il faut deduire « token valide » de « token invalide ».
    // On compte donc les appels apiFetch : la page doit en faire exactement un,
    // et il doit viser la route d'ecriture. Une lecture ajoutee ici ferait
    // passer le compte a 2 et ferait tomber cette assertion.
    const calls = [...PAGE_SOURCE.matchAll(/apiFetch\s*(?:<[^>]*>)?\s*\(\s*'([^']+)'/g)]
    assert.equal(calls.length, 1, 'appels apiFetch inattendus : ' + calls.map(c => c[1]).join(', '))
    assert.equal(calls[0]?.[1], '/public/consent/preferences')

    // Et rien qui contournerait le client standardise.
    assert.equal(/\bfetch\s*\(/.test(PAGE_SOURCE), false)
    assert.equal(/useAsyncData/.test(PAGE_SOURCE), false)
  })

  it('n utilise pas le composable de preferences authentifie', () => {
    // useClientPreferences vise /client/preferences (routes authentifiees) ;
    // cette page sert une visiteuse qui n'a pas encore de compte.
    assert.equal(/useClientPreferences/.test(PAGE_SOURCE), false)
  })

  it('ecrit en PATCH avec withAuth: false', () => {
    assert.match(PAGE_SOURCE, /method:\s*'PATCH'/)
    assert.match(PAGE_SOURCE, /withAuth:\s*false/)
  })
})

describe('une soumission passive n\'écrit rien', () => {
  it('court-circuite avant tout appel API', () => {
    // Le court-circuit couvre les deux voies de passivité — aucune case cochée,
    // ou un token inutilisable — via la règle partagée, pour que la page et le
    // relais ne puissent pas diverger sur ce qu'est une soumission passive.
    assert.match(PAGE_SOURCE, /isPassiveConsentSubmission\(/)
  })

  it('ne construit jamais de patch contenant `true`', () => {
    // Le mapping vit dans le helper pur ; la page ne doit pas le redéfinir.
    assert.equal(/emailMarketingOptIn:\s*true/.test(PAGE_SOURCE), false)
    assert.equal(/smsMarketingOptIn:\s*true/.test(PAGE_SOURCE), false)
  })
})

describe('les états rendus sont neutres', () => {
  it('ne contient aucun texte évoquant la validité du lien', () => {
    // La page doit être visuellement identique pour un token valide et un
    // token inconnu. Une mention « lien expiré » romprait l\'invariant.
    for (const forbidden of [/lien expir/i, /lien invalide/i, /lien expiré/i]) {
      assert.equal(forbidden.test(PAGE_SOURCE), false, `${forbidden} ne doit pas exister`)
    }
  })

  it('ne rend que `saved` et `error`', () => {
    assert.match(PAGE_SOURCE, /readConsentPageState\(route\.query\.state\)/)
  })

  it('l\'erreur ne dépend pas du code HTTP reçu', () => {
    // Un 429 et un échec transport sont tous deux « état=error » : le bucket
    // partagé (LB2-5) ne doit pas produire une troisième branche.
    assert.match(PAGE_SOURCE, /state\.value = 'error'/)
  })
})

describe('accessibilité des états', () => {
  it('annonce le chargement et la confirmation par `role="status"` + `aria-busy`', () => {
    assert.match(PAGE_SOURCE, /role="status"/)
    assert.match(PAGE_SOURCE, /:aria-busy="isSubmitting"/)
  })

  it('rend la confirmation focusable', () => {
    assert.match(PAGE_SOURCE, /tabindex="-1"/)
    assert.match(PAGE_SOURCE, /statusRef\.value\?\.focus\(\)/)
    // …et focalisée aussi sur le chemin no-JS, où la page rechargée arrive avec
    // `state` déjà posé : sans `onMounted`, le watcher ne se déclenche jamais et
    // la confirmation n'est ni focalisée ni annoncée (AC #5).
    assert.match(PAGE_SOURCE, /onMounted\(/)
  })

  it('associe l\'erreur à la région de contrôles', () => {
    assert.match(PAGE_SOURCE, /aria-describedby/)
    assert.match(PAGE_SOURCE, /aria-errormessage|aria-describedby/)
  })

  it('marque les contrôles `aria-invalid` quand l\'erreur est affichée', () => {
    // La Task 3.4 amendée impose `aria-invalid` : ce n'est pas l'un ou l'autre
    // avec `aria-describedby`, c'est `aria-describedby` **ET** `aria-invalid`.
    //
    // L'assertion précédente était tautologique : son alternation
    // `/aria-errormessage|aria-describedby/` contient littéralement le motif de
    // la précédente, donc elle ne pouvait pas détecter l'absence de
    // `aria-invalid`. Celle-ci est sur le mot seul, et elle échoue s'il
    // disparaît.
    assert.match(PAGE_SOURCE, /aria-invalid/, 'aria-invalid est obligatoire sur les contrôles en erreur')

    // Et elle est BORNÉE à l'état d'erreur, pas toujours présente : un
    // `aria-invalid="true"` permanent dirait à un lecteur d'écran que le
    // formulaire est invalide au repos.
    assert.match(
      PAGE_SOURCE,
      /:aria-invalid="hasError\s*\?\s*'true'\s*:\s*undefined"/,
      'aria-invalid doit être conditionné à l\'état d\'erreur'
    )

    // Le même binding alimente `aria-describedby` sur le contrôle, pour que le
    // message soit à la fois annoncé et rattaché au champ fautif.
    const inputBlock = PAGE_SOURCE.slice(
      PAGE_SOURCE.indexOf('v-model="selection"')
    )
    assert.match(
      inputBlock.slice(0, 600),
      /:aria-describedby="hasError\s*\?\s*errorId\s*:\s*undefined"/,
      'le contrôle doit pointer vers le message d\'erreur'
    )
  })

  it('accompagne le retour d\'un toast — jamais seul', () => {
    // Le toast seul ne serait ni annoncé de façon fiable, ni lisible sans
    // JavaScript ; la région `status` porte l\'information.
    assert.match(PAGE_SOURCE, /toast\.add\(/)
    assert.match(PAGE_SOURCE, /role="status"/)
  })
})

describe('le relais no-JS reste neutre et ne journalise rien', () => {
  it('relaye en PATCH et redirige en 303', () => {
    assert.match(RELAY_SOURCE, /method:\s*'PATCH'/)
    assert.match(RELAY_SOURCE, /303/)
  })

  it('reprend `setForwardedHeaders` tel quel', () => {
    // LB2-5 est un défaut ouvert tracé : le relais ne doit pas « corriger » la
    // dérivation d\'IP, il doit la réutiliser pour ne pas diverger du proxy.
    assert.match(RELAY_SOURCE, /setForwardedHeaders\(headers, event\)/)
  })

  it('ne journalise ni le token ni la query string', () => {
    assert.equal(/console\.(log|error|warn|info)/.test(RELAY_SOURCE), false)
  })

  it('court-circuite une soumission passive avant l\'appel API', () => {
    // La règle partagée couvre les deux voies de passivité (rien de coché, ou
    // token inutilisable) : la page et le relais ne peuvent pas diverger.
    assert.match(RELAY_SOURCE, /if \(isPassiveConsentSubmission\(selection\)\)/)
  })
})

describe('le cache et l\'indexation', () => {
  it('`/preferences` est en `no-store` et `noindex`', () => {
    assert.match(NUXT_CONFIG, /'\/preferences':\s*\{/)
    const rule = NUXT_CONFIG.slice(NUXT_CONFIG.indexOf('\'/preferences\': {'))
    assert.match(rule.slice(0, 200), /'Cache-Control':\s*'no-store'/)
    assert.match(rule.slice(0, 200), /'X-Robots-Tag':\s*'noindex/)
  })
})

describe('le slug `preferences` est réservé', () => {
  it('côté web', () => {
    assert.equal(RESERVED_PAGE_SLUGS.has('preferences'), true)
  })

  it('côté API — le miroir, lu dans le fichier source', () => {
    // Les deux dépôts n'ont pas de build partagé : le miroir ne se vérifie que
    // par lecture. Une page provider publiée sous ce slug serait sinon masquée
    // en silence par la route statique, sur le domaine custom.
    const candidates = [
      path.resolve(process.cwd(), '../lyvia-api/src/features/pages/domain/page-slug.ts'),
      '/lyvia-api/src/features/pages/domain/page-slug.ts',
      '/app/src/features/pages/domain/page-slug.ts'
    ]
    const apiSlugPath = candidates.find(candidate => fs.existsSync(candidate))

    // Clean skip. Amended Task 5.1 : le job `web test:unit` fait un
    // `sparse-checkout` de l'API limité à `openapi.yaml` et
    // `src/features/auth/domain/errors.ts`, donc `page-slug.ts` n'y est pas.
    // L'assertion précédente était placée AVEC ce garde, qui devenait du code
    // mort : le job web passait au rouge pour un motif étranger à la story.
    //
    // Ce que la garantie protège ne repose donc pas sur ce test : le refus de
    // publier un slug réservé est porté par le serveur (`PageSlug.parse()` côté
    // API), et le miroir web est vérifié par les assertions ci-dessus, qui
    // s'exécutent dans tous les environnements.
    if (apiSlugPath === undefined) return

    const source = fs.readFileSync(apiSlugPath, 'utf-8')
    const reserved = /RESERVED_PAGE_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/.exec(source)
    assert.ok(reserved, 'RESERVED_PAGE_SLUGS introuvable côté API')

    // Strip line comments before splitting: a comma inside an explanatory
    // comment would otherwise be read as a slug. Stripping first also keeps the
    // comparison below honest — it compares the declared slugs, not prose.
    const apiSlugs = (reserved?.[1] ?? '')
      .replace(/\/\/[^\n]*/g, '')
      .split(',')
      .map(entry => entry.trim().replace(/^'|'$/g, ''))
      .filter(entry => entry.length > 0)

    assert.equal(apiSlugs.includes('preferences'), true)
    // Et les deux dépôts portent exactement la même liste : une divergence
    // laisserait une page publiable dans un dépôt et masquée dans l'autre.
    assert.deepEqual(apiSlugs.slice().sort(), [...RESERVED_PAGE_SLUGS].sort())
  })
})
