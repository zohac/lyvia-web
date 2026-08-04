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
 * Convention A32: tests target the real `app/pages/provider/coach-page.vue`.
 * Convention A35: browser check via MCP Chrome DevTools complements these
 * structural tests.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const COACH_PAGE_PATH = 'pages/provider/coach-page.vue'
const ACCOUNT_PAGE_PATH = 'pages/provider/account.vue'
const CONTRACT_PATH = 'features/account/api/provider-account.contract.ts'

function readCoachPage(): string {
  return fs.readFileSync(path.join(appRoot, COACH_PAGE_PATH), 'utf-8')
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
    const source = readCoachPage()
    assert.match(source, /Identité de marque/)
    assert.match(
      source,
      /Logo et nom affichés dans le header de votre page publique et dans tous les emails envoyés à vos clientes\./
    )
    // brandName field with maxLength 100 + character counter wired to the form (unchanged from 0-26).
    assert.match(source, /v-model="brandingForm\.brandName"/)
    assert.match(source, /id="brandName"/)
    assert.match(source, /BRAND_NAME_MAX_LENGTH\s*=\s*100/)

    // 0-27 — the URL input is REPLACED by a file upload widget targeting `brand_logo`.
    // No more <UInput v-model="brandingForm.logoUrl" type="url">.
    assert.ok(
      !/v-model="brandingForm\.logoUrl"/.test(source),
      '0-27: brandingForm.logoUrl URL input must be removed (replaced by upload widget)'
    )
    assert.ok(
      !/LOGO_URL_MAX_LENGTH/.test(source),
      '0-27: LOGO_URL_MAX_LENGTH constant must be removed (URL input gone)'
    )
    // The upload widget must accept image MIMEs and target `brand_logo`.
    assert.match(
      source,
      /accept="image\/png,image\/jpeg,image\/webp"/,
      '0-27: file input must restrict accept to PNG/JPEG/WebP (SVG excluded)'
    )
    assert.match(
      source,
      /uploadAsset\(\s*'brand_logo'\s*,/,
      '0-27: the upload handler must POST type=brand_logo to /provider/assets/upload'
    )
    // The empty-state CTA copy is verbatim per AC-5.
    assert.match(
      source,
      /Téléverser un logo/,
      '0-27 AC-5 verbatim: empty-state CTA must read "Téléverser un logo"'
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
      /logoServerUrl\s*=\s*computed\(\s*\(\)\s*=>\s*account\.value\?\.logoUrl/,
      '0-27: logoServerUrl must be a computed reading account.value.logoUrl'
    )
  })

  test('AC-3 (0-27): logo preview tiles read from logoPreviewSrc and status pill reflects hasBrandLogo', () => {
    const source = readCoachPage()
    // The 2 preview tiles must render the composite preview src
    // (local file URL during selection, then CDN URL after upload).
    assert.match(source, /:src="logoPreviewSrc"/)
    // The legacy URL-error copy ("Impossible de charger l'image. Vérifiez l'URL.")
    // is gone since the upload pipeline rejects bad files server-side.
    assert.ok(
      !source.includes('Impossible de charger l\'image. Vérifiez l\'URL.'),
      '0-27: URL-error copy must be removed (no more URL input)'
    )
    // Info box copy adapted for upload flow.
    assert.ok(
      source.includes('Renseignez votre nom de marque et téléversez votre logo pour personnaliser votre identité. Sinon, le nom et le logo Keova sont utilisés par défaut.'),
      '0-27: info copy must mention "téléverser" instead of "URL de votre logo"'
    )
    // Status pill — uses hasBrandLogo (server-side fact) instead of brandingForm.logoUrl.
    assert.match(source, /hasBrandLogo/)
    assert.match(source, /'Personnalisée'\s*:\s*'Keova par défaut'/)
  })

  test('AC-5 (0-27): widget exposes Remplacer / Supprimer when a logo is persisted', () => {
    const source = readCoachPage()
    // Replace + Delete buttons surface on the persisted-state branch
    assert.match(source, />\s*Remplacer\s*</, '0-27 AC-5 verbatim: "Remplacer" button')
    assert.match(source, />\s*Supprimer\s*</, '0-27 AC-5 verbatim: "Supprimer" button')
    // Delete handler must call updateAccount with logoUrl: null (verbatim AC-5)
    assert.match(
      source,
      /updateAccount\(\{\s*logoUrl:\s*null\s*\}\)/,
      '0-27 AC-5: handleLogoDelete must PATCH /provider/account with { logoUrl: null }'
    )
    // Toasts verbatim per AC-5
    assert.match(source, /title:\s*'Logo téléversé'/, '0-27 AC-5 verbatim toast: "Logo téléversé"')
    assert.match(source, /title:\s*'Logo supprimé'/, '0-27 AC-5 verbatim toast: "Logo supprimé"')
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
    assert.match(block, /<section/, 'le <section> branding doit rester dans le gate')
    assert.match(block, /@click="handleBrandingSubmit"/)
    assert.match(block, />\s*Enregistrer\s*</)
  })

  test('AC-2 (18.3b): la section branding est gatée par white_label_branding', () => {
    // Le contenu de la section n'est PAS supprimé du source (il reste éditable
    // pour Sophie/Premium) : seul son RENDU devient conditionnel. Les
    // assertions AC-2/AC-3/AC-5 ci-dessus continuent donc de porter, et ce test
    // ajoute la garantie que le wrap existe bien.
    const source = readCoachPage()
    assert.match(source, /import FeatureGate from '~\/components\/molecules\/FeatureGate\.vue'/)
    assert.match(source, /<FeatureGate feature="white_label_branding">/)

    // L'ancre survit au verrouillage : elle est sur le wrapper, hors du gate.
    // Recherche sur le MARKUP (commentaires retirés) — une mention en docblock
    // rendrait l'assertion vacante.
    const markup = source.replace(/<!--[\s\S]*?-->/g, '')
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
