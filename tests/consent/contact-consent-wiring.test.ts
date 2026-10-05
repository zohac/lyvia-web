import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story cc-1 — wiring coverage for the two provider screens that render contact
 * consent.
 *
 * The repo has no Vue runner (no Vitest, no `@vue/test-utils`), so an SFC cannot
 * be executed. `tests/consent/contact-consent.test.ts` therefore covers the
 * *rule* with hand-written payloads, and it would stay green if a screen
 * stopped using that rule — or started reading the wrong channel's flag.
 *
 * These tests are structural, per the repo's own convention
 * (`tests/consultation/dashboard-page-wiring.test.ts`): they target the exact
 * lines that implement AC 1 (states in the discovery list), AC 2 (states on the
 * client sheet) and AC 3 (the date on the client sheet). Unplugging a screen
 * from the shared rule, swapping a channel flag, or moving the date off the
 * sheet fails one of them.
 */

const appRoot = path.resolve(process.cwd(), 'app')

const PROVIDER_SHEET = 'pages/provider/clients/[clientProfileId].vue'
const APPOINTMENT_CARD = 'components/molecules/AppointmentCard.vue'

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

/**
 * The consent script block only. Bounded on both sides: the sheet also carries a
 * pre-existing `pausedAtLabel` with its own inline date formatting, which is
 * out of this story's scope and must not be attributed to it.
 */
function readConsentScriptBlock(source: string): string {
  const start = source.indexOf('// Contact consent (read-only, epic CC.1)')
  assert.notEqual(start, -1, 'consent script block marker is missing')
  const end = source.indexOf('// Edit form (Story 14-2)', start)
  assert.notEqual(end, -1, 'consent script block end marker is missing')
  return source.slice(start, end)
}

describe('cc-1 — provider client sheet renders contact consent (AC 2, AC 3)', () => {
  test('resolves both channels through the shared rule, not a local guess', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /import\s*\{[^}]*pickContactConsent[^}]*\}\s*from\s*['"][^'"]*contact-consent['"]/,
      `${PROVIDER_SHEET} must import pickContactConsent from the shared consent rule`
    )
    assert.match(
      source,
      /resolveContactConsent\(pickContactConsent\(payload, channel\)\)/,
      `${PROVIDER_SHEET} must resolve each channel via pickContactConsent + resolveContactConsent`
    )
  })

  test('walks both channels from one shared payload', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /\(\['email',\s*'sms'\]\s*as const\)\.map\(/,
      `${PROVIDER_SHEET} must iterate both channels, or a channel silently disappears`
    )
  })

  test('builds the payload from the four consent fields of the client sheet', () => {
    const source = readAppFile(PROVIDER_SHEET)

    for (const field of [
      'emailMarketingOptIn',
      'smsMarketingOptIn',
      'consentSource',
      'consentUpdatedAt'
    ]) {
      assert.match(
        source,
        new RegExp(`${field}:\\s*source\\.${field}`),
        `${PROVIDER_SHEET} must pass ${field} into the shared payload`
      )
    }
  })

  test('renders the date once, from the shared last-change resolver', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /import\s*\{[^}]*resolveContactConsentLastChange[^}]*\}\s*from\s*['"][^'"]*contact-consent['"]/,
      `${PROVIDER_SHEET} must import resolveContactConsentLastChange — the date must come from the shared rule`
    )
    assert.match(
      source,
      /return resolveContactConsentLastChange\(payload\)/,
      `${PROVIDER_SHEET} must resolve the date via the shared rule`
    )
  })

  test('never formats a consent date locally', () => {
    const source = readConsentScriptBlock(readAppFile(PROVIDER_SHEET))

    assert.ok(
      !source.includes('toLocaleDateString'),
      'the consent block must not re-declare date formatting — it belongs to the shared rule'
    )
    assert.ok(
      !source.includes('Intl.'),
      'the consent block must not re-declare an Intl formatter — use the shared helper'
    )
  })

  test('renders no per-channel date', () => {
    const source = readAppFile(PROVIDER_SHEET)
    const consentBlock = source.slice(
      source.indexOf('<!-- Contact consent (read-only, epic CC.1) -->')
    )

    assert.ok(
      !consentBlock.includes('item.display.dateLabel'),
      'a profile-level timestamp must never be rendered on a channel row'
    )
  })

  test('hides the section when there is no client to read consent from', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /v-if="contactConsentChannels\.length > 0"/,
      'the section must not render its heading above an empty list'
    )
  })

  test('keeps the row rhythm of the surrounding divide-y list', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /<!-- Contact consent \(read-only, epic CC\.1\) -->\s*<div\s+v-if="contactConsentChannels\.length > 0"\s+class="py-3 last:pb-0"/,
      'the consent block must be a padded list row like its siblings'
    )
  })
})

describe('cc-1 — discovery card renders contact consent states (AC 1)', () => {
  test('resolves both channels through the shared rule', () => {
    const source = readAppFile(APPOINTMENT_CARD)

    assert.match(
      source,
      /resolveContactConsent\(pickContactConsent\(payload, channel\)\)/,
      `${APPOINTMENT_CARD} must resolve each channel via the shared rule`
    )
  })

  test('uses the shared channel label and icon maps instead of inline ternaries', () => {
    const source = readAppFile(APPOINTMENT_CARD)

    assert.match(
      source,
      /:name="CONTACT_CONSENT_CHANNEL_ICON\[item\.channel\]"/,
      `${APPOINTMENT_CARD} must take the icon from the shared map`
    )
    assert.match(
      source,
      /\{\{ item\.label \}\} : \{\{ item\.display\.label \}\}/,
      `${APPOINTMENT_CARD} must take the channel label from the shared map`
    )
    assert.ok(
      !/item\.channel === 'email' \?/.test(source),
      `${APPOINTMENT_CARD} must not branch on the channel inline — a third channel would fall through to SMS`
    )
  })

  test('renders the display state, not the raw booleans', () => {
    const source = readAppFile(APPOINTMENT_CARD)

    assert.match(
      source,
      /\{\{ item\.label \}\} : \{\{ item\.display\.label \}\}/,
      `${APPOINTMENT_CARD} must render the state resolved by the shared rule`
    )
    assert.ok(
      !source.includes('client.emailMarketingOptIn ?'),
      `${APPOINTMENT_CARD} must not re-derive the wording from the raw flags`
    )
  })
})
