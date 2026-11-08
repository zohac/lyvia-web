import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-26 → Story 0-27 — wiring tests for the brand identity section
 * (`brandName` text input + `brand_logo` upload widget) on
 * `/provider/coach-page`.
 *
 * History:
 *   - 0-20c    introduced the brandName + logoUrl form on /provider/account
 *   - 0-26     migrated the section to /provider/coach-page
 *   - 0-27     replaces the `logoUrl` URL input by an upload widget
 *              (POST /provider/assets/upload type=brand_logo). The branding
 *              form now persists `brandName` only via PATCH /provider/account.
 *              The logo is upload-driven (instant POST) + delete-driven (PATCH
 *              with `logoUrl: null`).
 *
 * Convention A32: tests target the real editor.
 *
 * CPD.10 — l'éditeur a quitté `app/pages/provider/coach-page.vue` (13 lignes,
 * simple composition) pour `app/components/organisms/CoachPageEditorShell.vue`.
 * La garde suit le markup : elle lit la coquille, pas la page vidée.
 *
 * Convention A35: browser check via MCP Chrome DevTools complements these
 * structural tests.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const COACH_PAGE_PATH = 'components/organisms/CoachPageEditorShell.vue'
const BRANDING_CARD_PATH = 'components/organisms/CoachPageBrandingCard.vue'
const ACCOUNT_PAGE_PATH = 'pages/provider/account.vue'
const CONTRACT_PATH = 'features/account/api/provider-account.contract.ts'

function readCoachPage(): string {
  return fs.readFileSync(path.join(appRoot, COACH_PAGE_PATH), 'utf-8')
}

function readBrandingCard(): string {
  return fs.readFileSync(path.join(appRoot, BRANDING_CARD_PATH), 'utf-8')
}

function readAccountPage(): string {
  return fs.readFileSync(path.join(appRoot, ACCOUNT_PAGE_PATH), 'utf-8')
}

function readContract(): string {
  return fs.readFileSync(path.join(appRoot, CONTRACT_PATH), 'utf-8')
}

describe('0-27 — /provider/coach-page brand identity section (brandName + brand_logo upload widget)', () => {
  test('AC-1 (0-26): contract still exposes brandName + logoUrl on response and PATCH request', () => {
    const source = readContract()
    // Response side
    assert.match(source, /ProviderAccountResponse[\s\S]*?brandName:\s*string\s*\|\s*null/)
    assert.match(source, /ProviderAccountResponse[\s\S]*?logoUrl:\s*string\s*\|\s*null/)
    // Request side (optional + nullable — required for `logoUrl: null` delete flow)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?brandName\?:\s*string\s*\|\s*null/)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?logoUrl\?:\s*string\s*\|\s*null/)
  })

  test('AC-2 (0-27): coach-page renders the brand identity section with brandName + upload widget', () => {
    const page = readCoachPage()
    assert.match(page, /Identité de marque/)
    assert.match(
      page,
      /Logo et nom affichés dans le header de votre page publique et dans tous les emails envoyés à vos clientes\./,
      'le sous-titre de la section reste porté par la page, hors du gate'
    )

    // CPD.6 — le markup du branding (champ, compteur, input file, CTA, widget
    // trois états) est désormais prouvé par RENDU dans
    // `cpd-6-branding-palette.test.ts` (AC-2/AC-3). Ce fichier ne garde que la
    // frontière du gate et le câblage de page.
    assert.ok(
      !/v-model="brandingForm\.logoUrl"/.test(page),
      '0-27: brandingForm.logoUrl URL input must be removed (replaced by upload widget)'
    )
  })

  test('AC-2 (0-27): hydration of brandName from account data lives in the watch', () => {
    const source = readCoachPage()
    // brandName still hydrated from acc.brandName
    assert.match(source, /brandingForm\.brandName\s*=\s*acc\.brandName\s*\?\?\s*''/)
    // logoUrl is no longer in brandingForm — it is read directly from
    // `account.value.logoUrl` via the `logoServerUrl` computed.
    assert.match(
      source,
      /logoServerUrl\s*=\s*computed\(\s*\(\)\s*=>\s*uploadedLogoUrl\.value\s*\?\?\s*account\.value\?\.logoUrl/,
      '0-27/CPD.6: logoServerUrl must prefer the freshly uploaded URL then account.value.logoUrl'
    )
  })

  test('AC-3 (0-27): le statut de la section reflète hasBrandLogo', () => {
    const page = readCoachPage()
    // CPD.6 — les deux aperçus et la priorité de `logoPreviewSrc` sont prouvés
    // par rendu (`cpd-6-branding-palette.test.ts`) ; il reste ici la pastille,
    // qui vit dans la page, hors du gate.
    assert.match(page, /hasBrandLogo/)
    assert.match(page, /'Personnalisée'\s*:\s*'Keova par défaut'/)
  })

  test('AC-5 (0-27): la suppression persiste logoUrl: null', () => {
    const page = readCoachPage()
    const card = readBrandingCard()
    // CPD.6 — « Remplacer » / « Supprimer » sont prouvés par rendu dans
    // `cpd-6-branding-palette.test.ts`. Ici on garde la persistance de page.
    assert.match(card, /emit\('logo-removed'\)/, 'la carte émet logo-removed')
    assert.match(
      page,
      /updateAccount\(\{\s*logoUrl:\s*null\s*\}\)/,
      '0-27 AC-5: delete must PATCH /provider/account with { logoUrl: null }'
    )
    // Toasts verbatim per AC-5
    assert.match(page, /title:\s*'Logo téléversé'/, '0-27 AC-5 verbatim toast: "Logo téléversé"')
    assert.match(page, /title:\s*'Logo supprimé'/, '0-27 AC-5 verbatim toast: "Logo supprimé"')
  })

  test('AC-4 (0-26 + 0-27 refactor): handleBrandingSubmit saves brandName only (logo is upload-driven)', () => {
    const source = readCoachPage()
    assert.match(source, /async function handleBrandingSubmit\(\)/)
    // brandName is still trimmed + null-fallback
    assert.match(source, /brandName:\s*brandingForm\.brandName\.trim\(\)\s*\|\|\s*null/)
    // 0-27 — logoUrl is NO LONGER passed to handleBrandingSubmit's updateAccount call;
    // the logo flow is handled by handleLogoUpload (POST asset) + handleLogoDelete (PATCH null).
    const handlerStart = source.indexOf('async function handleBrandingSubmit')
    const handlerEnd = source.indexOf('\n}', handlerStart)
    const handlerSlice = source.slice(handlerStart, handlerEnd)
    assert.ok(
      !/logoUrl:/.test(handlerSlice),
      '0-27: handleBrandingSubmit must NOT include logoUrl (upload-driven only)'
    )
  })

  test('AC-4: success toast wording matches the ticket verbatim ("Informations enregistrées")', () => {
    const source = readCoachPage()
    const handlerStart = source.indexOf('async function handleBrandingSubmit')
    assert.ok(handlerStart >= 0, 'handleBrandingSubmit must exist in coach-page.vue')
    const handlerEnd = source.indexOf('\n}', handlerStart)
    const handlerSlice = source.slice(handlerStart, handlerEnd)
    assert.ok(
      /title:\s*'Informations enregistrées'/.test(handlerSlice),
      'AC-4 verbatim — toast title must be "Informations enregistrées" in handleBrandingSubmit'
    )
  })

  test('AC-4: branding card save button is wired to handleBrandingSubmit', () => {
    // Story 18.3b — la section est désormais ENVELOPPÉE dans
    // `<FeatureGate feature="white_label_branding">`, et `id="section-branding"`
    // a migré sur le wrapper (rendu verrouillé ou non). Ce test délimite donc
    // le bloc depuis l'ouverture du gate, et non plus depuis l'ancre.
    const source = readCoachPage()
    const gateIdx = source.indexOf('<FeatureGate feature="white_label_branding">')
    assert.ok(gateIdx >= 0, '18.3b: la section branding doit vivre dans un <FeatureGate>')
    const tail = source.slice(gateIdx)
    const closingIdx = tail.indexOf('</FeatureGate>')
    const block = closingIdx >= 0 ? tail.slice(0, closingIdx) : tail
    // 🚨 CR 18.3b — le `<section>` et son titre vivent désormais HORS du gate
    // (la section reste nommée verrouillée) ; seul le CORPS est gaté. On
    // vérifie donc que la section ENVELOPPE le gate, et que les champs
    // premium, eux, restent bien à l'intérieur.
    const sectionIdx = source.lastIndexOf('<section', gateIdx)
    assert.ok(sectionIdx >= 0 && sectionIdx < gateIdx, 'le <section> branding doit envelopper le gate')
    assert.match(block, /@save="handleBrandingSubmit"/)
  })

  test('AC-2 (18.3b): la section branding est gatée par white_label_branding', () => {
    // Le contenu de la section n'est PAS supprimé du source (il reste éditable
    // pour Sophie/Premium) : seul son RENDU devient conditionnel. Les
    // assertions AC-2/AC-3/AC-5 ci-dessus continuent donc de porter, et ce test
    // ajoute la garantie que le wrap existe bien.
    const source = readCoachPage()
    // CR 18.3b — MARKUP (commentaires retirés) dès la première assertion : le
    // garde-fou posé dans le source ne couvrait que `id="section-branding"`, pas
    // la chaîne `<FeatureGate feature="…">`. Une mention en commentaire aurait
    // suffi à rendre ces assertions vacantes.
    const markup = source.replace(/<!--[\s\S]*?-->/g, '')
    assert.match(source, /import FeatureGate from '~\/components\/molecules\/FeatureGate\.vue'/)
    assert.match(markup, /<FeatureGate feature="white_label_branding">/)

    // L'ancre survit au verrouillage : elle est sur le wrapper, hors du gate.
    const anchorIdx = markup.indexOf('id="section-branding"')
    assert.ok(anchorIdx >= 0, 'l\'ancre #section-branding doit exister dans le markup')
    assert.ok(
      anchorIdx < markup.indexOf('<FeatureGate feature="white_label_branding">'),
      'id="section-branding" doit rester rendu dans les deux états (wrapper hors gate)'
    )
  })

  test('AC-6 (0-26): the branding section is NO LONGER on /provider/account', () => {
    const source = readAccountPage()
    assert.ok(
      !source.includes('Identité affichée dans vos emails'),
      'Section must be removed from /provider/account (migrated to /provider/coach-page)'
    )
    assert.ok(
      !source.includes('brandingForm'),
      'brandingForm state must be removed from /provider/account'
    )
    assert.ok(
      !source.includes('handleBrandingSubmit'),
      'handleBrandingSubmit handler must be removed from /provider/account'
    )
  })
})
