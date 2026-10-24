import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  COACH_PAGE_EXTERNAL_EDITOR_SECTIONS,
  getCoachPageEditableSections,
  getCoachPageExternalEditorSection
} from '../../app/features/coach/domain/coach-page-editor'

/**
 * LAB.6 — les certifications deviennent une section autonome et activable.
 *
 * Trois choses sont verrouillées ici, dans l'ordre où elles cassent :
 *
 * 1. **La section existe et est à sa place** (AC1/AC2) : un `<section
 *    id="certifications">` entre « Qui suis-je » et « Témoignages », un `<h2>`
 *    lisible, et une seule occurrence du rail par template.
 * 2. **Elle est pilotée par le toggle ET le contenu** (AC4/AC5) : la matrice
 *    est exercée dans `yc2-3-essentiel-behavior.test.ts`, seule suite qui
 *    exécute réellement `useCoachSectionVisibility`.
 * 3. **L'éditeur rend un interrupteur** (AC3) : `certifications` doit être une
 *    section EXTERNE connue, sinon la boucle `v-for="section in
 *    orderedEditableSections"` de `coach-page.vue` n'émet aucune carte et la
 *    coach ne peut jamais écrire `sectionsConfig.certifications`.
 *
 * Convention A32 : les tests ciblent la source réelle des composants.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const TEMPLATES = [
  'CoachPageSignature.vue',
  'CoachPageEssentiel.vue',
  'CoachPageVisuel.vue',
  'CoachPageAlba.vue'
] as const

function readTemplate(file: string): string {
  return fs.readFileSync(
    path.join(appRoot, 'components/templates/coach-pages', file),
    'utf-8'
  )
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('LAB.6 — la section Certifications est autonome dans les 4 templates', () => {
  for (const file of TEMPLATES) {
    test(`${file} : section entre « Qui suis-je » et « Témoignages », titre h2, id stable`, () => {
      const source = readTemplate(file)

      // Le flag vient du composable, pas d'une seconde règle locale.
      assert.match(
        source,
        /const showCertifications = show\.certifications/,
        'le template doit consommer show.certifications'
      )
      assert.match(
        source,
        /<section\s+v-if="showCertifications"\s+id="certifications"/,
        'la section doit porter le flag ET un id stable'
      )
      assert.match(
        source,
        /<h2[^>]*>\s*Certifications\s*<\/h2>/,
        'la section doit porter un <h2> « Certifications » (AC2, lisible par les AT)'
      )

      // Position : après la bio, avant les témoignages. Deux ancres possibles
      // selon le template (`id="qui-suis-je"` pour Signature/Essentiel, le
      // commentaire de section pour Visuel/Alba).
      const bioAnchor = Math.max(
        source.indexOf('id="qui-suis-je"'),
        source.indexOf('QUI SUIS-JE')
      )
      const certificationsIdx = source.indexOf('id="certifications"')
      const testimonialsIdx = source.indexOf('id="temoignages"')

      assert.ok(bioAnchor >= 0, `${file}: ancre de la bio introuvable`)
      assert.ok(testimonialsIdx >= 0, `${file}: ancre des témoignages introuvable`)
      assert.ok(
        certificationsIdx > bioAnchor,
        `${file}: la section doit venir APRÈS « Qui suis-je »`
      )
      assert.ok(
        certificationsIdx < testimonialsIdx,
        `${file}: la section doit venir AVANT « Témoignages »`
      )
    })

    test(`${file} : une seule occurrence du rail, aucune plaque dupliquée dans la section`, () => {
      const source = readTemplate(file)

      const railOccurrences = (source.match(/<CoachCertificationsRail\b/g) ?? []).length
      assert.equal(
        railOccurrences,
        1,
        `le rail doit être monté une seule fois (trouvé ${railOccurrences})`
      )

      // AC6 — la plaque de mise en avant reste dans le hero : le bloc de la
      // section ne doit contenir que le rail.
      const start = source.indexOf('id="certifications"')
      const end = source.indexOf('</section>', start)
      assert.ok(start >= 0 && end > start, `${file}: bloc de section introuvable`)
      const sectionBlock = source.slice(start, end)
      assert.equal(
        sectionBlock.includes('CoachFeaturedCredential'),
        false,
        'la plaque de mise en avant ne doit pas être dupliquée dans la section'
      )
    })
  }

  test('CoachVisuelBio ne monte plus le rail (extrait vers la section autonome)', () => {
    const source = readFile('components/templates/coach-pages/visuel/CoachVisuelBio.vue')
    assert.equal(
      source.includes('CoachCertificationsRail'),
      false,
      'le rail doit avoir quitté la bio de Visuel'
    )
  })
})

describe('LAB.6 — l\'interrupteur « Certifications » atteint l\'éditeur', () => {
  test('certifications est une section externe connue, vers Mon compte', () => {
    assert.deepStrictEqual(getCoachPageExternalEditorSection('certifications'), {
      label: 'Modifiable dans Mon compte',
      to: '/provider/account',
      actionLabel: 'Gérer mes certifications'
    })
    assert.equal(
      COACH_PAGE_EXTERNAL_EDITOR_SECTIONS.certifications.to,
      '/provider/account'
    )
  })

  test('certifications reste dans la liste éditable, donc une carte est rendue', () => {
    // Sans cette inscription, `v-for="section in orderedEditableSections"` émet
    // une itération sans carte : aucun interrupteur, sectionsConfig jamais écrit.
    const editable = getCoachPageEditableSections([
      'hero',
      'bio',
      'certifications',
      'testimonials',
      'disclaimer'
    ])
    assert.deepStrictEqual(editable, ['bio', 'certifications', 'testimonials'])
  })

  test('la card externe ne rend ses champs de titres et son bouton Enregistrer que pour pricing', () => {
    const source = readFile('pages/provider/coach-page.vue')
    assert.match(
      source,
      /<div\s+v-if="section === 'pricing'"\s+class="space-y-4 px-6 py-5"\s*>/,
      'les champs de titres de section sont propres à pricing'
    )
    assert.match(
      source,
      /\{\{ externalSection\(section\)\?\.actionLabel \}\}/,
      'le libellé du bouton doit venir de la section, pas d\'un littéral « Gérer mes formules »'
    )
    assert.equal(
      /Gérer mes formules/.test(source),
      false,
      'le libellé de pricing ne doit plus être codé en dur dans la card externe'
    )
  })
})
