import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  buildConsentLabels,
  CONSENT_COACH_LABEL_FALLBACK,
  renderConsentLabel,
  resolveConsentCoachLabel
} from '../../app/features/consent/coach-label'

/**
 * Story cc-3 — la clause `{coach}` des libellés de consentement, testée seule.
 *
 * Convention 5 : la règle de résolution vit hors des composants, dans un helper
 * pur. Ces tests la font tourner avec des charges écrites à la main ; ils
 * couvrent les **deux contextes** (custom / plateforme) et les **cas vides**.
 */

describe('cc-3 — resolveConsentCoachLabel : domaine custom', () => {
  test('nomme la raison sociale quand elle est renseignée (même source que confidentialite.vue:48)', () => {
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'custom_domain',
        companyName: 'Sophie Jouan EI',
        displayName: 'Sophie Jouan'
      }),
      'Sophie Jouan EI'
    )
  })

  test('retombe sur le nom d\u2019affichage quand la raison sociale est absente', () => {
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'custom_domain',
        companyName: null,
        displayName: 'Sophie Jouan'
      }),
      'Sophie Jouan'
    )
  })

  test('retombe aussi sur le nom d\u2019affichage quand la raison sociale est vide ou blanche', () => {
    for (const companyName of ['', '   ', '\t']) {
      assert.equal(
        resolveConsentCoachLabel({
          mode: 'custom_domain',
          companyName,
          displayName: 'Sophie Jouan'
        }),
        'Sophie Jouan',
        `companyName ${JSON.stringify(companyName)} doit être traité comme absent`
      )
    }
  })

  test('élague la valeur retenue', () => {
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'custom_domain',
        companyName: '  Sophie Jouan EI  ',
        displayName: null
      }),
      'Sophie Jouan EI'
    )
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'custom_domain',
        companyName: null,
        displayName: '  Sophie Jouan  '
      }),
      'Sophie Jouan'
    )
  })

  test('replie explicitement quand la raison sociale ET le nom d\u2019affichage sont vides', () => {
    // Sans repli, la case afficherait « Je souhaite que  m'envoie… ».
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'custom_domain',
        companyName: '   ',
        displayName: ''
      }),
      CONSENT_COACH_LABEL_FALLBACK
    )
    assert.equal(
      resolveConsentCoachLabel({ mode: 'custom_domain' }),
      CONSENT_COACH_LABEL_FALLBACK
    )
  })
})

describe('cc-3 — resolveConsentCoachLabel : domaine plateforme', () => {
  test('rend Keova, en ignorant tout nom de tenant', () => {
    assert.equal(
      resolveConsentCoachLabel({
        mode: 'platform',
        companyName: 'Sophie Jouan EI',
        displayName: 'Sophie Jouan'
      }),
      'Keova'
    )
  })

  test('rend Keova quand le tenant n\u2019est pas encore résolu (mode absent)', () => {
    for (const mode of [null, undefined]) {
      assert.equal(
        resolveConsentCoachLabel({ mode, companyName: null, displayName: null }),
        'Keova'
      )
    }
  })
})

describe('cc-3 — buildConsentLabels + renderConsentLabel : la copy, exécutée', () => {
  const labels = buildConsentLabels()

  test('reconstruit la phrase email EXACTE, nom résolu inclus', () => {
    assert.equal(
      renderConsentLabel(labels.email, 'Sophie Jouan EI'),
      'Je souhaite que Sophie Jouan EI m\'envoie par email des conseils bien-être et des actualités sur son accompagnement. Je peux retirer mon consentement à tout moment depuis le lien de retrait reçu par email, ou depuis mon compte client Keova une fois activé (optionnel).'
    )
  })

  test('reconstruit la phrase SMS EXACTE, mention opérateur incluse', () => {
    assert.equal(
      renderConsentLabel(labels.sms, 'Sophie Jouan EI'),
      'Je souhaite que Sophie Jouan EI m\'envoie par SMS des messages courts sur son accompagnement. Des frais peuvent être facturés par mon opérateur. Je peux retirer mon consentement à tout moment depuis le lien de retrait reçu par email (optionnel).'
    )
  })

  test('coupe la phrase autour du nom, sans espace ajoutée', () => {
    // lead finit par une espace, tail commence par une espace : le template colle
    // le `<strong>` entre les deux sans espace, donc la phrase n'a ni « queSophie »
    // ni double espace.
    for (const parts of [labels.email, labels.sms]) {
      assert.equal(parts.lead.endsWith(' '), true)
      assert.equal(parts.tail.startsWith(' '), true)
      assert.equal(renderConsentLabel(parts, 'X').includes('  '), false)
    }
  })

  test('reporte le marqueur d\u2019optionalité rétabli (revue du 2026-10-11)', () => {
    // Sans lui, plus rien ne distinguerait un consentement de contact facultatif
    // de la CGU obligatoire (art. 7(4)).
    for (const parts of [labels.email, labels.sms]) {
      assert.ok(
        renderConsentLabel(parts, 'X').endsWith('(optionnel).'),
        'chaque libellé de contact doit se terminer par « (optionnel) »'
      )
    }
  })
})
