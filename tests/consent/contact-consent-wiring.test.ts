import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story cc-1b — wiring coverage for the screens that render contact consent.
 *
 * The repo has no Vue runner (no Vitest, no `@vue/test-utils`), so an SFC cannot
 * be executed. `tests/consent/contact-consent.test.ts` covers the *rule* with
 * hand-written payloads, and it would stay green if a screen stopped using that
 * rule — or started feeding one channel the other's date.
 *
 * These tests are structural, per the repo's own convention
 * (`tests/consultation/dashboard-page-wiring.test.ts`): they target the exact
 * lines that implement the wiring. Each assertion here is **non-vacuous** — it
 * pins a string that must be present, and was checked by mutation: removing the
 * per-channel date from a payload, or rendering a date in the list card, fails
 * one of them. (CC.1's inverse assertion, which checked the *absence* of
 * `item.display.dateLabel`, was vacuous: that string existed nowhere, so it
 * passed even when the page would have rendered a date.)
 */

const appRoot = path.resolve(process.cwd(), 'app')

const PROVIDER_SHEET = 'pages/provider/clients/[clientProfileId].vue'
const APPOINTMENT_CARD = 'components/molecules/AppointmentCard.vue'
const PREFERENCES_SECTION = 'components/organisms/ClientPreferencesSection.vue'
const BOOKING_WIZARD = 'components/organisms/DiscoveryBookingWizard.vue'

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

/** Every `.vue` / `.ts` file under `app/`, relative to `app/`. */
function collectFiles(dir: string): Array<{ relativePath: string, source: string }> {
  const found: Array<{ relativePath: string, source: string }> = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...collectFiles(full))
      continue
    }
    if (!entry.name.endsWith('.vue') && !entry.name.endsWith('.ts')) continue
    found.push({
      relativePath: path.relative(appRoot, full),
      source: fs.readFileSync(full, 'utf-8')
    })
  }

  return found
}

/**
 * The consent script block only. Bounded on both sides: the sheet also carries a
 * pre-existing `pausedAtLabel` with its own inline date formatting, which is
 * out of this story's scope and must not be attributed to it.
 */
/**
 * Both anchors are asserted before slicing. `indexOf` returns `-1` when a marker
 * moves, and `slice(-1, -1)` is an empty string — every "must not contain"
 * assertion below would then pass on an empty file and silently retire itself.
 * This is exactly the vacuous-assertion failure mode the CC.1 inversion was
 * rewritten to avoid, so the guard has to fail loudly instead.
 */
function readConsentScriptBlock(source: string): string {
  const start = source.indexOf('// Contact consent (read-only, epic CC.1)')
  assert.notEqual(start, -1, 'consent script block marker is missing')

  const end = source.indexOf('// Edit form (Story 14-2)', start)
  assert.notEqual(end, -1, 'consent script block end marker is missing')
  assert.ok(
    end > start,
    'the consent block end marker must come after its start marker'
  )

  const block = source.slice(start, end)
  assert.notEqual(block.trim(), '', 'the consent script block must not be empty')
  return block
}

/**
 * Découpe bornée par deux ancres, toutes deux assertées. `indexOf` rend `-1`
 * quand un marqueur bouge, et `slice(-1)` / `slice(a, -1)` produisent une tranche
 * vide ou fausse sur laquelle les assertions « ne contient pas » passent — le
 * mode d'échec silencieux que ce fichier refuse ailleurs.
 */
function anchoredSlice(source: string, from: string, to?: string): string {
  const start = source.indexOf(from)
  assert.notEqual(start, -1, `ancre introuvable : ${from}`)

  if (to === undefined) {
    const block = source.slice(start)
    assert.notEqual(block.trim(), '', `tranche vide depuis : ${from}`)
    return block
  }

  const end = source.indexOf(to, start)
  assert.notEqual(end, -1, `ancre de fin introuvable : ${to}`)
  assert.ok(end > start, `l'ancre de fin doit suivre l'ancre de début : ${to}`)

  const block = source.slice(start, end)
  assert.notEqual(block.trim(), '', `tranche vide : ${from} → ${to}`)
  return block
}

describe('cc-1b — provider client sheet dates each channel (AC 1)', () => {
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

  test('builds the payload from exactly the two flags and two per-channel dates', () => {
    const source = readAppFile(PROVIDER_SHEET)
    const block = anchoredSlice(
      source,
      'const contactConsentPayload',
      'const contactConsentChannels'
    )

    for (const field of [
      'emailMarketingOptIn',
      'smsMarketingOptIn',
      'emailConsentUpdatedAt',
      'smsConsentUpdatedAt'
    ]) {
      assert.match(
        source,
        new RegExp(`${field}:\\s*source\\.${field}`),
        `${PROVIDER_SHEET} must pass ${field} into the shared payload`
      )
    }

    // `consentSource` stays in the API contract as provenance, but the UI does
    // not read it: the per-channel date already decides « Retiré » vs
    // « Jamais consenti ». Feeding it here would invite the CC.1 heuristic back.
    assert.ok(
      !block.includes('consentSource'),
      `${PROVIDER_SHEET} must not feed consentSource into the consent payload`
    )
  })

  test('never passes one channel flag under the other channel date', () => {
    const source = readAppFile(PROVIDER_SHEET)

    // Guards the exact mis-wiring the story fixes: a payload that sends the
    // email flag with the SMS timestamp would render a false date.
    assert.ok(
      !/emailConsentUpdatedAt:\s*source\.smsConsentUpdatedAt/.test(source),
      'the email date must not be fed the SMS column'
    )
    assert.ok(
      !/smsConsentUpdatedAt:\s*source\.emailConsentUpdatedAt/.test(source),
      'the SMS date must not be fed the email column'
    )
  })

  test('renders the date under the channel row that owns it', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.match(
      source,
      /v-if="item\.display\.dateLabel"/,
      `${PROVIDER_SHEET} must render the channel's own date on its row`
    )
    assert.match(
      source,
      /le \{\{ item\.display\.dateLabel \}\}/,
      `${PROVIDER_SHEET} must print the date resolved by the shared rule, not a local one`
    )
  })

  test('drops the profile-level "last change" block entirely', () => {
    const source = readAppFile(PROVIDER_SHEET)

    assert.ok(
      !source.includes('resolveContactConsentLastChange'),
      'the profile-level last-change resolver is dead code since cc-1b'
    )
    assert.ok(
      !source.includes('contactConsentLastChange'),
      'the sheet must no longer carry a single profile-level date'
    )
    assert.ok(
      !/Dernier changement enregistré/.test(source),
      'the profile-level last-change wording must be gone'
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

describe('cc-1b — discovery card carries the dates but renders none (decision 3)', () => {
  test('resolves both channels through the shared rule', () => {
    const source = readAppFile(APPOINTMENT_CARD)

    assert.match(
      source,
      /resolveContactConsent\(pickContactConsent\(payload, channel\)\)/,
      `${APPOINTMENT_CARD} must resolve each channel via the shared rule`
    )
  })

  test('feeds the rule both per-channel timestamps, and nothing it does not need', () => {
    const source = readAppFile(APPOINTMENT_CARD)
    const block = anchoredSlice(source, 'const contactConsentBadges')

    for (const field of ['emailConsentUpdatedAt', 'smsConsentUpdatedAt']) {
      assert.match(
        source,
        new RegExp(`${field}:\\s*client\\.${field}`),
        `${APPOINTMENT_CARD} must pass ${field} into the shared payload — the label depends on it`
      )
    }
    assert.ok(
      !block.includes('consentSource'),
      `${APPOINTMENT_CARD} must not feed consentSource into the consent payload`
    )
  })

  test('renders NO date at all', () => {
    const source = readAppFile(APPOINTMENT_CARD)
    const templateEnd = source.lastIndexOf('</template>')
    assert.notEqual(templateEnd, -1, `${APPOINTMENT_CARD} must carry a template`)
    const template = source.slice(0, templateEnd)

    // The list is scanned; a date per row degrades it. The rule still receives
    // the dates above — the label needs them — but nothing here renders one.
    assert.ok(
      !template.includes('dateLabel'),
      `${APPOINTMENT_CARD} must not render a consent date — it belongs to the client sheet`
    )
    assert.ok(
      !/formatContactConsentDate|toLocaleDateString/.test(template),
      `${APPOINTMENT_CARD} must not format a consent date`
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

describe('cc-1b — client preferences screen dates each channel (decision 2)', () => {
  test('builds the rows through the pure rule, not inline in the SFC', () => {
    const source = readAppFile(PREFERENCES_SECTION)

    assert.match(
      source,
      /import\s*\{[^}]*buildContactConsentDateRows[^}]*\}\s*from\s*['"][^'"]*contact-consent['"]/,
      `${PREFERENCES_SECTION} must import the row builder from the shared consent rule`
    )
    assert.match(
      source,
      /buildContactConsentDateRows\(preferences\.value\)/,
      `${PREFERENCES_SECTION} must hand the payload to the pure row builder — the pairing is executed by contact-consent.test.ts, not by a regex`
    )
    assert.ok(
      !source.includes('toLocaleDateString'),
      `${PREFERENCES_SECTION} must not re-declare a local date formatter`
    )
    assert.ok(
      !/function formatDate\(/.test(source),
      'the local formatDate helper is superseded by the shared rule'
    )
  })

  test('drops the single profile-level "Dernière modification" line — wording included', () => {
    const source = readAppFile(PREFERENCES_SECTION)

    assert.ok(
      !source.includes('preferences.consentUpdatedAt'),
      'the profile-level timestamp is gone from the API contract'
    )
    assert.ok(
      !source.includes('preferences.value.consentUpdatedAt'),
      'the profile-level timestamp is gone from the access form too (the old guard missed the `.value` form)'
    )
    // La décision figée n° 2 supprime la LIGNE, pas seulement sa donnée : l'ancien
    // garde ne testait que le champ, donc le libellé « Dernière modification : »
    // restait rendu au-dessus des deux lignes par canal.
    assert.ok(
      !source.includes('Dernière modification'),
      'the shared « Dernière modification » label must be gone, not just its timestamp'
    )
  })

  test('labels each rendered row with its own channel', () => {
    const source = readAppFile(PREFERENCES_SECTION)

    // Les libellés « Email »/« SMS » vivent désormais dans le module pur
    // (`CONTACT_CONSENT_CHANNEL_LABEL`), où ils sont exécutés par
    // contact-consent.test.ts ; la page se contente de rendre la ligne.
    assert.match(
      source,
      /\{\{ row\.label \}\} le \{\{ row\.dateLabel \}\}/,
      `${PREFERENCES_SECTION} must name the channel beside its date`
    )
  })
})

describe('cc-1b — the latent-risk invariant: only explicit toggles write consent', () => {
  // The reason « Retiré » is a fact rather than a claim. If someone ever adds
  // "clearing the phone number unticks SMS" to the AUTHENTICATED preferences
  // page, the submitted payload becomes byte-for-byte a deliberate untick and
  // the attribution becomes unknowable again — the exact ambiguity CC.1 had to
  // route around with « Non autorisé ». A test is cheaper than a column, and
  // this is where the story says to spend it.
  const appFiles = collectFiles(path.join(appRoot))

  /**
   * Every call site of the preferences writer, composable excluded (it is the
   * plumbing, not a caller).
   *
   * Deliberately NOT pinned to an exact list of one: story cc-2b adds a
   * withdrawal page that legitimately reaches the same endpoint. An exact-list
   * assertion would fail there by design and tempt the next author into
   * weakening it. The invariant that actually matters is the one below — every
   * caller writes whole-value toggles — and it holds for any number of callers.
   */
  function consentWriteCallers(): Array<{ relativePath: string, source: string }> {
    return appFiles.filter(
      file =>
        file.relativePath !== 'features/preferences/useClientPreferences.ts'
        && file.source.includes('useClientPreferences')
    )
  }

  test('the preferences writer has at least one caller, and the toggles are among them', () => {
    const callers = consentWriteCallers().map(file => file.relativePath)

    assert.ok(
      callers.includes(PREFERENCES_SECTION),
      `${PREFERENCES_SECTION} must call the preferences writer; callers: ${callers.join(', ')}`
    )
  })

  test('every caller writes whole-value toggles, never a derived payload', () => {
    // This is the invariant, and it is what makes « Retiré » a fact: an implicit
    // write — one derived from another field — would be byte-for-byte a
    // deliberate untick, and the attribution would be lost again.
    for (const file of consentWriteCallers()) {
      const payloads = [
        ...file.source.matchAll(/updatePreferences\((\{[^{}]*\})\)/g)
      ].map(match => match[1]!.trim())

      assert.ok(
        payloads.length > 0,
        `${file.relativePath} imports the writer but never calls it`
      )
      for (const payload of payloads) {
        assert.match(
          payload,
          /^\{\s*(email|sms)MarketingOptIn:\s*value,?\s*\}$/,
          `${file.relativePath} must write a whole-value toggle, got ${payload}`
        )
        assert.ok(
          !/phone|form|field|props\./i.test(payload),
          `${file.relativePath} must not derive a consent flag from another field: ${payload}`
        )
      }
    }
  })

  test('the authenticated preferences screen holds no phone input', () => {
    const source = readAppFile(PREFERENCES_SECTION)

    // `hasPhone` is a read of the server's state, not an input; what must not
    // appear is an editable phone control, whose clearing used to untick SMS.
    assert.ok(
      !/type="tel"/.test(source),
      `${PREFERENCES_SECTION} must not carry a phone input — clearing one used to untick SMS implicitly`
    )
  })

  test('IdentityForm is never reachable from the authenticated preferences screen', () => {
    const source = readAppFile(PREFERENCES_SECTION)

    assert.ok(
      !source.includes('IdentityForm'),
      `${PREFERENCES_SECTION} must not render IdentityForm — its implicit SMS untick only belongs to the booking`
    )
  })

  test('the booking wizard gates submission on a non-empty phone', () => {
    // The other half of the guarantee. `IdentityForm`'s implicit SMS untick is
    // unreachable *only* because the wizard refuses to submit without a phone:
    // an empty phone would be an untick the visitor never chose. Neither the
    // submit gate nor the server-side validation is covered by any other test,
    // so weakening either would silently reopen the ambiguity that made CC.1
    // rename the state to « Non autorisé ».
    const source = readAppFile(BOOKING_WIZARD)

    const gate = source.match(
      /const canSubmitIdentity = computed\(\(\) =>([\s\S]*?)\)\s*$/m
    )
    assert.ok(gate, `${BOOKING_WIZARD} must declare canSubmitIdentity`)
    assert.match(
      gate![1]!,
      /identity\.value\.phone\.trim\(\)\.length > 0/,
      'canSubmitIdentity must require a non-empty phone'
    )

    const validate = source.match(
      /function validateIdentity\(\): boolean \{([\s\S]*?)\n {2}\}/
    )
    assert.ok(validate, `${BOOKING_WIZARD} must declare validateIdentity`)
    assert.match(
      validate![1]!,
      /if\s*\(\s*!identity\.value\.phone\.trim\(\)\s*\)\s*errors\.phone\s*=/,
      'validateIdentity must reject an empty phone'
    )
  })

  test('the booking submit button is disabled by that gate', () => {
    const source = readAppFile(BOOKING_WIZARD)

    assert.match(
      source,
      /:disabled="!canSubmitIdentity \|\| isSubmitting"/,
      'the wizard submit button must be disabled while the identity gate is closed'
    )
    assert.match(
      source,
      /if \(!validateIdentity\(\)\) return/,
      'the wizard must run validateIdentity before submitting'
    )
  })

  test('the booking wizard is the only screen rendering IdentityForm', () => {
    // The second consent writer is the discovery booking. It cannot produce an
    // implicit `settings` untick (it writes `'onboarding'`), and since cc-1b it
    // does not date a channel nobody agreed to — see
    // `typeorm-discovery-booking.service.db.spec.ts` on the API side.
    const renderers = appFiles
      .filter(
        file =>
          file.relativePath.endsWith('.vue')
          && /<IdentityForm[\s/>]/.test(file.source)
      )
      .map(file => file.relativePath)

    assert.deepEqual(
      renderers,
      [BOOKING_WIZARD],
      `IdentityForm's implicit SMS untick must stay confined to the booking wizard; rendered by: ${renderers.join(', ')}`
    )
  })
})
