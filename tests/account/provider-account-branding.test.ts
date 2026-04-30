import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-20c — wiring tests for the white-label email branding section
 * (`brandName` + `logoUrl`) on `/provider/account`.
 *
 * Convention A32: tests target the real `app/pages/provider/account.vue` so
 * that deleting the section, unplugging the form, or breaking the preview
 * fallback fails one of the assertions below.
 *
 * Coverage:
 *   - AC-2: section + 2 fields (`brandName`, `logoUrl`) are rendered with the
 *     copy required by the ticket.
 *   - AC-3: logo preview block + onError fallback + info box for empty url.
 *   - AC-4: `handleBrandingSubmit` calls `updateAccount({ brandName, logoUrl })`
 *     with trim + null fallback, then surfaces the AC-4 toast verbatim.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const PAGE_PATH = 'pages/provider/account.vue'
const CONTRACT_PATH = 'features/account/api/provider-account.contract.ts'

function readPage(): string {
  return fs.readFileSync(path.join(appRoot, PAGE_PATH), 'utf-8')
}

function readContract(): string {
  return fs.readFileSync(path.join(appRoot, CONTRACT_PATH), 'utf-8')
}

describe('0-20c — /provider/account white-label email branding section (AC-1/2/3/4)', () => {
  test('AC-1: contract exposes brandName + logoUrl on response and PATCH request', () => {
    const source = readContract()
    // Response side
    assert.match(source, /ProviderAccountResponse[\s\S]*?brandName:\s*string\s*\|\s*null/)
    assert.match(source, /ProviderAccountResponse[\s\S]*?logoUrl:\s*string\s*\|\s*null/)
    // Request side (optional + nullable)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?brandName\?:\s*string\s*\|\s*null/)
    assert.match(source, /UpdateProviderAccountRequest[\s\S]*?logoUrl\?:\s*string\s*\|\s*null/)
  })

  test('AC-2: page renders the white-label section with both fields and intro copy', () => {
    const source = readPage()
    // Section heading + intro from the ticket.
    assert.match(source, /Identité affichée dans vos emails/)
    assert.match(
      source,
      /Personnalisez le nom et le logo affichés dans les emails envoyés à vos clientes\. Ces informations remplacent la marque Keova par défaut\./
    )
    // brandName field with maxLength 100 + character counter wired to the form.
    assert.match(source, /v-model="brandingForm\.brandName"/)
    assert.match(source, /id="brandName"/)
    assert.match(source, /:maxlength="100"/)
    // logoUrl field with maxLength 500 and https-only validation message.
    assert.match(source, /v-model="brandingForm\.logoUrl"/)
    assert.match(source, /id="logoUrl"/)
    assert.match(source, /:maxlength="500"/)
    // The string lives inside a `:error="..."` Vue binding, so the apostrophe
    // is escaped in the page source as `L\'URL`. Match the unique tail of the
    // wording instead — the regression intent (https:// + "valide") is preserved.
    assert.match(
      source,
      /URL\s+doit\s+commencer\s+par\s+https:\/\/\s+et\s+être\s+valide\./,
      'logoUrl error message must match the AC-2 wording'
    )
  })

  test('AC-2: hydration of brandingForm from account data lives in syncFormsFromAccount', () => {
    const source = readPage()
    assert.match(source, /brandingForm\.brandName\s*=\s*acc\.brandName\s*\?\?\s*''/)
    assert.match(source, /brandingForm\.logoUrl\s*=\s*acc\.logoUrl\s*\?\?\s*''/)
  })

  test('AC-3: logo preview is rendered when the url is valid and the info fallback shows when empty', () => {
    const source = readPage()
    // Preview <img> bound to the computed source + onError handler.
    assert.match(source, /:src="logoUrlPreviewSrc"/)
    assert.match(source, /@error="onLogoPreviewError"/)
    assert.match(source, /max-h-10/)
    // Error state surfaces the verbatim copy from AC-3 when the image cannot load.
    assert.ok(
      source.includes('Impossible de charger l\'image. Vérifiez l\'URL.'),
      'AC-3 verbatim error copy must be wired to the preview onError fallback'
    )
    // Info box shown when no logoUrl is provided (default Keova logo).
    assert.ok(
      source.includes('Le logo Keova sera utilisé par défaut.'),
      'AC-3 verbatim info copy must be wired to the empty-state SystemAlert'
    )
  })

  test('AC-4: handleBrandingSubmit calls updateAccount with trimmed brandName/logoUrl + null fallback', () => {
    const source = readPage()
    assert.match(source, /async function handleBrandingSubmit\(\)/)
    // Both fields are trimmed and null is sent when the field is empty.
    assert.match(source, /brandName:\s*brandingForm\.brandName\.trim\(\)\s*\|\|\s*null/)
    assert.match(source, /logoUrl:\s*brandingForm\.logoUrl\.trim\(\)\s*\|\|\s*null/)
    // The PATCH goes through the existing useProviderAccount.updateAccount helper.
    assert.match(source, /updateAccount\(\{[\s\S]*?brandName:[\s\S]*?logoUrl:/)
  })

  test('AC-4: success toast wording matches the ticket verbatim ("Informations enregistrées")', () => {
    const source = readPage()
    // The branding submit handler must emit the AC-4 verbatim toast title.
    const handlerStart = source.indexOf('async function handleBrandingSubmit')
    assert.ok(handlerStart >= 0, 'handleBrandingSubmit must exist in account.vue')
    const handlerEnd = source.indexOf('\n}', handlerStart)
    const handlerSlice = source.slice(handlerStart, handlerEnd)
    assert.ok(
      /title:\s*'Informations enregistrées'/.test(handlerSlice),
      'AC-4 verbatim — toast title must be "Informations enregistrées" in handleBrandingSubmit'
    )
  })

  test('AC-4: form section is wired to handleBrandingSubmit via @submit.prevent', () => {
    const source = readPage()
    const sectionMarker = 'Identité affichée dans vos emails'
    const sectionIdx = source.indexOf(sectionMarker)
    assert.ok(sectionIdx >= 0, 'Branding section must exist')
    // Slice the section block until the next "<!-- Section" comment to scope
    // the handler check to this section only.
    const tail = source.slice(sectionIdx)
    const nextSectionIdx = tail.indexOf('<!-- Section')
    const block = nextSectionIdx >= 0 ? tail.slice(0, nextSectionIdx) : tail
    assert.match(block, /@submit\.prevent="handleBrandingSubmit"/)
    // The save button label is the standard "Enregistrer" used across the page.
    assert.match(block, /label="Enregistrer"/)
  })
})
