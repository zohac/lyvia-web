import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-26 — wiring tests for the white-label email branding section
 * (`brandName` + `logoUrl`) MIGRATED from `/provider/account` to
 * `/provider/coach-page` (Story 0-20c → Story 0-26 AC-6).
 *
 * Convention A32: tests target the real `app/pages/provider/coach-page.vue`
 * so that deleting the section, unplugging the form, or breaking the preview
 * fallback fails one of the assertions below.
 *
 * Inherits the original 0-20c coverage:
 *   - AC-1: contract still exposes brandName + logoUrl (unchanged from 0-20c)
 *   - AC-2: section + 2 fields (`brandName`, `logoUrl`) rendered with the
 *     verbatim copy required by the ticket — now on coach-page.vue
 *   - AC-3: logo preview block + onError fallback + info box for empty url
 *   - AC-4: `handleBrandingSubmit` calls `updateAccount({ brandName, logoUrl })`
 *     with trim + null fallback, then surfaces the AC-4 toast verbatim
 *   - AC-6 (story 0-26): the section is NO LONGER on /provider/account
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

describe('0-26 — /provider/coach-page white-label email branding section (AC-1/2/3/4 + AC-6 migration)', () => {
  test('AC-1: contract still exposes brandName + logoUrl on response and PATCH request', () => {
    const source = readContract()
    // Response side
    assert.match(source, /ProviderAccountResponse[\s\S]*?brandName:\s*string\s*\|\s*null/)
    assert.match(source, /ProviderAccountResponse[\s\S]*?logoUrl:\s*string\s*\|\s*null/)
    // Request side (optional + nullable)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?brandName\?:\s*string\s*\|\s*null/)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?logoUrl\?:\s*string\s*\|\s*null/)
  })

  test('AC-2: coach-page renders the brand identity section with both fields and intro copy', () => {
    const source = readCoachPage()
    // Story 0-26 round terrain UX 2026-05-01 — section renommée "Identité de marque" :
    // (1) le titre reflète le scope réel (page publique + emails, pas que les emails),
    // (2) intro mentionne explicitement les 2 surfaces (header public + emails).
    assert.match(source, /Identité de marque/)
    assert.match(
      source,
      /Logo et nom affichés dans le header de votre page publique et dans tous les emails envoyés à vos clientes\./
    )
    // brandName field with maxLength 100 + character counter wired to the form.
    assert.match(source, /v-model="brandingForm\.brandName"/)
    assert.match(source, /id="brandName"/)
    assert.match(source, /BRAND_NAME_MAX_LENGTH\s*=\s*100/)
    // logoUrl field with maxLength 500 and https-only validation message.
    assert.match(source, /v-model="brandingForm\.logoUrl"/)
    assert.match(source, /id="logoUrl"/)
    assert.match(source, /LOGO_URL_MAX_LENGTH\s*=\s*500/)
    // The string lives inside a `:error="..."` Vue binding, so the apostrophe
    // is escaped in the page source as `L\'URL`. Match the unique tail of the
    // wording instead — the regression intent (https:// + "valide") is preserved.
    assert.match(
      source,
      /URL\s+doit\s+commencer\s+par\s+https:\/\/\s+et\s+être\s+valide\./,
      'logoUrl error message must match the AC-2 wording'
    )
  })

  test('AC-2: hydration of brandingForm from account data lives in the watch on providerAccount.account', () => {
    const source = readCoachPage()
    assert.match(source, /brandingForm\.brandName\s*=\s*acc\.brandName\s*\?\?\s*''/)
    assert.match(source, /brandingForm\.logoUrl\s*=\s*acc\.logoUrl\s*\?\?\s*''/)
  })

  test('AC-3: logo live preview is rendered in 2 tiles (header public + email) and info fallback shows when empty', () => {
    const source = readCoachPage()
    // Story 0-26 round terrain UX 2026-05-01 — preview repensé en 2 tiles distinctes :
    // - Header public : `h-6` (logo nav inline avec brandName)
    // - En-tête email : `max-h-7` (logo isolé centré)
    assert.match(source, /:src="logoUrlPreviewSrc"/)
    assert.match(source, /@error="onLogoPreviewError"/)
    assert.match(source, /\bh-6\b/, 'preview tile "Header public" doit utiliser h-6')
    assert.match(source, /max-h-7/, 'preview tile "En-tête email" doit utiliser max-h-7')
    // Error state surfaces the verbatim copy from AC-3 when the image cannot load.
    assert.ok(
      source.includes('Impossible de charger l\'image. Vérifiez l\'URL.'),
      'AC-3 verbatim error copy must be wired to the preview onError fallback'
    )
    // Story 0-26 round UX 2026-05-01 — info box élargie : couvre désormais nom + logo
    // + scope (page publique + emails), affichée uniquement quand les 2 champs sont vides.
    assert.ok(
      source.includes('Renseignez votre nom de marque et l\'URL de votre logo pour personnaliser votre identité. Sinon, le nom et le logo Keova sont utilisés par défaut.'),
      'AC-3 info copy doit expliquer le fallback Keova quand les 2 champs sont vides'
    )
    // Status pill "Personnalisée" / "Keova par défaut" remplace le switch supprimé.
    assert.match(source, /'Personnalisée'\s*:\s*'Keova par défaut'/)
  })

  test('AC-4: handleBrandingSubmit calls updateAccount with trimmed brandName/logoUrl + null fallback', () => {
    const source = readCoachPage()
    assert.match(source, /async function handleBrandingSubmit\(\)/)
    // Both fields are trimmed and null is sent when the field is empty.
    assert.match(source, /brandName:\s*brandingForm\.brandName\.trim\(\)\s*\|\|\s*null/)
    assert.match(source, /logoUrl:\s*brandingForm\.logoUrl\.trim\(\)\s*\|\|\s*null/)
    // Story 0-26 round terrain — `updateAccount` est exposé directement par
    // useCoachPageEditor (un seul store providerAccount) ; plus de référence
    // `providerAccount.updateAccount` qui créait une 2e instance dé-synchronisée.
    assert.match(source, /\bupdateAccount\(\{[\s\S]*?brandName:[\s\S]*?logoUrl:/)
  })

  test('AC-4: success toast wording matches the ticket verbatim ("Informations enregistrées")', () => {
    const source = readCoachPage()
    // The branding submit handler must emit the AC-4 verbatim toast title.
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
    const source = readCoachPage()
    // The text "Identité affichée dans vos emails" appears in both the script comments
    // and the template heading — slice from the actual <h2> in the template (template
    // marker is unique).
    const templateMarker = 'id="section-branding"'
    const sectionIdx = source.indexOf(templateMarker)
    assert.ok(sectionIdx >= 0, 'Branding section <section id="section-branding"> must exist on coach-page')
    // Tail from the section start to the closing </section> tag.
    const tail = source.slice(sectionIdx)
    const closingIdx = tail.indexOf('</section>')
    const block = closingIdx >= 0 ? tail.slice(0, closingIdx) : tail
    // The branding section uses @click="handleBrandingSubmit" (USwitch + UButton pattern,
    // no <form @submit.prevent> wrapper since each card has its own save button).
    assert.match(block, /@click="handleBrandingSubmit"/)
    assert.match(block, />\s*Enregistrer\s*</)
  })

  test('AC-6 (Story 0-26): the branding section is NO LONGER on /provider/account', () => {
    const source = readAccountPage()
    // The exact section heading must not appear on /provider/account anymore.
    assert.ok(
      !source.includes('Identité affichée dans vos emails'),
      'Section "Identité affichée dans vos emails" must be removed from /provider/account (migrated to /provider/coach-page)'
    )
    // The branding form state must not exist anymore in account.vue.
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
