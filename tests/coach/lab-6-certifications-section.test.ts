import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  COACH_PAGE_INLINE_EDITOR_SECTIONS,
  getCoachPageEditableSections,
  getCoachPageExternalEditorSection
} from '../../app/features/coach/domain/coach-page-editor'

const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('LAB.6 — configuration et éditeur « Certifications » (pas de rendu de template)', () => {
  test('certifications n\'est plus une section externe (déplacée dans Ma page coach)', () => {
    assert.equal(getCoachPageExternalEditorSection('certifications'), null)
  })

  test('certifications est une section inline de l\'éditeur', () => {
    assert.ok(
      (COACH_PAGE_INLINE_EDITOR_SECTIONS as readonly string[]).includes('certifications'),
      'certifications doit être un éditeur inline'
    )
  })

  test('certifications reste dans la liste éditable, donc une carte est rendue', () => {
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
    const source = readFile('components/organisms/CoachPageExternalSectionCard.vue')
    assert.match(
      source,
      /v-if="section === 'pricing'"[\s\S]*?<FormControl\s+id="pricingEyebrow"/,
      'les champs de titres de section sont propres à pricing'
    )
    assert.match(source, /<FormControl\s+id="pricingTitle"/, 'le second champ de titre doit être rendu')
    assert.match(
      source,
      /\{\{ actionLabel \}\}/,
      'le libellé du bouton doit venir de la prop, pas d\'un littéral'
    )
    assert.equal(
      /Gérer mes formules/.test(source),
      false,
      'le libellé de pricing ne doit pas être codé en dur dans la card externe'
    )
    assert.match(
      source,
      /^import FormControl from '~\/components\/molecules\/FormControl\.vue'$/m,
      'FormControl est un composant de l’application (Nuxt ne l’enregistre que sous MoleculesFormControl) : l’import explicite est obligatoire, sinon les champs de titres ne se rendent pas'
    )
  })
})
