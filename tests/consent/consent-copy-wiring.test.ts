import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe, it } from 'node:test'

/**
 * Story cc-3 — wiring coverage for the contact-consent copy.
 *
 * The repo has no SFC runner, so an SFC cannot be executed. These assertions are
 * structural, per the repo's own convention (`tests/consent/contact-consent-wiring.test.ts`):
 * they target the exact lines that wire the molecule and the wizard.
 *
 * Les phrases de consentement elles-mêmes ne sont **pas** recopiées ici : elles
 * vivent dans le helper pur `app/features/consent/coach-label.ts` et sont
 * **exécutées** par `tests/consent/coach-label.test.ts` (`buildConsentLabels` +
 * `renderConsentLabel`, qui reconstruit la phrase avec un nom donné). Ce fichier
 * vérifie que la molécule les compose et que la clause `{coach}` y est interpolée.
 *
 * Chaque assertion est **non vacuous** — elle épingle une chaîne qui doit être
 * présente — et a été vérifiée par mutation (Dev Agent Record de la story).
 */

const appRoot = path.resolve(process.cwd(), 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

const IDENTITY_FORM = 'components/molecules/IdentityForm.vue'
const BOOKING_WIZARD = 'components/organisms/DiscoveryBookingWizard.vue'

// Le template colle `lead` + le nom en gras + `tail` SANS espace ajoutée : `lead`
// finit par une espace et `tail` en commence une (voir `buildConsentLabels`).
const EMAIL_MARKUP = '{{ consentLabels.email.lead }}<strong>{{ coachLabel }}</strong>{{ consentLabels.email.tail }}'
const SMS_MARKUP = '{{ consentLabels.sms.lead }}<strong>{{ coachLabel }}</strong>{{ consentLabels.sms.tail }}'

describe('cc-3 — la molécule compose les libellés figés, résolus par `{coach}`', () => {
  it('reçoit `coachLabel` en prop requise (elle ne lit pas le tenant)', () => {
    const source = readAppFile(IDENTITY_FORM)

    assert.match(
      source,
      /coachLabel:\s*string/,
      `${IDENTITY_FORM} must declare coachLabel as a required string prop`
    )
    assert.match(
      source,
      /<strong>\{\{ coachLabel \}\}<\/strong>/,
      `${IDENTITY_FORM} must interpolate the resolved coach label into every consent sentence`
    )
  })

  it('compose chaque phrase depuis le helper, le nom au milieu en gras', () => {
    const source = readAppFile(IDENTITY_FORM)

    assert.ok(
      source.includes(EMAIL_MARKUP),
      `${IDENTITY_FORM} must compose the email sentence from the helper, around the coach label`
    )
    assert.ok(
      source.includes(SMS_MARKUP),
      `${IDENTITY_FORM} must compose the SMS sentence from the helper, around the coach label`
    )
    assert.match(
      source,
      /import\s*\{\s*buildConsentLabels\s*\}\s*from\s*['"][^'"]*consent\/coach-label['"]/,
      `${IDENTITY_FORM} must import buildConsentLabels from the pure helper`
    )
    // La phrase vit dans le helper (exécutée par coach-label.test.ts) : le SFC ne
    // doit pas la dupliquer, sinon deux copies divergeraient à la prochaine copy.
    assert.equal(
      source.includes('conseils bien-être et des actualités'),
      false,
      `${IDENTITY_FORM} must not duplicate the consent sentence — it lives in the helper`
    )
    assert.equal(
      source.includes('Des frais peuvent être facturés par mon opérateur'),
      false,
      `${IDENTITY_FORM} must not duplicate the SMS sentence — it lives in the helper`
    )
  })

  it('garde un corps identique entre les deux contextes : seul le nom change', () => {
    const source = readAppFile(IDENTITY_FORM)

    // Les deux phrases partagent la même formule interpolée ; le corps est une
    // donnée constante, jamais dérivée du domaine — sinon chaque contexte
    // multiplierait les surfaces juridiques.
    const matches = [...source.matchAll(/<strong>\{\{ coachLabel \}\}<\/strong>/g)]
    assert.equal(
      matches.length,
      2,
      `${IDENTITY_FORM} must render both consent sentences around the same interpolated name`
    )
    assert.equal(
      /isWhiteLabelTenant|brand\.mode|legalInfo/.test(source),
      false,
      `${IDENTITY_FORM} must not resolve the domain itself — the label is passed in`
    )
  })
})

describe('cc-3 — le wizard résout `{coach}` depuis le tenant', () => {
  it('utilise le helper pur avec les mêmes sources que confidentialite.vue:48', () => {
    const source = readAppFile(BOOKING_WIZARD)

    assert.match(
      source,
      /import\s*\{\s*resolveConsentCoachLabel\s*\}\s*from\s*['"][^'"]*consent\/coach-label['"]/,
      `${BOOKING_WIZARD} must import resolveConsentCoachLabel from the pure helper`
    )
    assert.match(
      source,
      /mode:\s*tenant\.value\?\.brand\.mode\s*\?\?\s*null/,
      `${BOOKING_WIZARD} must resolve the mode from the tenant`
    )
    assert.match(
      source,
      /companyName:\s*tenant\.value\?\.legalInfo\?\.companyName\s*\?\?\s*null/,
      `${BOOKING_WIZARD} must resolve companyName from the tenant (same source as the privacy policy)`
    )
    assert.match(
      source,
      /displayName:\s*tenant\.value\?\.brand\.displayName\s*\?\?\s*null/,
      `${BOOKING_WIZARD} must resolve displayName from the tenant`
    )
  })

  it('passe le libellé résolu à la molécule', () => {
    const source = readAppFile(BOOKING_WIZARD)

    assert.match(
      source,
      /:coach-label="consentCoachLabel"/,
      `${BOOKING_WIZARD} must pass the resolved coach label to IdentityForm`
    )
  })
})

describe('cc-3 — consentement de contact : rien de pré-coché, SMS désactivé sans numéro', () => {
  it('aucune case de contact n\u2019est pré-cochée (ni CGU)', () => {
    const source = readAppFile(IDENTITY_FORM)

    for (const binding of [
      ':checked="consents.legalAccepted"',
      ':checked="consents.emailMarketingOptIn"',
      ':checked="consents.smsMarketingOptIn"'
    ]) {
      assert.ok(
        source.includes(binding),
        `${IDENTITY_FORM} must bind ${binding}`
      )
    }
    // Un attribut `checked` statique pré-cocherait la case.
    assert.equal(
      /\schecked[\s=>]/.test(source),
      false,
      `${IDENTITY_FORM} must not carry a static checked attribute`
    )

    const wizard = readAppFile(BOOKING_WIZARD)
    assert.match(
      wizard,
      /legalAccepted:\s*false,\s*emailMarketingOptIn:\s*false,\s*smsMarketingOptIn:\s*false/,
      `${BOOKING_WIZARD} must start every consent at false`
    )
  })

  it('la case SMS est désactivée tant qu\u2019aucun numéro n\u2019est saisi', () => {
    const source = readAppFile(IDENTITY_FORM)

    assert.match(
      source,
      /:disabled="disabled \|\| !modelValue\.phone\.trim\(\)"/,
      `${IDENTITY_FORM} must disable the SMS checkbox while the phone is empty`
    )
  })

  it('vidage du téléphone ⇒ décochage du SMS et écriture en conséquence', () => {
    // AC 5 : le comportement existe déjà (`IdentityForm.vue:33-35`) ; l'épingler
    // plutôt que le réimplémenter. La mutation consistant à retirer ce bloc
    // fait tomber cette assertion.
    const source = readAppFile(IDENTITY_FORM)

    assert.match(
      source,
      /if \(key === 'phone' && !value\.trim\(\) && props\.consents\.smsMarketingOptIn\) \{/,
      `${IDENTITY_FORM} must untick SMS when the phone is cleared`
    )
    assert.match(
      source,
      /emit\('update:consents',\s*\{ \.\.\.props\.consents, smsMarketingOptIn: false \}\)/,
      `${IDENTITY_FORM} must emit the unticked consent state`
    )
  })
})

describe('cc-3 — l\u2019API refuse le SMS sans numéro (garde-fou serveur)', () => {
  test('n\u2019écrit rien quand `smsMarketingOptIn=true` sans téléphone', (t) => {
    // L'API vit dans un autre dépôt. Quand sa source n'est pas montée — le
    // worktree s'appelle `epic-cc-api`, et le job `web test:unit` ne fait un
    // sparse-checkout que de `openapi.yaml` — le test se déclare **skippé** au
    // lieu de `return` silencieusement : `node:test` comptait un `return` comme
    // un succès, donc la garde serveur n'était jamais couverte tout en
    // paraissant l'être.
    const candidates = [
      path.resolve(
        process.cwd(),
        '../lyvia-api/src/features/clients/infrastructure/typeorm-client-preferences-command.service.ts'
      ),
      '/lyvia-api/src/features/clients/infrastructure/typeorm-client-preferences-command.service.ts',
      '/app/src/features/clients/infrastructure/typeorm-client-preferences-command.service.ts'
    ]
    const apiPath = candidates.find(candidate => fs.existsSync(candidate))
    if (apiPath === undefined) {
      t.skip('source API non montée ici — garde serveur non vérifiable dans ce job')
      return
    }

    const source = fs.readFileSync(apiPath, 'utf-8')
    assert.match(
      source,
      /smsMarketingOptIn\s*===\s*true\s*&&\s*profile\.phone\s*===\s*null/,
      'the API must refuse a true SMS opt-in when the profile has no phone'
    )
    assert.match(
      source,
      /smsOptInRefused/,
      'the API must report the refusal as a per-channel outcome, not a whole-request one'
    )
  })
})

describe('cc-3 — la route tokenisée retire, elle n’accorde jamais', () => {
  test('le DTO public n’accepte que `false` comme valeur de drapeau', (t) => {
    // Une route de retrait qui accepte `true` peut ACCORDER un consentement
    // marketing : `email_marketing_opt_in = true` avec `consent_source =
    // 'settings'` et une ligne `CLIENT_COMMUNICATION_CONSENT_UPDATED` — une
    // preuve de consentement (art. 7(1)) que personne n’a donnée. L’invariant
    // ne doit pas reposer sur le seul client web.
    const candidates = [
      path.resolve(
        process.cwd(),
        '../lyvia-api/src/features/clients/presentation/dto/update-consent-by-token.dto.ts'
      ),
      '/lyvia-api/src/features/clients/presentation/dto/update-consent-by-token.dto.ts',
      '/app/src/features/clients/presentation/dto/update-consent-by-token.dto.ts'
    ]
    const apiPath = candidates.find(candidate => fs.existsSync(candidate))
    if (apiPath === undefined) {
      t.skip('source API non montée ici — contrat public non vérifiable dans ce job')
      return
    }

    const source = fs.readFileSync(apiPath, 'utf-8')
    // `@IsIn([false])` sur les deux drapeaux : seule la valeur `false` passe.
    const isInFalse = (
      source
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('@IsIn([false])'))
    )
    assert.equal(
      isInFalse.length,
      2,
      'both public consent flags must be restricted to `false` by the DTO'
    )
  })
})
