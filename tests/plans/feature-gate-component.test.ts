/**
 * Story 18.2 — Tests structurels de `FeatureGate.vue`.
 *
 * Convention A32 : les assertions portent sur le fichier réellement rendu, pas
 * sur une copie. Pas de montage DOM (le runner Node n'a pas de renderer Vue) —
 * le comportement pur est couvert par `create-feature-gate.test.ts`, ce fichier
 * verrouille le câblage et le wording.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

const appRoot = path.resolve(process.cwd(), 'app')
const COMPONENT_PATH = 'components/molecules/FeatureGate.vue'

function readComponent(): string {
  return fs.readFileSync(path.join(appRoot, COMPONENT_PATH), 'utf8')
}

/**
 * Source débarrassée des commentaires HTML et JSDoc.
 *
 * Indispensable pour les assertions « ce mot ne doit pas apparaître » : les
 * docblocks du composant expliquent précisément pourquoi le blur et
 * `aria-hidden`/`inert` sont écartés, et feraient échouer une recherche brute.
 */
function readComponentCode(): string {
  return readComponent()
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('FeatureGate.vue — emplacement', () => {
  test('REGRESSION: le composant vit sous app/components/ (purge Tailwind)', () => {
    // Les @source de dashboard.css ne couvrent que app/components/**,
    // app/layouts/** et app/pages/**. Sous app/features/, les classes seraient
    // purgées silencieusement : le composant s'afficherait sans style.
    assert.ok(
      fs.existsSync(path.join(appRoot, COMPONENT_PATH)),
      'FeatureGate.vue doit rester dans app/components/molecules/'
    )
    assert.ok(
      !fs.existsSync(path.join(appRoot, 'features/plans/FeatureGate.vue')),
      'Aucun .vue ne doit vivre sous app/features/plans/'
    )
  })

  test('dashboard.css couvre bien app/components/**', () => {
    const css = fs.readFileSync(
      path.join(appRoot, 'assets/css/dashboard.css'),
      'utf8'
    )
    assert.match(css, /@source\s+"\.\.\/\.\.\/app\/components\/\*\*\/\*\.vue"/)
  })
})

describe('FeatureGate.vue — câblage', () => {
  test('déclare une prop `feature` typée PlanFeatureCode', () => {
    const source = readComponent()
    assert.match(
      source,
      /defineProps<\{\s*feature:\s*PlanFeatureCode\s*\}>\(\)/
    )
    assert.match(
      source,
      /import type \{ PlanFeatureCode \} from '~\/features\/plans\/domain\/feature-codes'/
    )
  })

  test('consomme useFeatureGate et déclenche lui-même le chargement', () => {
    const source = readComponent()
    assert.match(
      source,
      /import \{ useFeatureGate \} from '~\/features\/plans\/useFeatureGate'/
    )
    assert.match(source, /const \{ status, hasFeature, ensureLoaded \} = useFeatureGate\(\)/)
    assert.match(source, /void ensureLoaded\(\)/)
  })

  test('REGRESSION: status "unknown" ne rend NI le slot NI le lock (pas de flash)', () => {
    const source = readComponent()
    assert.match(source, /v-if="status !== 'unknown'"/)
    // Le slot est conditionné par le déverrouillage, à l'intérieur de ce garde.
    assert.match(source, /<slot v-if="unlocked" \/>/)
    assert.match(source, /const unlocked = computed\(\(\) => hasFeature\(props\.feature\)\)/)
  })

  test('REGRESSION: le contenu premium est REMPLACÉ, jamais flouté', () => {
    // Un overlay flouté laisserait du contenu focusable derrière ; le v-else
    // garantit que rien de premium n'est monté.
    assert.match(readComponent(), /v-else/)

    const code = readComponentCode()
    assert.doesNotMatch(code, /class="[^"]*\b(backdrop-)?blur\b/)
    assert.doesNotMatch(code, /aria-hidden=/)
    assert.doesNotMatch(code, /\sinert[\s>=]/)
  })
})

describe('FeatureGate.vue — panneau lock (wording A31)', () => {
  test('icône lock dans un rond highlight (squelette DsEmptyState)', () => {
    const source = readComponent()
    assert.match(source, /name="i-lucide-lock"/)
    assert.match(source, /rounded-full bg-\[color:var\(--color-surface-highlight\)\]/)
  })

  test('REGRESSION: titre et CTA viennent de feature-gate-copy, jamais en dur', () => {
    const source = readComponent()
    assert.match(
      source,
      /from '~\/features\/plans\/domain\/feature-gate-copy'/
    )
    assert.match(source, /featureGateLockTitle\(props\.feature\)/)
    assert.match(source, /\{\{ FEATURE_GATE_CTA_LABEL \}\}/)
    // Aucune chaîne littérale ne doit doubler les constantes.
    const code = readComponentCode()
    assert.doesNotMatch(code, /Disponible avec le plan/)
    assert.doesNotMatch(code, /Contactez Keova/)
    assert.doesNotMatch(code, /contact@keova\.fr/)
  })

  test('CTA = lien mailto avec icône lucide:mail (verbatim CoachUnavailableTemplate)', () => {
    const source = readComponent()
    assert.match(source, /<a\s+:href="KEOVA_CONTACT_MAILTO"/)
    assert.match(source, /name="lucide:mail"/)
  })

  test('tokens neutres uniquement', () => {
    const source = readComponent()
    assert.match(source, /--color-border-subtle/)
    assert.match(source, /--color-surface-card/)
    assert.match(source, /--color-text-primary/)
    assert.match(source, /--color-text-muted/)
  })
})
