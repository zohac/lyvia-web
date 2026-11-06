import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-26 — wiring tests for the refonte UX of `/provider/coach-page` :
 *  - AC-1: switches inline dans chaque header de card éditeur (suppression
 *    de la section autonome "Sections visibles")
 *  - AC-2: auto-save debounced 500ms + rollback optimistic
 *  - AC-3: textareas pleine largeur (w-full)
 *  - AC-4: éditeur bio inline (Qui suis-je, plus de redirect Mon compte)
 *  - AC-5: éditeur testimonials inline (max 10, pattern liste)
 *  - AC-6: section branding migrée (couvert par coach-page-branding.test.ts)
 *  - AC-7: COACH_PAGE_EXTERNAL_EDITOR_SECTIONS contient seulement pricing
 *  - AC-9: tests comportementaux ≥ 6 (A47)
 *
 * Convention A32: tests target the real `app/pages/provider/coach-page.vue`
 * source — toute régression sur les patterns critiques fait tomber un test.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const COACH_PAGE_PATH = 'pages/provider/coach-page.vue'

function readCoachPage(): string {
  return fs.readFileSync(path.join(appRoot, COACH_PAGE_PATH), 'utf-8')
}

/**
 * La balise d'ouverture de `CoachPageSectionCard`, et elle seule.
 *
 * CPD.1 (revue) — la garde de câblage livrée était faite de regex non bornées
 * sur tout le fichier, ce que l'AC-3 interdit explicitement. Mesuré : retirer
 * `@save` de la carte laissait 2379/2379 vertes, et déplacer `@toggle` sur un
 * autre élément aussi — `/@toggle="onToggleSection"/` est **aussi** satisfaite
 * par `CoachPageExternalSectionCard`. Pattern `cardTag()` de
 * `lab-4-credentials-page.test.ts`, introduit pour la même raison en tf-3.
 */
function sectionCardTag(): string {
  const source = readCoachPage()
  const start = source.indexOf('<CoachPageSectionCard')
  assert.ok(start >= 0, 'la carte `CoachPageSectionCard` n’est pas montée par la page')
  // Aucun `>` ne figure dans les valeurs d'attributs de cette balise : la
  // première occurrence ferme bien l'ouverture.
  const end = source.indexOf('>', start)
  assert.ok(end > start, 'balise d’ouverture de la carte introuvable')
  return source.slice(start, end)
}

/**
 * CPD.2 — la balise d'ouverture d'une carte montée par la page, et elle seule.
 *
 * Une regex sur tout le fichier est satisfaite par n'importe quelle autre
 * occurrence (import, commentaire, autre carte). La garde lit donc les liaisons
 * dans la balise réellement montée, comme `sectionCardTag()` et `cardTag()`
 * (tf-3, lab-4).
 */
/**
 * CPD.4 (revue) — le fichier **sans ses commentaires HTML**. Une balise montée
 * dans un commentaire satisfaisait la garde de câblage : mesuré, envelopper le
 * montage dans `<!-- -->` laissait 20/20 verts.
 */
function readCoachPageMarkup(): string {
  return readCoachPage().replace(/<!--[\s\S]*?-->/g, '')
}

function componentTag(componentName: string): string {
  const source = readCoachPageMarkup()
  const start = source.indexOf(`<${componentName}`)
  assert.ok(start >= 0, `la carte \`${componentName}\` n’est pas montée par la page`)
  const end = source.indexOf('>', start)
  assert.ok(end > start, `balise d’ouverture de \`${componentName}\` introuvable`)
  return source.slice(start, end)
}

/**
 * CPD.4 (revue) — le bloc `<template v-if="section === '<section>'">` de la
 * page. La garde précédente ne contraignait pas l'emplacement : monter la FAQ
 * sous `section !== 'faq'` laissait 498/498 verts.
 */
function sectionBlock(section: string): string {
  const source = readCoachPageMarkup()
  const marker = `<template v-if="section === '${section}'">`
  const start = source.indexOf(marker)
  assert.ok(start >= 0, `bloc de la section « ${section} » introuvable dans la page`)
  const end = source.indexOf('</template>', start)
  assert.ok(end > start, `fin du bloc de la section « ${section} » introuvable`)
  return source.slice(start, end)
}

function assertBindings(componentName: string, expected: string[]): void {
  const tag = componentTag(componentName)
  for (const binding of expected) {
    assert.ok(tag.includes(binding), `${componentName} doit porter \`${binding}\` dans sa propre balise`)
  }
}

describe('0-26 — coach-page toggles inline + auto-save + textareas + bio/testimonials inline', () => {
  // ─────────────────────────────────────────────────────────────────────
  // AC-1 — Switches inline dans chaque card éditeur
  // ─────────────────────────────────────────────────────────────────────

  test('AC-1: section autonome "Sections visibles" + son bouton "Sauvegarder" est SUPPRIMÉE', () => {
    const source = readCoachPage()
    // Le titre h2 "Sections visibles" doit avoir disparu.
    assert.ok(
      !/<h2[^>]*>\s*Sections\s+visibles\s*<\/h2>/.test(source),
      'Le titre "Sections visibles" autonome doit être supprimé'
    )
    // Le handler legacy onSaveToggles ne doit plus exister.
    assert.ok(
      !source.includes('onSaveToggles'),
      'Le handler onSaveToggles doit être supprimé'
    )
  })

  /**
   * CPD.1 — GARDE DE CÂBLAGE (pas une preuve de rendu).
   *
   * `coach-page.vue` (~3 500 lignes) exige une application Nuxt complète : le
   * harnais (`tests/helpers/render-sfc.ts`) ne rend que de petits composants, et
   * aucun test de la suite ne monte cette page. Les assertions ci-dessous portent
   * donc sur la SOURCE RÉELLE de la page (Convention A32) et ne prétendent PAS
   * prouver un rendu — la preuve de rendu porte sur la carte extraite, cf.
   * `tests/coach/cpd-1-section-card.test.ts`. Toutes les liaisons sont lues dans
   * la BALISE de la carte, jamais sur le fichier entier.
   */
  test('AC-1/AC-3: GARDE DE CÂBLAGE — la page monte CoachPageSectionCard avec ses dix liaisons', () => {
    assert.match(
      readCoachPage(),
      /^import CoachPageSectionCard from '~\/components\/organisms\/CoachPageSectionCard\.vue'$/m,
      'la carte doit être importée explicitement (une balise non résolue ne rend rien)'
    )
    const tag = sectionCardTag()
    const bindings: [string, RegExp][] = [
      [':section', /:section="section"/],
      [':label', /:label="sectionLabel\(section\)"/],
      [':is-on', /:is-on="isSectionOn\(section\)"/],
      [':locked', /:locked="isSectionLocked\(section\)"/],
      [':lock-reason', /:lock-reason="sectionLockReason\(section\)"/],
      [':body-open', /:body-open="isSectionBodyOpen\(section\)"/],
      [':saving', /:saving="saving"/],
      [':show-footer', /:show-footer="section !== 'certifications'"/],
      ['@toggle', /@toggle="onToggleSection"/],
      ['@save', /@save="onSaveSection\(section\)"/]
    ]
    for (const [name, pattern] of bindings) {
      assert.match(tag, pattern, `la carte doit porter ${name} dans sa propre balise`)
    }
  })

  test('AC-1: sections always-on (hero + disclaimer) NE rendent PAS de switch — indicateur "Toujours visible" + lock icon', () => {
    const source = readCoachPage()
    // Round PO 2026-05-01 : pas de switch pour always-on (le switch n'a pas de sens si la section
    // ne peut pas être désactivée). À la place, indicateur compact avec icône lucide-lock + texte.
    assert.match(
      source,
      /<span class="text-xs[^"]*">\s*Toujours visible\s*</,
      'Les always-on doivent afficher "Toujours visible" (badge texte, pas de switch)'
    )
    assert.match(
      source,
      /name="i-lucide-lock"/,
      'Indicateur always-on doit utiliser l\'icône i-lucide-lock'
    )
    // Filtre always-on appliqué sur configurableSections via orderedAlwaysOnSections.
    assert.match(
      source,
      /orderedAlwaysOnSections|configurableSections\.value\.filter\(isAlwaysOn\)/,
      'La boucle always-on doit dériver de configurableSections.filter(isAlwaysOn) (via orderedAlwaysOnSections)'
    )
  })

  test('AC-1: contenu de l\'éditeur est collapse quand la section est off (wrapper isSectionBodyOpen)', () => {
    const source = readCoachPage()
    // Round PO 2026-05-01 : la structure a été simplifiée — un seul <template v-if="isSectionOn(section)">
    // par card englobe contenu + footer (au lieu d\'un v-if par bloc interne).
    //
    // YB.1.1 : ce wrapper est devenu `isSectionBodyOpen(section)`. La
    // différentielle est EXPLICITE et bornée à la section `freeText` — dont
    // la bascule est verrouillée tant que le contenu est vide, donc il faut
    // que le formulaire reste déplié pour pouvoir l'écrire. Pour toutes les
    // autres sections, `isSectionBodyOpen` === `isSectionOn`.
    // TF.1 — la card « external » (pricing) a été extraite dans
    // `CoachPageExternalSectionCard.vue` : son wrapper de corps
    // (`v-if="isOn"`) et son interrupteur ne sont plus dans cette page. Leur
    // couverture a suivi le composant (tests/coach/coach-page-section-cards.test.ts,
    // rendu réel). Il ne reste donc ici que la card éditeur inline :
    //   - la card éditeur inline, YB.1.1 : isSectionBodyOpen(section).
    //
    // CPD.1 — la liaison `:body-open` est assertée DANS la balise de la carte par
    // la garde de câblage ci-dessus, et le comportement (corps rendu / masqué)
    // par `tests/coach/cpd-1-section-card.test.ts`, qui rend la carte avec un
    // contenu de slot réel. Il ne reste donc ici que les helpers de la page.
    // Le helper ne déborde PAS sur les autres sections.
    assert.match(
      source,
      /function isSectionBodyOpen\(section: string\): boolean \{\s*return isSectionOn\(section\) \|\| isFreeTextSection\(section\)\s*\}/,
      'isSectionBodyOpen doit ouvrir le corps SI la section est allumée OU si c\'est le bloc libre'
    )
    assert.match(
      source,
      /function isFreeTextSection\(section: string\): boolean \{\s*return section === 'freeText'\s*\}/,
      'isFreeTextSection doit être borné à la seule section freeText'
    )
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-2 — Auto-save debounced 500ms + rollback
  // ─────────────────────────────────────────────────────────────────────

  test('AC-2: handler onToggleSection prend un snapshot rollback + applique optimistic + debounce', () => {
    const source = readCoachPage()
    // La fonction onToggleSection existe.
    assert.match(source, /function onToggleSection\(section: string, value: boolean\)/)
    // Snapshot rollback via pendingPreviousSnapshot.
    assert.match(source, /pendingPreviousSnapshot/)
    // Optimistic apply.
    assert.match(source, /sectionsConfig\[section\]\s*=\s*value/)
    // Schedule debounced save.
    assert.match(source, /scheduleSectionsConfigSave\(\)/)
  })

  test('AC-2: debounce 500ms via setTimeout TOGGLE_AUTOSAVE_DEBOUNCE_MS=500', () => {
    const source = readCoachPage()
    assert.match(source, /TOGGLE_AUTOSAVE_DEBOUNCE_MS\s*=\s*500/)
    // Le timer est créé via setTimeout avec la constante.
    assert.match(source, /setTimeout\([\s\S]*?,\s*TOGGLE_AUTOSAVE_DEBOUNCE_MS\)/)
    // clearTimeout sur le précédent timer (debounce trailing).
    assert.match(source, /clearTimeout\(saveDebounceTimer\)/)
  })

  test('AC-2: toasts auto-save verbatim ("Configuration enregistrée" / "Impossible d\'enregistrer la configuration") + rollback sur échec', () => {
    const source = readCoachPage()
    // Toast succès verbatim (A31).
    assert.match(source, /title:\s*'Configuration enregistrée'/)
    // Toast erreur verbatim (apostrophe échappée dans le source).
    const errToast1 = 'Impossible d\\\'enregistrer la configuration'
    const errToast2 = 'Impossible d\'enregistrer la configuration'
    assert.ok(
      source.includes(errToast1) || source.includes(errToast2),
      'Toast erreur verbatim "Impossible d\'enregistrer la configuration" doit être présent'
    )
    // Rollback : restaure sectionsConfig depuis previous snapshot via le helper pur extrait
    // (round Codex CR R1-F1 — la logique de rollback est testée unitairement dans
    // tests/coach/section-config-rollback.test.ts, voir aussi coach-page-editor-runtime.test.ts).
    assert.match(source, /applySectionsConfigSnapshot\(sectionsConfig,\s*previous\)/)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-3 — Textareas pleine largeur
  // ─────────────────────────────────────────────────────────────────────

  test('AC-3: tous les <UTextarea> de la page ET des cartes extraites ont la classe w-full', () => {
    const sources = [
      readCoachPage(),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageBioEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageProblemStatementEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageBenefitsEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPagePillarsEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageHowItWorksEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageTestimonialsEditor.vue'), 'utf-8'),
      fs.readFileSync(path.join(appRoot, 'components/organisms/CoachPageFaqEditor.vue'), 'utf-8')
    ]
    // Match every <UTextarea ...> opening tag (with attributes spanning multiple lines).
    const textareaPattern = /<UTextarea\b[^>]*?(?:\n[^>]*?)*?>/g
    let total = 0
    for (const source of sources) {
      const matches = source.match(textareaPattern) ?? []
      total += matches.length
      for (const tag of matches) {
        assert.ok(
          /class="[^"]*\bw-full\b/.test(tag),
          `Chaque UTextarea doit avoir w-full dans sa class — manquant sur : ${tag.slice(0, 200)}`
        )
      }
    }
    assert.ok(total > 0, 'au moins un <UTextarea> attendu dans le périmètre scanné')
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-4 — Éditeur bio (Qui suis-je) inline
  // ─────────────────────────────────────────────────────────────────────

  test('AC-4: GARDE DE CÂBLAGE — la page monte CoachPageBioEditor avec toutes ses liaisons', () => {
    const source = readCoachPage()
    // Round 2026-05-01 — fix terrain Sophie (962 chars rejetés en 422 sur `bio` qui plafonne à 500) :
    // l'éditeur cible désormais `longBio` (5000 chars). + rapatriement city/region depuis
    // /provider/account section "Profil professionnel" (single source of truth pour identité géo).
    // CPD.2 — le markup a quitté la page pour CoachPageBioEditor ; la preuve de RENDU
    // est `tests/coach/cpd-2-bio-problem-editors.test.ts`, et les liaisons ci-dessous
    // sont lues dans la BALISE, jamais sur le fichier entier (AC-4).
    assert.match(source, /^import CoachPageBioEditor from '~\/components\/organisms\/CoachPageBioEditor\.vue'$/m)
    assertBindings('CoachPageBioEditor', [
      ':bio-form="bioForm"',
      ':bio-eyebrow="sectionTitlesForm.bioEyebrow"',
      ':bio-title="sectionTitlesForm.bioTitle"',
      ':secondary-photo-url="secondaryPhotoForEditor"',
      '@update:long-bio="bioForm.longBio = $event"',
      '@update:city="bioForm.city = $event"',
      '@update:region="bioForm.region = $event"',
      '@update:bio-eyebrow="sectionTitlesForm.bioEyebrow = $event"',
      '@update:bio-title="sectionTitlesForm.bioTitle = $event"',
      '@photo-selected="onSecondaryPhotoSelected"',
      '@photo-uploaded="onSecondaryPhotoUploaded"',
      '@photo-error="onSecondaryPhotoError"'
    ])
    // AC-2 amendé le 2026-11-05 : le pied d'enregistrement appartient à
    // `CoachPageSectionCard`, pas à la carte de corps. Ces deux liaisons étaient
    // mortes et le resteraient si on les réintroduisait « pour plus tard ».
    assert.ok(!componentTag('CoachPageBioEditor').includes('@save'), 'la carte de corps ne porte pas @save')
    assert.ok(!componentTag('CoachPageBioEditor').includes(':saving'), 'la carte de corps ne porte pas :saving')

    // Handler onSaveBio conservé (appelé par le dispatcheur de la carte de section).
    assert.match(source, /async function onSaveBio\(\)/)
    // Appel updateAccount avec longBio + city + region + trim/null fallback.
    // (story 0-26 round terrain — updateAccount désormais exposé par useCoachPageEditor,
    // un SEUL store providerAccount partagé, plus de double instance non synchronisée).
    assert.match(source, /\bupdateAccount\(\{[\s\S]*?longBio:[\s\S]*?city:[\s\S]*?region:[\s\S]*?\}\)/)
    // Toast succès verbatim (round PO 2026-05-01 : harmonisation "...enregistré(e)(s)" partout).
    assert.match(source, /'Qui suis-je enregistré'/)
  })

  /**
   * CPD.2 — AC-6, 5ᵉ mutation : retirer le montage de l'une des deux cartes doit
   * faire tomber une garde. La carte de l'énoncé n'en avait aucune : supprimer
   * ses quinze lignes de montage laissait la suite entière verte.
   */
  test('AC-4: GARDE DE CÂBLAGE — la page monte CoachPageProblemStatementEditor avec toutes ses liaisons', () => {
    assert.match(
      readCoachPage(),
      /^import CoachPageProblemStatementEditor from '~\/components\/organisms\/CoachPageProblemStatementEditor\.vue'$/m,
      'la carte doit être importée explicitement (une balise non résolue ne rend rien)'
    )
    assertBindings('CoachPageProblemStatementEditor', [
      ':problem-statement-form="problemStatementForm"',
      ':problem-statement-eyebrow="sectionTitlesForm.problemStatementEyebrow"',
      ':problem-statement-title="sectionTitlesForm.problemStatementTitle"',
      ':photo-url="problemStatementPhotoForEditor"',
      ':photo-busy="problemStatementPhotoUploading"',
      ':photo-error="problemStatementPhotoError"',
      '@update:problem-statement-eyebrow="sectionTitlesForm.problemStatementEyebrow = $event"',
      '@update:problem-statement-title="sectionTitlesForm.problemStatementTitle = $event"',
      '@update:blockquote="setProblemStatementBlockquote($event)"',
      '@update:paragraph="onProblemParagraphUpdate($event)"',
      '@add-paragraph="addProblemParagraph"',
      '@remove-paragraph="removeProblemParagraph($event)"',
      '@photo-selected="onProblemStatementPhotoSelected"',
      '@photo-uploaded="onProblemStatementPhotoUploaded"',
      '@photo-removed="onProblemStatementPhotoRemoved"',
      '@photo-error="onProblemStatementPhotoError"'
    ])
    assert.ok(!componentTag('CoachPageProblemStatementEditor').includes('@save'), 'la carte de corps ne porte pas @save')
    assert.ok(!componentTag('CoachPageProblemStatementEditor').includes(':saving'), 'la carte de corps ne porte pas :saving')

    // La page reçoit bien les modifications et ne les absorbe pas.
    assert.match(readCoachPage(), /function onProblemParagraphUpdate\(payload: \{ index: number, value: string \}\)/)
  })

  /**
   * CPD.3 — GARDE DE CÂBLAGE (pas une preuve de rendu).
   *
   * La preuve de rendu des trois éditeurs est `tests/coach/cpd-3-list-editors.test.ts` ;
   * ces assertions prouvent qu'ils sont réellement MONTÉS et reliés. Supprimer
   * un montage doit faire tomber la suite — c'était la mutation qui restait
   * verte avant la revue (cinq mutations d'AC-5 ne tuaient rien).
   */
  test('AC-4: GARDE DE CÂBLAGE — la page monte les trois éditeurs de listes avec toutes leurs liaisons', () => {
    for (const card of ['CoachPageBenefitsEditor', 'CoachPagePillarsEditor', 'CoachPageHowItWorksEditor']) {
      assert.match(
        readCoachPage(),
        new RegExp(`^import ${card} from '~\\/components\\/organisms\\/${card}\\.vue'$`, 'm'),
        `${card} doit être importé explicitement (une balise non résolue ne rend rien)`
      )
      assert.ok(!componentTag(card).includes('@save'), `${card} ne porte pas @save (le pied est celui de la carte de section)`)
      assert.ok(!componentTag(card).includes(':saving'), `${card} ne porte pas :saving`)
    }

    assertBindings('CoachPageBenefitsEditor', [
      ':items="benefitsForm?.items ?? []"',
      ':vision-intro="benefitsForm?.visionIntro ?? null"',
      ':vision-text="benefitsForm?.visionText ?? null"',
      ':benefits-eyebrow="sectionTitlesForm.benefitsEyebrow"',
      ':benefits-title="sectionTitlesForm.benefitsTitle"',
      '@update:item="onBenefitItemUpdate($event)"',
      '@add="addBenefit()"',
      '@remove="removeBenefit($event)"',
      '@update:vision-intro="setBenefitsVisionIntro($event)"',
      '@update:vision-text="setBenefitsVisionText($event)"',
      '@update:benefits-eyebrow="sectionTitlesForm.benefitsEyebrow = $event"',
      '@update:benefits-title="sectionTitlesForm.benefitsTitle = $event"'
    ])

    assertBindings('CoachPagePillarsEditor', [
      ':items="pillarsForm?.items ?? []"',
      ':emotional-support="pillarsForm?.emotionalSupport ?? null"',
      ':show-emotional-support="hasEmotionalSupportSection"',
      ':pillars-eyebrow="sectionTitlesForm.pillarsEyebrow"',
      ':pillars-title="sectionTitlesForm.pillarsTitle"',
      '@update:item="onPillarItemUpdate($event)"',
      '@add="addPillar()"',
      '@remove="removePillar($event)"',
      '@update:emotional-support-title="setPillarsEmotionalSupportTitle($event)"',
      '@update:emotional-support-description="setPillarsEmotionalSupportDescription($event)"',
      '@update:pillars-eyebrow="sectionTitlesForm.pillarsEyebrow = $event"',
      '@update:pillars-title="sectionTitlesForm.pillarsTitle = $event"'
    ])

    assertBindings('CoachPageHowItWorksEditor', [
      ':items="howItWorksForm"',
      ':how-it-works-eyebrow="sectionTitlesForm.howItWorksEyebrow"',
      ':how-it-works-title="sectionTitlesForm.howItWorksTitle"',
      '@update:item="onHowItWorksItemUpdate($event)"',
      '@add="addStep()"',
      '@remove="removeStep($event)"',
      '@update:how-it-works-eyebrow="sectionTitlesForm.howItWorksEyebrow = $event"',
      '@update:how-it-works-title="sectionTitlesForm.howItWorksTitle = $event"'
    ])

    // Le pied d'enregistrement de ces trois sections reste celui de la carte de
    // section : `onSaveSection(section)` dispatche déjà vers les trois handlers.
    assert.match(readCoachPage(), /benefits: onSaveBenefitsSection/)
    assert.match(readCoachPage(), /pillars: onSavePillarsSection/)
    assert.match(readCoachPage(), /howItWorks: onSaveHowItWorksSection/)
  })

  // ─────────────────────────────────────────────────────────────────────
  // CPD.4 — GARDE DE CÂBLAGE — les deux éditeurs sociaux sont montés
  // ─────────────────────────────────────────────────────────────────────

  test('AC-4: GARDE DE CÂBLAGE — la page monte CoachPageTestimonialsEditor et CoachPageFaqEditor avec toutes leurs liaisons', () => {
    for (const [card, section] of [['CoachPageTestimonialsEditor', 'testimonials'], ['CoachPageFaqEditor', 'faq']] as const) {
      assert.match(
        readCoachPage(),
        new RegExp(`^import ${card} from '~\\/components\\/organisms\\/${card}\\.vue'$`, 'm'),
        `${card} doit être importé explicitement (une balise non résolue ne rend rien)`
      )
      assert.ok(!componentTag(card).includes('@save'), `${card} ne porte pas @save (le pied est celui de la carte de section)`)
      assert.ok(!componentTag(card).includes(':saving'), `${card} ne porte pas :saving`)
      // CPD.4 (revue) — montage RÉEL : la balise doit vivre dans sa section, sans
      // condition propre. `v-if="false"` sur la carte et `section !== 'faq'` sur
      // le bloc laissaient la suite verte avant ces deux assertions.
      assert.ok(sectionBlock(section).includes(`<${card}`), `${card} doit être monté dans la section « ${section} »`)
      assert.ok(!componentTag(card).includes('v-if'), `${card} ne doit pas être conditionné dans sa propre balise`)
    }

    assertBindings('CoachPageTestimonialsEditor', [
      ':items="testimonialsForm"',
      ':testimonials-eyebrow="sectionTitlesForm.testimonialsEyebrow"',
      ':testimonials-title="sectionTitlesForm.testimonialsTitle"',
      '@update:item="onTestimonialItemUpdate($event)"',
      '@add="addTestimonial()"',
      '@remove="removeTestimonial($event)"',
      '@update:testimonials-eyebrow="sectionTitlesForm.testimonialsEyebrow = $event"',
      '@update:testimonials-title="sectionTitlesForm.testimonialsTitle = $event"'
    ])

    assertBindings('CoachPageFaqEditor', [
      ':items="faqForm"',
      ':faq-eyebrow="sectionTitlesForm.faqEyebrow"',
      ':faq-title="sectionTitlesForm.faqTitle"',
      '@update:item="onFaqItemUpdate($event)"',
      '@add="addFaq()"',
      '@remove="removeFaq($event)"',
      '@update:faq-eyebrow="sectionTitlesForm.faqEyebrow = $event"',
      '@update:faq-title="sectionTitlesForm.faqTitle = $event"'
    ])

    assert.match(readCoachPage(), /function addTestimonial\(\)/)
    assert.match(readCoachPage(), /function removeTestimonial\(/)
    assert.match(readCoachPage(), /function addFaq\(\)/)
    assert.match(readCoachPage(), /function removeFaq\(/)
    assert.match(readCoachPage(), /async function onSaveTestimonials\(\)/)
    assert.match(readCoachPage(), /async function onSaveFaqSection\(\)/)
    // Le dispatcheur d'enregistrement doit pointer chaque section vers SON
    // handler : échanger les deux entrées laissait 498/498 verts (revue CPD.4).
    assert.match(readCoachPage(), /testimonials: onSaveTestimonials,/)
    assert.match(readCoachPage(), /faq: onSaveFaqSection/)
    // Plafond importé de la source unique, plus de copie locale dans la page.
    assert.match(readCoachPage(), /import \{ TESTIMONIALS_MAX \} from '~\/features\/coach\/domain\/social-editor-limits'/)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-7 — getCoachPageExternalEditorSection ne contient plus bio/testimonials
  // (couvert aussi par yc3-1-coach-page-editor.test.ts mais vérifié ici aussi pour traçabilité)
  // ─────────────────────────────────────────────────────────────────────

  test('AC-7: la page consomme bio/testimonials inline, branding reste une config globale hors boucle sections', () => {
    const source = readCoachPage()
    // La page utilise isCoachPageInlineEditorSection qui doit retourner true pour bio/testimonials.
    // Le rendu inline pour bio/testimonials est conditionné par hasEditor(section).
    assert.match(source, /section === 'bio'/)
    assert.match(source, /section === 'testimonials'/)
    // Branding ne doit pas être réintroduit dans la boucle générique des sections templates :
    // il a une card globale dédiée, sans switch "Visible sur ma page".
    //
    // Story 18.3b — la card est désormais enveloppée dans un
    // `<FeatureGate feature="white_label_branding">` et `id="section-branding"`
    // porte sur le wrapper. Elle reste néanmoins HORS de la boucle
    // `orderedEditableSections` : c'est ce que ce test verrouille.
    assert.match(source, /id="section-branding"/)
    assert.equal(source.includes('section === \'branding\''), false)

    const gateIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    const loopIdx = source.indexOf('v-for="section in orderedEditableSections"')
    assert.ok(gateIdx >= 0, '18.3b: la card branding est gatée par white_label_branding')
    assert.ok(loopIdx >= 0, 'la boucle des sections éditables doit exister')

    // CR 18.3b — `indexOf` renvoie -1 quand la balise disparaît, et `-1 < loopIdx`
    // est VRAI : l'assertion passait vacuement. On exige l'existence d'abord.
    const gateCloseIdx = source.indexOf('</FeatureGate>')
    assert.ok(gateCloseIdx >= 0, 'le FeatureGate doit être refermé')
    assert.ok(
      gateCloseIdx < loopIdx,
      'la card branding gatée doit rester avant (et hors de) la boucle des sections'
    )
  })
})
