import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import {
  DEFAULT_COACH_TEMPLATE_CODE,
  SELF_HEADED_COACH_TEMPLATE_CODES,
  SUPPORTED_COACH_TEMPLATE_CODES,
  isKnownTemplateCode,
  resolveCoachTemplateCode,
  templateRendersOwnHeader
} from '../../app/composables/coach-template-registry'

const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('YC2.2 — coach-template-registry (pure resolver)', () => {
  describe('SUPPORTED_COACH_TEMPLATE_CODES', () => {
    test('contains exactly signature, essentiel, visuel and visuel-portrait (set, not count)', () => {
      // AD-5 : on asserte un ENSEMBLE. Un `length === 3` passe aussi bien
      // quand Alba remplace signature — et le remplacement silencieux d'un
      // code est précisément ce qu'un compte ne voit pas.
      //
      // YB.1.2 : Alba entre sous le code `visuel-portrait`. Le tiret est
      // imposé par le contrat d'administration (`^[a-z0-9-]+$`), ce n'est pas
      // un choix de nommage.
      assert.deepStrictEqual(
        [...SUPPORTED_COACH_TEMPLATE_CODES].sort(),
        ['essentiel', 'signature', 'visuel', 'visuel-portrait']
      )
    })
  })

  // YB.1.2 — la répartition « qui rend le header » est la vraie difficulté de
  // l'aperçu : invisible au lint, au typecheck et à tout test de rendu. Elle
  // vit dans le registre, et ces tests la figent.
  describe('SELF_HEADED_COACH_TEMPLATE_CODES', () => {
    test('couvre Alba — sans quoi l\'aperçu afficherait DEUX headers', () => {
      assert.ok(
        SELF_HEADED_COACH_TEMPLATE_CODES.includes('visuel-portrait'),
        'Alba rend son propre header et doit figurer dans la liste'
      )
    })

    test('signature reste en dehors — elle utilise le PublicHeader global', () => {
      assert.equal(SELF_HEADED_COACH_TEMPLATE_CODES.includes('signature'), false)
    })

    test('templateRendersOwnHeader résout avant de comparer, ne compare pas à un littéral', () => {
      assert.equal(templateRendersOwnHeader('signature'), false)
      assert.equal(templateRendersOwnHeader('essentiel'), true)
      assert.equal(templateRendersOwnHeader('visuel'), true)
      assert.equal(templateRendersOwnHeader('visuel-portrait'), true)
      // Un code inconnu est RÉSOLU avant comparaison : il hérite du repli
      // `essentiel`, qui a son propre header. C'est ce qui empêche un
      // littéral de réapparaître dans l'appelant.
      assert.equal(templateRendersOwnHeader('inconnu'), true)
      assert.equal(templateRendersOwnHeader(null), true)
      assert.equal(templateRendersOwnHeader(undefined), true)
    })

    test('aucun repli littéral ne subsiste dans l\'aperçu', () => {
      const panel = readFile('components/organisms/CoachPagePreviewPanel.vue')
      const codeOnly = panel
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      assert.equal(
        /templateCode\s*\|\|\s*'essentiel'/.test(codeOnly),
        false,
        'le repli du templateCode de l\'aperçu doit passer par le registre'
      )
      assert.match(
        panel,
        /templateRendersOwnHeader\(props\.coachProfile\?\.templateCode\)/,
        'le gate de header de l\'aperçu doit passer par le registre'
      )

      // Deuxième des trois points, hors du composant : le draft d'aperçu.
      const previewProfile = readFile('features/coach/useCoachPagePreviewProfile.ts')
      assert.equal(
        /templateCode:\s*deps\.templateCode\.value\s*\|\|\s*'essentiel'/.test(previewProfile),
        false,
        'le repli du templateCode du draft d\'aperçu doit passer par le registre'
      )
      assert.match(
        previewProfile,
        /templateCode:\s*resolveCoachTemplateCode\(deps\.templateCode\.value\)/,
        'le draft d\'aperçu doit résoudre via le registre'
      )
    })
  })

  describe('DEFAULT_COACH_TEMPLATE_CODE', () => {
    test('is "essentiel" (fallback template)', () => {
      assert.equal(DEFAULT_COACH_TEMPLATE_CODE, 'essentiel')
    })

    test('is part of the supported codes', () => {
      assert.ok(SUPPORTED_COACH_TEMPLATE_CODES.includes(DEFAULT_COACH_TEMPLATE_CODE))
    })
  })

  describe('isKnownTemplateCode', () => {
    test('accepts valid codes', () => {
      assert.equal(isKnownTemplateCode('signature'), true)
      assert.equal(isKnownTemplateCode('essentiel'), true)
      assert.equal(isKnownTemplateCode('visuel'), true)
      assert.equal(isKnownTemplateCode('visuel-portrait'), true)
    })

    test('rejects unknown codes', () => {
      assert.equal(isKnownTemplateCode('unknown'), false)
      assert.equal(isKnownTemplateCode('SIGNATURE'), false) // case-sensitive
      assert.equal(isKnownTemplateCode('signatur'), false)
      // YB.1.2 — l'underscore est REJETÉ par le DTO d'administration
      // (`^[a-z0-9-]+$`) : `POST /admin/coach-page-templates` renverrait 400.
      // Un code à l'underscore ne doit donc jamais être résolu en Alba.
      assert.equal(isKnownTemplateCode('visuel_portrait'), false)
      assert.equal(isKnownTemplateCode('visuel-portra'), false)
    })

    test('rejects null and undefined', () => {
      assert.equal(isKnownTemplateCode(null), false)
      assert.equal(isKnownTemplateCode(undefined), false)
    })

    test('rejects empty string', () => {
      assert.equal(isKnownTemplateCode(''), false)
    })
  })

  describe('resolveCoachTemplateCode', () => {
    test('returns "signature" for templateCode="signature"', () => {
      assert.equal(resolveCoachTemplateCode('signature'), 'signature')
    })

    test('returns "essentiel" for templateCode="essentiel"', () => {
      assert.equal(resolveCoachTemplateCode('essentiel'), 'essentiel')
    })

    test('returns "visuel" for templateCode="visuel"', () => {
      assert.equal(resolveCoachTemplateCode('visuel'), 'visuel')
    })

    // YB.1.2 — Alba. Sans cette ligne, un code présent en base serait ramené
    // au repli `essentiel` et la coach verrait la page d'Aurore, sans erreur.
    test('returns "visuel-portrait" for templateCode="visuel-portrait"', () => {
      assert.equal(resolveCoachTemplateCode('visuel-portrait'), 'visuel-portrait')
    })

    test('falls back to "essentiel" for unknown code', () => {
      assert.equal(resolveCoachTemplateCode('premium'), 'essentiel')
      assert.equal(resolveCoachTemplateCode('bogus'), 'essentiel')
    })

    test('falls back to "essentiel" for null', () => {
      assert.equal(resolveCoachTemplateCode(null), 'essentiel')
    })

    test('falls back to "essentiel" for undefined', () => {
      assert.equal(resolveCoachTemplateCode(undefined), 'essentiel')
    })

    test('falls back to "essentiel" for empty string', () => {
      assert.equal(resolveCoachTemplateCode(''), 'essentiel')
    })

    test('falls back to "essentiel" when called with no argument', () => {
      assert.equal(resolveCoachTemplateCode(), 'essentiel')
    })
  })
})

describe('YC2.2 — useCoachPageTemplate (Vue composable, file-based checks)', () => {
  test('useCoachPageTemplate.ts file exists', () => {
    const filePath = path.join(appRoot, 'composables/useCoachPageTemplate.ts')
    assert.ok(fs.existsSync(filePath), 'useCoachPageTemplate.ts should exist')
  })

  test('uses defineAsyncComponent for code-splitting (AD-Y2)', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    assert.ok(
      content.includes('defineAsyncComponent'),
      'Composable must use defineAsyncComponent for code-splitting'
    )
  })

  test('TEMPLATE_MAP contains a loader for every supported code (incl. Alba)', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    // Les clés sont tolérées QUOTÉES ou nues : YB.1.2 a ajouté
    // `'visuel-portrait'`, ce qui impose à `@stylistic/quote-props` de coter
    // les quatre clés de la table.
    const key = (code: string) => `'?${code}'?:?\\s*\\(\\)`
    assert.ok(
      new RegExp(`${key('signature')}\\s*=>\\s*import\\([^)]*CoachPageSignature\\.vue['"]?\\)`).test(content),
      'TEMPLATE_MAP must have signature → CoachPageSignature.vue loader'
    )
    assert.ok(
      new RegExp(`${key('essentiel')}\\s*=>\\s*import\\([^)]*CoachPageEssentiel\\.vue['"]?\\)`).test(content),
      'TEMPLATE_MAP must have essentiel → CoachPageEssentiel.vue loader'
    )
    assert.ok(
      new RegExp(`${key('visuel')}\\s*=>\\s*import\\([^)]*CoachPageVisuel\\.vue['"]?\\)`).test(content),
      'TEMPLATE_MAP must have visuel → CoachPageVisuel.vue loader'
    )
    assert.ok(
      new RegExp(`${key('visuel-portrait')}\\s*=>\\s*import\\([^)]*CoachPageAlba\\.vue['"]?\\)`).test(content),
      'TEMPLATE_MAP must have visuel-portrait → CoachPageAlba.vue loader'
    )
  })

  test('template files referenced by TEMPLATE_MAP actually exist', () => {
    const signature = path.join(appRoot, 'components/templates/coach-pages/CoachPageSignature.vue')
    const essentiel = path.join(appRoot, 'components/templates/coach-pages/CoachPageEssentiel.vue')
    const visuel = path.join(appRoot, 'components/templates/coach-pages/CoachPageVisuel.vue')
    const alba = path.join(appRoot, 'components/templates/coach-pages/CoachPageAlba.vue')
    assert.ok(fs.existsSync(signature), 'CoachPageSignature.vue must exist')
    assert.ok(fs.existsSync(essentiel), 'CoachPageEssentiel.vue must exist')
    assert.ok(fs.existsSync(visuel), 'CoachPageVisuel.vue must exist')
    assert.ok(fs.existsSync(alba), 'CoachPageAlba.vue must exist')
  })

  test('TEMPLATE_MAP keys match SUPPORTED_COACH_TEMPLATE_CODES (parity, BOTH ways)', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    // Extract the map object block
    const mapMatch = content.match(/TEMPLATE_MAP\s*=\s*\{([\s\S]*?)\}\s*as\s*const/)
    assert.ok(mapMatch, 'TEMPLATE_MAP block must be present')
    // YB.1.2 — une clé peut être QUOTÉE (celle qui porte un tiret). Le motif
    // `^\s*(\w+):` d'origine ne voyait que les trois premières : Alba aurait
    // été invisible pour la parité du sens 1, qui aurait alors échoué sur une
    // liste tronquée.
    const keysInMap = Array.from((mapMatch![1] ?? '').matchAll(/^\s*'?([\w-]+)'?\s*:/gm)).map(m => m[1])

    // Sens 1 — union → table (déjà couvert par le typage, on le garde).
    for (const code of SUPPORTED_COACH_TEMPLATE_CODES) {
      assert.ok(
        keysInMap.includes(code),
        `TEMPLATE_MAP must contain key "${code}" declared in SUPPORTED_COACH_TEMPLATE_CODES`
      )
    }

    // Sens 2 — table → union. C'est le mode de défaillance RÉEL, et il est
    // SILENCIEUX : un code présent dans l'union ET dans la table mais absent
    // de `SUPPORTED_COACH_TEMPLATE_CODES` est ramené au template de repli par
    // `resolveCoachTemplateCode` — une coach dont le template est enregistré
    // en base voit la page d'un AUTRE, sans erreur. (AD-5)
    const keysNotDeclared = keysInMap.filter(
      key => !(SUPPORTED_COACH_TEMPLATE_CODES as readonly string[]).includes(key)
    )
    assert.deepStrictEqual(
      keysNotDeclared,
      [],
      `TEMPLATE_MAP contains keys absent from SUPPORTED_COACH_TEMPLATE_CODES: ${keysNotDeclared.join(', ')}`
    )
  })
})

describe('YC2.2 — P-Y6 convention (no hardcoded /coach/ construction)', () => {
  // P-Y6: the literal "/coach/{slug}" must only be constructed in
  // composables/useCoachLink.ts (the single source of truth) and inside
  // pages/coach/** (the Nuxt routes themselves). Every other producer of
  // coach page URLs must go through useCoachLink.
  //
  // This test enforces the convention on the files that WE have migrated.
  // It is intentionally narrow (explicit allowlist) so adding a new coach
  // link requires either reusing useCoachLink or updating this list.

  const MIGRATED_FILES = [
    'components/organisms/SpecialistCard.vue',
    'pages/client/consultation/choose-slot.vue',
    'features/seo/breadcrumb-helpers.ts',
    'features/seo/b2c-landing-schema-helpers.ts',
    'features/seo/schema-helpers.ts'
  ]

  for (const file of MIGRATED_FILES) {
    test(`${file} no longer constructs /coach/\${slug} template literals`, () => {
      const content = readFile(file)
      // Strip comments (single-line + block)
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      // Reject any backtick template literal containing `/coach/${...}`
      assert.ok(
        !/`\/coach\/\$\{/.test(codeOnly),
        `${file} must not build /coach/\${...} template literals — use useCoachLink()`
      )
      // And reject plain `'/coach/${slug}'` or similar string concat patterns
      // (note: simple string literals like '/coach/' used as substring checks
      // are allowed — they are not link constructions).
    })

    test(`${file} imports useCoachLink`, () => {
      const content = readFile(file)
      assert.ok(
        content.includes('useCoachLink'),
        `${file} must import and use useCoachLink`
      )
    })
  }
})
