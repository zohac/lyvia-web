import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  PLAN_SELECT_ITEMS,
  DEFAULT_PLAN_SLUG,
  getPlanBadgeVariant
} from '../../app/features/admin/providers/plan-select'

/**
 * Story 15-5 — sélecteur de plan admin provider (AC-6, AC-7).
 *
 * Deux niveaux :
 * - **comportemental** sur `plan-select.ts` (helpers purs) — ces tests tombent
 *   si un slug/label dérive ou si le mapping badge change ;
 * - **structurel** sur les `.vue` (pas de DOM-mount dans ce projet) — ils
 *   ciblent les lignes exactes du wiring décrit par les ACs : v-model, items,
 *   endpoint PATCH, wording verbatim des toasts (Convention A31).
 */

const appRoot = path.resolve(process.cwd(), 'app')

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('15-5 — plan-select.ts (comportemental)', () => {
  test('expose exactement les 3 plans beta, dans l\'ordre, avec les labels verbatim', () => {
    assert.equal(PLAN_SELECT_ITEMS.length, 3)
    assert.deepEqual(
      PLAN_SELECT_ITEMS.map(i => i.value),
      ['essentiel', 'premium', 'fondatrice']
    )
    assert.deepEqual(
      PLAN_SELECT_ITEMS.map(i => i.label),
      ['Essentiel', 'Premium', 'Fondatrice']
    )
  })

  test('aucun item n\'a de valeur vide (USelect Reka UI crash sur value: "")', () => {
    for (const item of PLAN_SELECT_ITEMS) {
      assert.notEqual(item.value as string, '')
      assert.ok(item.value.length > 0)
    }
  })

  test('le plan par défaut est essentiel et fait partie des items', () => {
    assert.equal(DEFAULT_PLAN_SLUG, 'essentiel')
    assert.ok(PLAN_SELECT_ITEMS.some(i => i.value === DEFAULT_PLAN_SLUG))
  })

  test('getPlanBadgeVariant mappe fondatrice→warning, premium→success, essentiel→neutral', () => {
    assert.equal(getPlanBadgeVariant('fondatrice'), 'warning')
    assert.equal(getPlanBadgeVariant('premium'), 'success')
    assert.equal(getPlanBadgeVariant('essentiel'), 'neutral')
  })

  test('getPlanBadgeVariant retombe sur neutral pour un slug inconnu, null ou undefined', () => {
    assert.equal(getPlanBadgeVariant('decouverte'), 'neutral')
    assert.equal(getPlanBadgeVariant(null), 'neutral')
    assert.equal(getPlanBadgeVariant(undefined), 'neutral')
  })
})

describe('15-5 — AdminProviderCreateDrawer.vue (AC-6)', () => {
  const DRAWER_PATH = 'components/organisms/AdminProviderCreateDrawer.vue'

  test('le USelect Plan est branché sur form.planSlug et sur PLAN_SELECT_ITEMS partagé', () => {
    const source = readSource(DRAWER_PATH)
    assert.match(source, /v-model="form\.planSlug"/)
    assert.match(source, /:items="PLAN_SELECT_ITEMS"/)
    assert.match(source, /value-key="value"/)
    assert.match(source, /label="Plan"/)
  })

  test('les items viennent du fichier partagé, pas d\'une liste redéclarée localement', () => {
    const source = readSource(DRAWER_PATH)
    assert.match(
      source,
      /import\s*\{[^}]*PLAN_SELECT_ITEMS[^}]*\}\s*from\s*'~\/features\/admin\/providers\/plan-select'/
    )
    // DRY : aucun label de plan écrit en dur dans le composant.
    assert.doesNotMatch(source, /label:\s*'Fondatrice'/)
  })

  test('le form est initialisé à DEFAULT_PLAN_SLUG et resetForm y revient (jamais "")', () => {
    const source = readSource(DRAWER_PATH)
    assert.match(source, /planSlug:\s*DEFAULT_PLAN_SLUG/)
    assert.match(source, /form\.planSlug\s*=\s*DEFAULT_PLAN_SLUG/)
    assert.doesNotMatch(source, /planSlug:\s*''/)
  })

  test('le planSlug sélectionné part dans le body du POST /admin/providers', () => {
    const source = readSource(DRAWER_PATH)
    assert.match(source, /planSlug:\s*form\.planSlug/)
  })
})

describe('15-5 — pages/admin/providers/[id].vue (AC-7)', () => {
  const PAGE_PATH = 'pages/admin/providers/[id].vue'

  test('le type inline AdminProviderDetail miroite le champ plan du DTO', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /plan:\s*\{\s*slug:\s*string,\s*name:\s*string\s*\}\s*\|\s*null/)
  })

  test('le badge plan de l\'en-tête passe par getPlanBadgeVariant + getStatusBadgeClasses', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /const planBadgeInfo = computed/)
    assert.match(source, /getStatusBadgeClasses\(getPlanBadgeVariant\(plan\.slug\)\)/)
    assert.match(source, /:class="planBadgeInfo\.badge"/)
  })

  test('la section « Plan d\'abonnement » existe avec son USelect et son bouton dédié', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /Plan d'abonnement/)
    assert.match(source, /v-model="selectedPlanSlug"/)
    assert.match(source, /:items="PLAN_SELECT_ITEMS"/)
    assert.match(source, /Changer le plan/)
  })

  test('le bouton est désactivé tant que la sélection égale le plan SOUSCRIT', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /:disabled="planUnchanged"/)
    assert.match(source, /if \(changingPlan\.value \|\| planUnchanged\.value\) return/)
  })

  // CR 15-5 — la comparaison doit porter sur le plan RÉELLEMENT souscrit, pas sur
  // `currentPlanSlug` qui rabat `null` sur 'essentiel' pour amorcer le select.
  // Sinon un provider sans ligne d'abonnement ne peut jamais être réparé vers
  // Essentiel depuis l'UI : le bouton reste grisé alors que la page affiche
  // « Plan actuel : Aucun », et l'upsert self-healing du backend est inatteignable.
  test('un provider sans souscription peut être basculé vers Essentiel (comparaison sur le plan souscrit)', () => {
    const source = readSource(PAGE_PATH)

    // `subscribedPlanSlug` vaut null quand `detail.plan` est absent…
    assert.match(
      source,
      /const subscribedPlanSlug = computed<PlanSlug \| null>\(\s*\(\) => \(detail\.value\?\.plan\?\.slug as PlanSlug \| undefined\) \?\? null\s*\)/
    )
    // …et c'est bien lui, pas `currentPlanSlug`, qui pilote l'état du bouton.
    assert.match(
      source,
      /const planUnchanged = computed\(\s*\(\) => selectedPlanSlug\.value === subscribedPlanSlug\.value\s*\)/
    )
    assert.doesNotMatch(source, /:disabled="selectedPlanSlug === currentPlanSlug"/)
  })

  test('selectedPlanSlug est amorcé à DEFAULT_PLAN_SLUG puis synchronisé par watch(detail)', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /const selectedPlanSlug = ref<PlanSlug>\(DEFAULT_PLAN_SLUG\)/)
    assert.match(source, /selectedPlanSlug\.value = currentPlanSlug\.value/)
  })

  test('changePlan cible PATCH /admin/providers/:id/plan et rafraîchit le détail', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /\/admin\/providers\/\$\{providerId\.value\}\/plan/)
    assert.match(source, /method:\s*'PATCH'/)
    assert.match(source, /body:\s*\{\s*planSlug:\s*selectedPlanSlug\.value\s*\}/)
    assert.match(source, /await refreshDetail\(\)/)
  })

  test('les toasts reprennent le wording verbatim des ACs (Convention A31)', () => {
    const source = readSource(PAGE_PATH)
    assert.match(source, /title:\s*'Plan mis à jour'/)
    assert.match(source, /title:\s*'Erreur lors du changement de plan'/)
    assert.match(source, /'Erreur inattendue'/)
  })

  test('le plan n\'est PAS mêlé au saveProfile() (endpoint et bouton séparés)', () => {
    const source = readSource(PAGE_PATH)
    const start = source.indexOf('async function saveProfile')
    const end = source.indexOf('// Deactivation flow')

    // Sans ces deux gardes, un renommage de `saveProfile` (ou une reformulation
    // du commentaire) faisait renvoyer -1 à `indexOf`, le `slice` produisait une
    // chaîne quasi vide et `doesNotMatch` passait sans plus rien vérifier — le
    // test censé empêcher la dérive devenait vert et muet.
    assert.notStrictEqual(start, -1, 'repère `async function saveProfile` introuvable')
    assert.notStrictEqual(end, -1, 'repère `// Deactivation flow` introuvable')
    assert.ok(end > start, 'les repères sont dans le mauvais ordre')

    const saveProfile = source.slice(start, end)
    assert.ok(saveProfile.length > 200, 'corps de saveProfile suspicieusement court')
    assert.doesNotMatch(saveProfile, /planSlug/)
  })
})
