import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  LANDING_EVENTS,
  isLandingTrackingAllowed,
  isLandingEventName,
  isAccessCtaZone,
  buildLandingEventPayload,
  pushLandingEvent
} from '../../app/features/marketing/landing-events'

// ── Consentement (décisions 2026-09-19 §22-23) ──

describe('isLandingTrackingAllowed', () => {
  it('refuse tant qu\'aucun choix n\'a été fait (null)', () => {
    assert.equal(isLandingTrackingAllowed(null), false)
  })

  it('refuse quand les cookies optionnels sont refusés (essential)', () => {
    assert.equal(isLandingTrackingAllowed('essential'), false)
  })

  it('autorise après acceptation (all)', () => {
    assert.equal(isLandingTrackingAllowed('all'), true)
  })

  it('refuse un simple acquittement de la bannière (acknowledged)', () => {
    // « Compris » sur la bannière informative est un accusé de lecture, pas un
    // consentement à des événements marketing (décision 22).
    assert.equal(isLandingTrackingAllowed('acknowledged'), false)
  })
})

// ── Noms d'événements ──

describe('LANDING_EVENTS', () => {
  it('expose exactement les six événements canoniques', () => {
    assert.deepEqual(Object.values(LANDING_EVENTS).sort(), [
      'access_cta_click',
      'access_form_start',
      'access_request_success',
      'landing_view',
      'login_click',
      'proof_sophie_click'
    ])
  })

  it('reconnaît un nom connu et rejette un nom inconnu', () => {
    assert.equal(isLandingEventName('landing_view'), true)
    assert.equal(isLandingEventName('scroll_depth'), false)
  })

  it('reconnaît les zones CTA canoniques', () => {
    for (const zone of ['hero', 'mid_page', 'pricing', 'footer']) {
      assert.equal(isAccessCtaZone(zone), true, zone)
    }
    assert.equal(isAccessCtaZone('sidebar'), false)
  })
})

// ── Payload sans PII ──

describe('buildLandingEventPayload', () => {
  it('construit un payload minimal pour landing_view', () => {
    assert.deepEqual(buildLandingEventPayload('landing_view'), { event: 'landing_view' })
  })

  it('accepte la propriété zone pour access_cta_click', () => {
    const payload = buildLandingEventPayload('access_cta_click', { zone: 'hero' })
    assert.deepEqual(payload, { event: 'access_cta_click', zone: 'hero' })
  })

  it('filtre toute propriété non whitelistée (anti-PII)', () => {
    const payload = buildLandingEventPayload('access_cta_click', {
      zone: 'pricing',
      email: 'marie@example.com',
      firstName: 'Marie'
    })
    assert.deepEqual(payload, { event: 'access_cta_click', zone: 'pricing' })
  })

  it('ignore les propriétés non attendues pour un événement sans props', () => {
    const payload = buildLandingEventPayload('landing_view', { email: 'x@y.fr' })
    assert.deepEqual(payload, { event: 'landing_view' })
  })

  it('retourne null pour un nom d\'événement inconnu', () => {
    assert.equal(buildLandingEventPayload('page_view'), null)
  })
})

// ── Garde de consentement, éprouvée en exécutant le push ──
//
// Ces tests font tourner la fonction pure avec une couche de données injectée.
// Auparavant, la garde n'était vérifiée que par une assertion de texte source
// sur `useLandingAnalytics.ts` : inverser la condition ou déplacer le `push`
// avant le `return` laissait la suite verte.

describe('pushLandingEvent', () => {
  it('ne pousse RIEN tant que le consentement n\'est pas accordé', () => {
    const dataLayer: Array<Record<string, string>> = []

    for (const consent of [null, 'essential', 'acknowledged'] as const) {
      assert.equal(pushLandingEvent(consent, dataLayer, 'landing_view'), false, `consent=${consent}`)
    }

    assert.deepEqual(dataLayer, [])
  })

  it('pousse le payload attendu quand le consentement vaut « all »', () => {
    const dataLayer: Array<Record<string, string>> = []

    assert.equal(pushLandingEvent('all', dataLayer, 'access_cta_click', { zone: 'hero' }), true)
    assert.deepEqual(dataLayer, [{ event: 'access_cta_click', zone: 'hero' }])
  })

  it('ne pousse rien pour un nom d\'événement inconnu, même consenti', () => {
    const dataLayer: Array<Record<string, string>> = []

    assert.equal(pushLandingEvent('all', dataLayer, 'scroll_depth'), false)
    assert.deepEqual(dataLayer, [])
  })

  it('ne laisse jamais fuiter de PII, même si l\'appelant en fournit', () => {
    const dataLayer: Array<Record<string, string>> = []

    pushLandingEvent('all', dataLayer, 'landing_view', { email: 'marie@example.com' })

    assert.deepEqual(dataLayer, [{ event: 'landing_view' }])
    assert.ok(!JSON.stringify(dataLayer).includes('marie@example.com'))
  })
})
