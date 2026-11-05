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

  test('AC-3: tous les <UTextarea> de la page ont la classe w-full', () => {
    const source = readCoachPage()
    // Match every <UTextarea ...> opening tag (with attributes spanning multiple lines).
    const textareaPattern = /<UTextarea\b[^>]*?(?:\n[^>]*?)*?>/g
    const matches = source.match(textareaPattern) ?? []
    assert.ok(matches.length > 0, 'La page doit contenir au moins un <UTextarea>')
    for (const tag of matches) {
      assert.ok(
        /class="[^"]*\bw-full\b/.test(tag),
        `Chaque UTextarea doit avoir w-full dans sa class — manquant sur : ${tag.slice(0, 200)}`
      )
    }
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-4 — Éditeur bio (Qui suis-je) inline
  // ─────────────────────────────────────────────────────────────────────

  test('AC-4: éditeur "Qui suis-je" inline édite `longBio` (5000 chars) + `city` + `region` (rapatriés depuis Mon compte)', () => {
    const source = readCoachPage()
    // Round 2026-05-01 — fix terrain Sophie (962 chars rejetés en 422 sur `bio` qui plafonne à 500) :
    // l'éditeur cible désormais `longBio` (5000 chars). + rapatriement city/region depuis
    // /provider/account section "Profil professionnel" (single source of truth pour identité géo).
    assert.match(source, /v-model="bioForm\.longBio"/)
    assert.match(source, /v-model="bioForm\.city"/)
    assert.match(source, /v-model="bioForm\.region"/)
    assert.match(source, /LONG_BIO_MAX_LENGTH\s*=\s*5000/)
    // Handler onSaveBio.
    assert.match(source, /async function onSaveBio\(\)/)
    // Appel updateAccount avec longBio + city + region + trim/null fallback.
    // (story 0-26 round terrain — updateAccount désormais exposé par useCoachPageEditor,
    // un SEUL store providerAccount partagé, plus de double instance non synchronisée).
    assert.match(source, /\bupdateAccount\(\{[\s\S]*?longBio:[\s\S]*?city:[\s\S]*?region:[\s\S]*?\}\)/)
    // Toast succès verbatim (round PO 2026-05-01 : harmonisation "...enregistré(e)(s)" partout).
    assert.match(source, /'Qui suis-je enregistré'/)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-5 — Éditeur testimonials inline
  // ─────────────────────────────────────────────────────────────────────

  test('AC-5: éditeur testimonials inline (testimonialsForm + add/remove + onSaveTestimonials)', () => {
    const source = readCoachPage()
    assert.match(source, /testimonialsForm\s*=\s*ref<TestimonialItem\[\]>/)
    assert.match(source, /function addTestimonial\(\)/)
    assert.match(source, /function removeTestimonial\(/)
    assert.match(source, /async function onSaveTestimonials\(\)/)
    // Persist via updateAccount (exposé directement par useCoachPageEditor — story 0-26 round terrain).
    assert.match(source, /\bupdateAccount\(\{[\s\S]*?testimonialsJson:\s*filtered[\s\S]*?\}\)/)
    // Limite max alignée sur la constante TESTIMONIALS_MAX (10 — pattern existant /provider/account).
    assert.match(source, /TESTIMONIALS_MAX\s*=\s*10/)
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
