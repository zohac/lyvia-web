/**
 * Story 18.3b — Verrouillage par carte du sélecteur de template.
 *
 * Tests COMPORTEMENTAUX (Convention YC) : chacun tombe si la règle de gating
 * régresse. Le mécanisme est prouvé ici par fixture et non par la donnée de
 * prod : à date le référentiel ne contient que `essentiel` (ouvert à tous) et
 * `signature` (exclusif Sophie, filtré serveur pour les autres), donc une
 * provider Essentiel ne voit AUCUNE carte verrouillée. Ces tests protègent les
 * futurs templates premium non-exclusifs.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  FEATURE_COACH_PAGE_PREMIUM_TEMPLATES,
  FEATURE_MIN_PLAN_LABEL
} from '../../app/features/plans/domain/feature-codes'
import {
  ESSENTIEL_TEMPLATE_CODE,
  PREMIUM_TEMPLATE_BADGE_LABEL,
  isTemplateLocked,
  resolvePremiumTemplatesAccess
} from '../../app/features/plans/domain/template-lock'

describe('18.3b — isTemplateLocked', () => {
  test('REGRESSION: le template `essentiel` n\'est JAMAIS verrouillé, quel que soit le flag', () => {
    // Le PRD interdit de bloquer le template Standard : c'est précisément la
    // raison pour laquelle le sélecteur est verrouillé CARTE PAR CARTE et non
    // enveloppé dans un <FeatureGate> de section.
    assert.equal(isTemplateLocked({ code: ESSENTIEL_TEMPLATE_CODE }, false), false)
    assert.equal(isTemplateLocked({ code: ESSENTIEL_TEMPLATE_CODE }, true), false)
  })

  test('un template de code différent d\'`essentiel` est verrouillé sans la feature', () => {
    assert.equal(isTemplateLocked({ code: 'signature' }, false), true)
  })

  test('le même template est déverrouillé avec la feature', () => {
    assert.equal(isTemplateLocked({ code: 'signature' }, true), false)
  })

  test('REGRESSION: la règle est « code !== essentiel », pas une liste blanche', () => {
    // Miroir exact du backend 18.3a
    // (typeorm-provider-account-command.service.ts) : l'admin peut créer
    // d'autres codes via POST /admin/coach-page-templates, qu'une liste en dur
    // ouvrirait silencieusement.
    for (const code of ['signature', 'luxe', 'template-inconnu-2027']) {
      assert.equal(isTemplateLocked({ code }, false), true, `${code} doit être verrouillé`)
      assert.equal(isTemplateLocked({ code }, true), false, `${code} doit être ouvert avec la feature`)
    }
  })

  test('le code du template libre est le miroir du backend (ESSENTIEL_TEMPLATE_CODE)', () => {
    assert.equal(ESSENTIEL_TEMPLATE_CODE, 'essentiel')
  })
})

describe('18.3b — resolvePremiumTemplatesAccess (politique par statut de gate)', () => {
  test('REGRESSION: pendant `unknown`, l\'accès est présumé OUVERT (pas de flash lock→unlock)', () => {
    // AC #2 : tant que le plan n'est pas résolu, aucune carte ne doit clignoter
    // en verrouillé. La fenêtre vaut quelques dizaines de ms ; un clic pendant
    // celle-ci reçoit un 403 du backend 18.3a + le toast global 18.2.
    assert.equal(resolvePremiumTemplatesAccess('unknown', false), true)
  })

  test('REGRESSION: pendant `unknown`, un template premium n\'est donc PAS verrouillé', () => {
    const open = resolvePremiumTemplatesAccess('unknown', false)
    assert.equal(isTemplateLocked({ code: 'signature' }, open), false)
  })

  test('sur `error`, l\'accès est refusé (deny par défaut, aligné sur FeatureGate)', () => {
    assert.equal(resolvePremiumTemplatesAccess('error', false), false)
    assert.equal(isTemplateLocked({ code: 'signature' }, resolvePremiumTemplatesAccess('error', false)), true)
  })

  test('sur `ready`, la réponse du gate fait autorité', () => {
    assert.equal(resolvePremiumTemplatesAccess('ready', true), true)
    assert.equal(resolvePremiumTemplatesAccess('ready', false), false)
  })
})

describe('18.3b — wording de la pastille (Convention A31)', () => {
  test('REGRESSION: la pastille lit « Premium » verbatim', () => {
    assert.equal(PREMIUM_TEMPLATE_BADGE_LABEL, 'Premium')
  })

  test('le libellé est DÉRIVÉ de FEATURE_MIN_PLAN_LABEL, jamais recopié', () => {
    // Si un futur plan intermédiaire débloque les templates premium, seul
    // FEATURE_MIN_PLAN_LABEL doit changer — la pastille suit.
    assert.equal(
      PREMIUM_TEMPLATE_BADGE_LABEL,
      FEATURE_MIN_PLAN_LABEL[FEATURE_COACH_PAGE_PREMIUM_TEMPLATES]
    )
  })
})
