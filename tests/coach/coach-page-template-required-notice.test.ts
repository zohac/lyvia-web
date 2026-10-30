/**
 * LAB-R14 / LAB-R15 — la trappe de l'éditeur de sections, et le périmètre du
 * toggle « certifications ».
 *
 * Deux défauts distincts, deux preuves distinctes :
 *
 * - **LAB-R14** : sans `coach_page_template_id`, `availableSections` vaut `[]`
 *   et l'éditeur de sections se rendait **vide, sans explication**. L'avis est
 *   rendu pour de vrai par le harness SFC (0-42), puis on vérifie que la page
 *   le **monte** — c'est la seule façon de distinguer « composant livré » de
 *   « composant branché » (la leçon de lab-3).
 * - **LAB-R15** : `show.certifications` gate la section liste, pas la plaque du
 *   hero. Décision PO du 2026-10-30 : le libellé nomme donc la **section**.
 *   Une assertion sur le libellé du source suffit ici : rien ne se rend, il
 *   s'agit d'une chaîne.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const NOTICE_PATH = 'app/components/molecules/CoachPageTemplateRequiredNotice.vue'
const PAGE_PATH = 'app/pages/provider/coach-page.vue'
const SECTION_LABELS_PATH = 'app/features/coach/domain/coach-page-section-labels.ts'

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: props => () => Vue.h('span', { 'data-icon': props.name })
})

function readPage(): string {
  return fs.readFileSync(path.join(process.cwd(), PAGE_PATH), 'utf8')
}

function readSectionLabels(): string {
  return fs.readFileSync(path.join(process.cwd(), SECTION_LABELS_PATH), 'utf8')
}

describe('LAB-R14 — avis « choisissez un template »', () => {
  test('l\'avis est réellement rendu, avec sa cause et son geste', async () => {
    const html = await renderSfc(NOTICE_PATH, { globals: { ...Vue }, stubs: { UIcon } })

    assert.match(html, /data-testid="coach-page-template-required"/)
    // L'apostrophe est échappée par le rendeur SSR : on assert la forme rendue.
    assert.match(html, /Choisissez d&#39;abord un template/)
    assert.match(html, /une fois un template sélectionné ci-dessus/)
  })

  test('la page monte cet avis quand aucun template n’est sélectionné', () => {
    const source = readPage()

    // Garde de câblage, pas preuve de rendu : la page fait 3 700 lignes et ne se
    // monte pas sous le harness (router, page meta, stores). Ce qu'on vérifie
    // ici est exactement ce que lab-3 avait manqué — l'import explicite et le
    // point de montage.
    assert.match(
      source,
      /import CoachPageTemplateRequiredNotice from '~\/components\/molecules\/CoachPageTemplateRequiredNotice\.vue'/
    )
    assert.match(source, /<CoachPageTemplateRequiredNotice v-if="!selectedTemplateId" \/>/)
  })
})

describe('LAB-R15 — le toggle « certifications » nomme la section', () => {
  test('le libellé ne promet plus les diplômes du hero', () => {
    // TF.1 — la table de libellés a quitté la page pour
    // `features/coach/domain/coach-page-section-labels.ts`, partagée avec la
    // carte externe extraite. La preuve vise donc la source unique, et vérifie
    // que la page la consomme (sinon la décision PO ne s'appliquerait qu'à
    // l'ancien emplacement).
    const labels = readSectionLabels()

    assert.match(labels, /certifications: 'Section Parcours & qualifications'/)
    assert.equal(
      labels.includes('certifications: \'Diplômes & certifications\''),
      false,
      'le libellé promettait aussi la plaque de mise en avant du hero'
    )
    assert.match(
      readPage(),
      /^import \{ sectionLabel \} from '~\/features\/coach\/domain\/coach-page-section-labels'$/m,
      'la page doit consommer la source unique de libellés'
    )
  })
})
