/**
 * Story 18.3b — Application du feature gating sur `/provider/coach-page`.
 *
 * Deux mécanismes DIFFÉRENTS, verrouillés ici :
 *   1. « Identité de marque » → section 100 % premium, ENVELOPPÉE dans
 *      `<FeatureGate feature="white_label_branding">` (remplacement complet).
 *   2. Sélecteur de template → verrouillage CARTE PAR CARTE, parce que la
 *      section mélange le template Standard (toujours accessible, exigence PRD)
 *      et d'éventuels templates premium. Un wrap de section bloquerait aussi
 *      le Standard.
 *
 * Convention A32 : les assertions portent sur `app/pages/provider/coach-page.vue`
 * réellement rendu, jamais sur une copie. Le COMPORTEMENT du gating (règle
 * `code !== 'essentiel'`, politique par statut) est couvert unitairement par
 * `tests/plans/template-lock.test.ts` — ce fichier verrouille le CÂBLAGE.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

const appRoot = path.resolve(process.cwd(), 'app')
const COACH_PAGE_PATH = 'pages/provider/coach-page.vue'

function readCoachPage(): string {
  return fs.readFileSync(path.join(appRoot, COACH_PAGE_PATH), 'utf8')
}

/**
 * Source débarrassée des commentaires HTML et JSDoc.
 *
 * Indispensable pour les assertions « ce mot ne doit PAS apparaître » : les
 * docblocks du gating citent les codes de features et le mot « premium » en
 * toutes lettres, et feraient échouer une recherche brute.
 */
function readCoachPageCode(): string {
  return readCoachPage()
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('18.3b — imports explicites (app/features/** n\'est pas auto-importé)', () => {
  test('REGRESSION: FeatureGate est importé depuis components/molecules', () => {
    // Le composant vit sous app/components/ et NON app/features/ : les
    // `@source` de dashboard.css ne couvrent pas app/features/**, les classes
    // Tailwind y seraient purgées en silence.
    assert.match(
      readCoachPage(),
      /import FeatureGate from '~\/components\/molecules\/FeatureGate\.vue'/
    )
  })

  test('REGRESSION: useFeatureGate et le helper de verrouillage sont importés explicitement', () => {
    const source = readCoachPage()
    assert.match(source, /import \{ useFeatureGate \} from '~\/features\/plans\/useFeatureGate'/)
    assert.match(
      source,
      /import \{[\s\S]*?isTemplateLocked[\s\S]*?\} from '~\/features\/plans\/domain\/template-lock'/
    )
    assert.match(
      source,
      /import \{ FEATURE_COACH_PAGE_PREMIUM_TEMPLATES \} from '~\/features\/plans\/domain\/feature-codes'/
    )
  })

  test('REGRESSION: aucun littéral de code feature dans le code (hors prop typée)', () => {
    // Checklist Clean Architecture 18.3b. Seule exception assumée :
    // `<FeatureGate feature="white_label_branding">`, dont la prop est typée
    // `PlanFeatureCode` — une faute de frappe échoue au typecheck.
    const code = readCoachPageCode()
    assert.doesNotMatch(code, /'coach_page_premium_templates'/)
    assert.doesNotMatch(code, /'white_label_branding'/)
    const featureAttrs = [...code.matchAll(/feature="([a-z_]+)"/g)].map(m => m[1])
    assert.deepEqual(featureAttrs, ['white_label_branding'])
  })
})

describe('18.3b AC #1/#3 — la section « Identité de marque » est enveloppée', () => {
  test('REGRESSION: <FeatureGate feature="white_label_branding"> entoure la section branding', () => {
    // Source SANS commentaires : une mention de `id="section-branding"` ou de
    // `<FeatureGate>` dans un docblock satisferait ces recherches sans qu'aucun
    // markup n'existe. Le cas s'est produit pendant l'implémentation 18.3b et
    // n'a été révélé que par mutation.
    const source = readCoachPageCode()

    const anchorIdx = source.indexOf('id="section-branding"')
    const gateOpenIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    const sectionIdx = source.indexOf('<section', gateOpenIdx)
    const headingIdx = source.indexOf('Identité de marque', sectionIdx)
    const sectionCloseIdx = source.indexOf('</section>', headingIdx)
    const gateCloseIdx = source.indexOf('</FeatureGate>', sectionCloseIdx)

    assert.ok(anchorIdx >= 0, 'l\'ancre #section-branding doit exister')
    assert.ok(gateOpenIdx >= 0, '<FeatureGate feature="white_label_branding"> doit exister')
    assert.ok(sectionIdx >= 0, 'le <section> branding doit suivre l\'ouverture du gate')
    assert.ok(headingIdx >= 0, 'le titre « Identité de marque » doit vivre DANS le gate')
    assert.ok(gateCloseIdx >= 0, 'le gate doit se refermer après la section')

    // Ordre strict : ancre → <FeatureGate> → <section> → titre → </section> → </FeatureGate>
    assert.ok(
      anchorIdx < gateOpenIdx
      && gateOpenIdx < sectionIdx
      && sectionIdx < headingIdx
      && headingIdx < sectionCloseIdx
      && sectionCloseIdx < gateCloseIdx,
      'la section branding doit être strictement imbriquée dans le FeatureGate'
    )
  })

  test('REGRESSION: l\'ancre #section-branding vit sur le WRAPPER, pas dans le gate', () => {
    // Convention « ancres conditionnelles » (retro Feature Y) : le lock panel
    // remplace la section, donc une ancre posée à l'intérieur disparaîtrait
    // pour une provider Essentiel — lien mort silencieux.
    const source = readCoachPageCode()
    const anchorIdx = source.indexOf('id="section-branding"')
    const gateIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    assert.ok(anchorIdx >= 0, 'l\'ancre doit exister dans le MARKUP (hors commentaires)')
    assert.ok(
      anchorIdx < gateIdx,
      'id="section-branding" doit précéder <FeatureGate> (wrapper rendu dans les 2 états)'
    )
  })

  test('REGRESSION: les champs premium restent DANS le gate (rien de focusable hors gate)', () => {
    const source = readCoachPage()
    const gateOpenIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    const gateCloseIdx = source.indexOf('</FeatureGate>', gateOpenIdx)
    const gated = source.slice(gateOpenIdx, gateCloseIdx)

    for (const marker of [
      'v-model="brandingForm.brandName"',
      'id="brandName"',
      'data-testid="brand-logo-upload-cta"',
      '@click="handleBrandingSubmit"'
    ]) {
      assert.ok(gated.includes(marker), `${marker} doit rester à l'intérieur du FeatureGate`)
      assert.equal(
        source.indexOf(marker),
        gateOpenIdx + gated.indexOf(marker),
        `${marker} ne doit exister QU'À L'INTÉRIEUR du FeatureGate`
      )
    }
  })

  test('AC #1: les autres sections de l\'éditeur restent hors du gate', () => {
    // Zéro régression : seule « Identité de marque » est gatée. Le sélecteur de
    // template et les sections publiques doivent rester en dehors.
    const source = readCoachPage()
    const gateOpenIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    const gateCloseIdx = source.indexOf('</FeatureGate>', gateOpenIdx)
    const gated = source.slice(gateOpenIdx, gateCloseIdx)

    assert.ok(!gated.includes('v-for="tmpl in templateCards"'), 'le sélecteur de template ne doit pas être gaté')
    assert.ok(!gated.includes('orderedEditableSections'), 'les sections publiques ne doivent pas être gatées')
    assert.ok(!gated.includes('CoachPagePreviewPanel'), 'la preview ne doit pas être gatée')

    // Un seul FeatureGate sur la page (une seule surface gatée). Compté sur la
    // source SANS commentaires : les docblocks citent `<FeatureGate>` pour
    // expliquer pourquoi le sélecteur de template, lui, n'en est pas enveloppé.
    const code = readCoachPageCode()
    assert.equal((code.match(/<FeatureGate\b/g) ?? []).length, 1)
    assert.equal((code.match(/<\/FeatureGate>/g) ?? []).length, 1)
  })
})

describe('18.3b AC #2 — verrouillage par carte du sélecteur de template', () => {
  test('REGRESSION: le verrou est calculé UNE fois par carte via le helper pur', () => {
    // Checklist DRY intra-story : pas de recalcul dans le template.
    const source = readCoachPage()
    assert.match(source, /const templateCards = computed\(/)
    assert.match(source, /locked: isTemplateLocked\(tmpl, hasPremiumTemplates\.value\)/)
    assert.match(source, /v-for="tmpl in templateCards"/)
  })

  test('REGRESSION: l\'accès premium passe par resolvePremiumTemplatesAccess (unknown = non verrouillé)', () => {
    // Sans ce helper, `status === 'unknown'` produirait un flash lock→unlock à
    // chaque chargement de l'éditeur.
    const source = readCoachPage()
    assert.match(source, /const hasPremiumTemplates = computed\(\(\) =>\s*\n\s*resolvePremiumTemplatesAccess\(/)
    assert.match(source, /gate\.status\.value,/)
    assert.match(source, /gate\.hasFeature\(FEATURE_COACH_PAGE_PREMIUM_TEMPLATES\)/)
  })

  test('REGRESSION: la carte verrouillée est désactivée et grisée', () => {
    const source = readCoachPage()
    assert.match(source, /:disabled="saving \|\| tmpl\.locked"/)
    assert.match(source, /tmpl\.locked \? 'cursor-not-allowed opacity-60' : ''/)
  })

  test('REGRESSION: onSelectTemplate porte une garde early-return (le clic ne part jamais en API)', () => {
    // Défense en profondeur : `disabled` seul ne couvre pas un appel
    // programmatique ni une course avec la résolution du plan.
    const source = readCoachPage()
    const start = source.indexOf('async function onSelectTemplate')
    assert.ok(start >= 0, 'onSelectTemplate doit exister')
    const body = source.slice(start, source.indexOf('\n}', start))

    const guardIdx = body.indexOf('if (target && isTemplateLocked(target, hasPremiumTemplates.value)) return')
    const saveIdx = body.indexOf('await saveTemplate(')
    assert.ok(guardIdx >= 0, 'la garde de verrouillage doit exister dans onSelectTemplate')
    assert.ok(saveIdx >= 0, 'onSelectTemplate doit appeler saveTemplate')
    assert.ok(guardIdx < saveIdx, 'la garde doit précéder l\'appel API')
  })

  test('REGRESSION: la pastille affiche « Premium » via la constante, avec icône lock', () => {
    const source = readCoachPage()
    assert.match(source, /v-if="tmpl\.locked"/)
    assert.match(source, /\{\{ PREMIUM_TEMPLATE_BADGE_LABEL \}\}/)
    assert.match(source, /data-testid="coach-template-premium-badge"/)

    const badgeIdx = source.indexOf('data-testid="coach-template-premium-badge"')
    const badgeBlock = source.slice(badgeIdx, badgeIdx + 400)
    assert.match(badgeBlock, /name="i-lucide-lock"/)

    // Aucun littéral « Premium » ne doit doubler la constante.
    assert.doesNotMatch(readCoachPageCode(), />\s*Premium\s*</)
  })

  test('REGRESSION: la pastille et le check de sélection occupent des positions distinctes', () => {
    // Un template verrouillé n'est jamais le template sélectionné, donc les
    // deux ne coexistent pas — mais les positions restent séparées pour que la
    // lecture du code ne laisse aucun doute.
    const source = readCoachPage()
    const badgeIdx = source.indexOf('data-testid="coach-template-premium-badge"')
    const badgeBlock = source.slice(Math.max(0, badgeIdx - 400), badgeIdx)
    assert.match(badgeBlock, /absolute right-2 top-2/)

    const checkIdx = source.indexOf('name="i-lucide-check-circle"')
    const checkBlock = source.slice(Math.max(0, checkIdx - 300), checkIdx)
    assert.match(checkBlock, /absolute right-3 top-3/)
  })

  test('AC #2: le gate est amorcé par la page (le sélecteur n\'est pas enveloppé)', () => {
    const source = readCoachPage()
    assert.match(source, /const gate = useFeatureGate\(\)/)
    assert.match(source, /void gate\.ensureLoaded\(\)/)
  })
})

describe('18.3b Task 4 — audit ghost vars CSS (Convention DS1, étendue DS2)', () => {
  test('REGRESSION: chaque var(--x) de la page est définie dans app/assets/css', () => {
    // Une var non définie est *invalid at computed-value time* : la déclaration
    // retombe silencieusement sur sa valeur initiale. Ni lint, ni typecheck, ni
    // les tests de rendu ne l'attrapent. C'est ainsi que `--color-status-error`
    // (jamais définie, 7 occurrences) cassait le hover des boutons de
    // suppression jusqu'à cet audit.
    const cssRoot = path.join(appRoot, 'assets/css')
    const declarations = fs
      .readdirSync(cssRoot)
      .filter(file => file.endsWith('.css'))
      .map(file => fs.readFileSync(path.join(cssRoot, file), 'utf8'))
      .join('\n')

    const used = [
      ...new Set(
        [...readCoachPage().matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
          match => match[1] as string
        )
      )
    ]

    assert.ok(used.length > 0, 'la page doit consommer des tokens CSS')

    const missing = used.filter(
      name => !new RegExp(`${name}\\s*:`).test(declarations)
    )
    assert.deepEqual(
      missing,
      [],
      `vars CSS référencées mais jamais définies : ${missing.join(', ')}`
    )
  })
})
