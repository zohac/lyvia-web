/**
 * Story 18.2 — Domaine plans côté web : codes miroir du backend et copy A31.
 *
 * Ces tests sont volontairement littéraux. Le wording du toast, du CTA et du
 * panneau lock est spécifié verbatim dans les ACs : toute paraphrase doit
 * échouer ici, pas passer inaperçue jusqu'en revue.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  FEATURE_MIN_PLAN_LABEL,
  PLAN_FEATURE_CODES,
  type PlanFeatureCode
} from '../../app/features/plans/domain/feature-codes'
import {
  FEATURE_GATE_CTA_LABEL,
  FEATURE_GATE_TOAST_TITLE,
  KEOVA_CONTACT_EMAIL,
  KEOVA_CONTACT_MAILTO,
  featureGateLockTitle
} from '../../app/features/plans/domain/feature-gate-copy'

describe('plans/domain — feature codes', () => {
  test('REGRESSION: la liste est le miroir exact du backend (plans/domain/feature-codes.ts)', () => {
    // Un code ajouté côté API et oublié ici casserait le gating frontend en
    // silence (feature inconnue → jamais déverrouillée).
    assert.deepEqual(
      [...PLAN_FEATURE_CODES],
      [
        'custom_domain',
        'white_label_branding',
        'coach_page_premium_templates',
        'lead_magnet'
      ]
    )
  })

  test('FEATURE_MIN_PLAN_LABEL couvre exactement les 4 codes', () => {
    assert.deepEqual(
      Object.keys(FEATURE_MIN_PLAN_LABEL).sort(),
      [...PLAN_FEATURE_CODES].sort()
    )
    for (const code of PLAN_FEATURE_CODES) {
      assert.equal(FEATURE_MIN_PLAN_LABEL[code], 'Premium')
    }
  })
})

describe('plans/domain — copy (Convention A31, wording verbatim)', () => {
  test('REGRESSION: titre du toast 403, accentué (divergence assumée avec le message API ASCII)', () => {
    assert.equal(
      FEATURE_GATE_TOAST_TITLE,
      'Cette fonctionnalité nécessite un plan supérieur'
    )
  })

  test('REGRESSION: libellé du CTA', () => {
    assert.equal(FEATURE_GATE_CTA_LABEL, 'Contactez Keova')
  })

  test('REGRESSION: titre du panneau lock', () => {
    assert.equal(
      featureGateLockTitle('white_label_branding'),
      'Disponible avec le plan Premium'
    )
    assert.equal(
      featureGateLockTitle('coach_page_premium_templates'),
      'Disponible avec le plan Premium'
    )
  })

  test('email de contact canonique — jamais dpo@keova.fr (réservé RGPD)', () => {
    assert.equal(KEOVA_CONTACT_EMAIL, 'contact@keova.fr')
    assert.equal(KEOVA_CONTACT_MAILTO, 'mailto:contact@keova.fr')
  })

  test('le titre du lock est dérivé de la map, pas codé en dur', () => {
    // Si un futur plan intermédiaire débloque une feature, seul
    // FEATURE_MIN_PLAN_LABEL doit changer.
    const codes: PlanFeatureCode[] = [...PLAN_FEATURE_CODES]
    for (const code of codes) {
      assert.equal(
        featureGateLockTitle(code),
        `Disponible avec le plan ${FEATURE_MIN_PLAN_LABEL[code]}`
      )
    }
  })
})
