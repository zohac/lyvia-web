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

  test('AC-1: chaque section éditable rend un USwitch lié à isSectionOn(section) avec le label "Visible sur ma page"', () => {
    const source = readCoachPage()
    // Round PO 2026-05-01 : le switch est dans un header de card commun (pas dans chaque
    // <template v-if="section === ...">). Il y a UN header commun par card éditeur :
    //   <div ...><h2>{{ sectionLabel(section) }}</h2><label><span>Visible sur ma page</span><USwitch ... /></label></div>
    // On vérifie le pattern global (template + label).
    assert.match(
      source,
      /<USwitch\s[\s\S]*?:model-value="isSectionOn\(section\)"[\s\S]*?@update:model-value="\(v: boolean\) => onToggleSection\(section, v\)"/,
      'Le USwitch dans le header partagé doit être lié à isSectionOn(section) + @update:model-value="onToggleSection(section, v)"'
    )
    // Le label "Visible sur ma page" est verbatim (round PO).
    assert.match(
      source,
      />Visible sur ma page</,
      'Le label "Visible sur ma page" doit accompagner chaque USwitch (round PO 2026-05-01)'
    )
    // Le header commun éditeur apparaît bien — la section "Identité de marque"
    // n'a PLUS de switch depuis le round UX 2026-05-01 (config foundationnelle
    // toujours active avec fallback Keova, le switch n'avait pas de sens).
    const switchOccurrences = (source.match(/<USwitch\s/g) ?? []).length
    assert.ok(
      switchOccurrences >= 2,
      `Au moins 2 USwitch attendus (header partagé éditeur + external pricing), trouvé : ${switchOccurrences}`
    )
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

  test('AC-1: contenu de l\'éditeur est collapse quand la section est off (v-if="isSectionOn(section)" sur le wrapper)', () => {
    const source = readCoachPage()
    // Round PO 2026-05-01 : la structure a été simplifiée — un seul <template v-if="isSectionOn(section)">
    // par card englobe contenu + footer (au lieu d\'un v-if par bloc interne). On vérifie qu\'il
    // existe au moins 1 occurrence de ce pattern + 1 dans le branding card.
    const matches = source.match(/v-if="isSectionOn\(section\)"|v-if="isSectionOn\('branding'\)"/g) ?? []
    assert.ok(
      matches.length >= 2,
      `Au moins 2 v-if="isSectionOn(...)" attendus (1 wrapper card éditeur + 1 wrapper branding), trouvé : ${matches.length}`
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
    assert.match(source, /\bupdateAccount\(\{\s*testimonialsJson:\s*filtered\s*\}\)/)
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
