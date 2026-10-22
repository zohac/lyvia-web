/**
 * WA.7 — C1 : le vocabulaire des motifs et les filtres du panneau admin.
 *
 * Ces helpers sont **purement fonctionnels** : ils sont donc testés
 * directement, et non par assertion de source. Une URL éditée à la main ne
 * doit pas pouvoir produire une requête invalide.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  NOTIFICATION_LOG_REASON_OPTIONS,
  buildNotificationLogFilterQuery,
  emptyNotificationLogFilters,
  getNotificationReasonBadgeClasses,
  getNotificationReasonLabel,
  notificationLogFilterParams,
  parseNotificationLogFilters,
  sameNotificationLogFilters
} from '../../app/features/admin/domain/admin-notification-log-filters'

describe('WA.7 — vocabulaire des motifs (C1)', () => {
  test('le motif honeypot est proposé en premier', () => {
    assert.equal(NOTIFICATION_LOG_REASON_OPTIONS[0].value, 'honeypot_detected')
  })

  test('le motif honeypot a un libellé lisible', () => {
    assert.equal(getNotificationReasonLabel('honeypot_detected'), 'Rejet robot')
  })

  test('le motif retryable annonce un échec REJOUABLE, pas un échec tout court', () => {
    // `retryable` ne qualifie que les échecs que le comparateur de réessai
    // rejoue ; les échecs définitifs retombent dans `other`. Un libellé
    // « Échec d'envoi » promettrait plus que le motif ne dit.
    assert.equal(getNotificationReasonLabel('retryable'), 'Échec rejouable')
  })

  test('un motif inconnu retombe sur son code, jamais sur undefined', () => {
    assert.equal(getNotificationReasonLabel('motif_inconnu'), 'motif_inconnu')
  })

  test('l\'absence de motif se lit « — », pas une chaîne vide', () => {
    assert.equal(getNotificationReasonLabel(null), '—')
  })

  test('chaque motif a une pastille, et le rejet de robot se distingue', () => {
    for (const option of NOTIFICATION_LOG_REASON_OPTIONS) {
      assert.ok(
        getNotificationReasonBadgeClasses(option.value).length > 0,
        `the ${option.value} badge must have classes`
      )
    }

    // Ce qui compte pour l'admin : un rejet de robot ne doit pas ressembler à
    // un motif quelconque, ni à un échec d'envoi.
    const honeypot = getNotificationReasonBadgeClasses('honeypot_detected')
    assert.notEqual(honeypot, getNotificationReasonBadgeClasses('other'))
    assert.notEqual(honeypot, getNotificationReasonBadgeClasses('retryable'))
  })

  test('un motif inconnu reçoit le repli neutre', () => {
    assert.equal(
      getNotificationReasonBadgeClasses('motif_inconnu'),
      getNotificationReasonBadgeClasses('other')
    )
  })
})

describe('WA.7 — lecture des filtres dans l\'URL (C1)', () => {
  test('les filtres connus sont lus', () => {
    const filters = parseNotificationLogFilters({
      notif_type: 'email',
      notif_status: 'skipped',
      notif_reason: 'honeypot_detected'
    })

    assert.equal(filters.type, 'email')
    assert.equal(filters.status, 'skipped')
    assert.equal(filters.reason, 'honeypot_detected')
  })

  test('un motif inconnu est abandonné, pas transmis à l\'API', () => {
    const filters = parseNotificationLogFilters({ notif_reason: 'DROP TABLE' })

    assert.equal(filters.reason, '')
    assert.equal(notificationLogFilterParams(filters).reason, undefined)
  })

  test('un statut inconnu est abandonné', () => {
    assert.equal(parseNotificationLogFilters({ notif_status: 'nope' }).status, '')
  })

  test('une date illisible est abandonnée', () => {
    const filters = parseNotificationLogFilters({ notif_dateFrom: 'pas-une-date' })

    assert.equal(filters.dateFrom, '')
    assert.equal(notificationLogFilterParams(filters).dateFrom, undefined)
  })

  test('une date ISO est abandonnée : l\'input datetime-local ne l\'afficherait pas', () => {
    // Elle serait appliquée à la requête tout en restant invisible dans le
    // panneau : l'URL et l'écran seraient en désaccord.
    const filters = parseNotificationLogFilters({
      notif_dateFrom: '2026-10-01T08:30:00.000Z'
    })

    assert.equal(filters.dateFrom, '')
    assert.equal(notificationLogFilterParams(filters).dateFrom, undefined)
  })

  test('une date au format datetime-local est conservée', () => {
    const filters = parseNotificationLogFilters({ notif_dateFrom: '2026-10-01T08:30' })

    assert.equal(filters.dateFrom, '2026-10-01T08:30')
  })

  test('un paramètre générique n\'est pas lu comme un filtre du panneau', () => {
    // Un `status=` ou un `reason=` sans préfixe appartient à un autre panneau
    // (ou à personne) : il ne doit pas devenir un filtre des notifications.
    const filters = parseNotificationLogFilters({
      status: 'skipped',
      reason: 'honeypot_detected'
    })

    assert.equal(filters.status, '')
    assert.equal(filters.reason, '')
  })

  test('un tableau de valeurs ne garde que la première', () => {
    const filters = parseNotificationLogFilters({ notif_reason: ['honeypot_detected', 'other'] })

    assert.equal(filters.reason, 'honeypot_detected')
  })
})

describe('WA.7 — écriture des filtres dans l\'URL (C1)', () => {
  test('le motif écrit se retrouve dans l\'URL', () => {
    const query = buildNotificationLogFilterQuery(
      { tab: 'notifications' },
      { ...emptyNotificationLogFilters(), reason: 'honeypot_detected' }
    )

    assert.equal(query.notif_reason, 'honeypot_detected')
  })

  test('les autres paramètres de l\'URL sont conservés', () => {
    // `tab=notifications` vit sur la même page que les filtres : le changer ne
    // doit pas renvoyer l'admin sur l'onglet « Analytics ».
    const query = buildNotificationLogFilterQuery(
      { tab: 'notifications' },
      { ...emptyNotificationLogFilters(), reason: 'honeypot_detected' }
    )

    assert.equal(query.tab, 'notifications')
  })

  test('un filtre vidé disparaît de l\'URL', () => {
    const query = buildNotificationLogFilterQuery(
      { tab: 'notifications', notif_reason: 'honeypot_detected' },
      { ...emptyNotificationLogFilters() }
    )

    assert.equal('notif_reason' in query, false)
    assert.equal(query.tab, 'notifications')
  })

  test('les filtres du panneau ne contaminent pas les paramètres d\'un autre panneau', () => {
    // `/admin/tools` partage une seule URL entre ses panneaux : un `status=`
    // générique n'appartient pas aux notifications et ne doit être ni lu ni
    // effacé par elles.
    const query = buildNotificationLogFilterQuery(
      { type: 'email', status: 'skipped' },
      { ...emptyNotificationLogFilters(), reason: 'retryable' }
    )

    assert.equal(query.type, 'email')
    assert.equal(query.status, 'skipped')
    assert.equal(query.notif_reason, 'retryable')
  })

  test('deux jeux de filtres identiques sont égaux', () => {
    const a = { ...emptyNotificationLogFilters(), reason: 'other' }
    const b = { ...emptyNotificationLogFilters(), reason: 'other' }

    assert.equal(sameNotificationLogFilters(a, b), true)
    assert.equal(sameNotificationLogFilters(a, { ...b, reason: 'reserved' }), false)
  })
})

describe('WA.7 — paramètres de la requête API (C1)', () => {
  test('le motif part dans la requête, comme les autres filtres', () => {
    const params = notificationLogFilterParams({
      ...emptyNotificationLogFilters(),
      reason: 'honeypot_detected'
    })

    assert.equal(params.reason, 'honeypot_detected')
    assert.equal(params.limit, '20')
  })

  test('aucun filtre : seuls la limite est envoyée', () => {
    assert.deepEqual(notificationLogFilterParams(emptyNotificationLogFilters()), {
      limit: '20'
    })
  })

  test('les dates partent en ISO 8601', () => {
    const params = notificationLogFilterParams({
      ...emptyNotificationLogFilters(),
      dateFrom: '2026-10-01T08:30'
    })

    assert.equal(params.dateFrom, new Date('2026-10-01T08:30').toISOString())
  })
})
