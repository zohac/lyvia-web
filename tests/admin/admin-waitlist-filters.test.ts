/**
 * Panneau admin de la waitlist — dérivations pures de la liste.
 *
 * Ces deux helpers remplacent du calcul qui vivait dans le gabarit :
 *  - la plage de dates était construite avec `new Date('yyyy-mm-ddThh:mm')`,
 *    puis envoyée telle quelle à l'API, qui compare `created_at <= dateTo` —
 *    choisir le même jour dans « Du » et « Au » excluait donc tout ce qui avait
 *    été reçu après minuit ;
 *  - les trois champs de qualification étaient rendus en trois lignes, d'où
 *    trois tirets empilés pour une demande non qualifiée.
 *
 * Les assertions portent sur le **comportement** (composantes de date locale,
 * libellés) et non sur la forme du code : une réécriture du helper ne doit pas
 * les casser si le résultat est identique.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  buildWaitlistDateRange,
  qualificationSummary
} from '../../app/features/admin/admin-waitlist-helpers'

function parts(iso: string): number[] {
  const date = new Date(iso)
  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  ]
}

describe('buildWaitlistDateRange — bornes du jour local', () => {
  test('« Du » commence à minuit et « Au » finit à la dernière milliseconde', () => {
    const { dateFrom, dateTo } = buildWaitlistDateRange('2026-10-22', '2026-10-24')

    assert.ok(dateFrom, 'dateFrom must be produced')
    assert.ok(dateTo, 'dateTo must be produced')
    assert.deepEqual(parts(dateFrom!), [2026, 9, 22, 0, 0, 0, 0])
    assert.deepEqual(parts(dateTo!), [2026, 9, 24, 23, 59, 59, 999])
  })

  test('le même jour des deux côtés couvre la journée entière', () => {
    // L'API filtre `created_at <= dateTo` : sans borne de fin de journée, ce
    // cas ne renverrait que les demandes reçues exactement à minuit.
    const { dateFrom, dateTo } = buildWaitlistDateRange('2026-10-22', '2026-10-22')

    assert.deepEqual(parts(dateFrom!), [2026, 9, 22, 0, 0, 0, 0])
    assert.deepEqual(parts(dateTo!), [2026, 9, 22, 23, 59, 59, 999])
    assert.ok(new Date(dateFrom!).getTime() < new Date(dateTo!).getTime())
  })

  test('une borne vide ne produit pas de filtre', () => {
    assert.deepEqual(buildWaitlistDateRange('', ''), {
      dateFrom: undefined,
      dateTo: undefined
    })

    const onlyFrom = buildWaitlistDateRange('2026-10-22', '')
    assert.ok(onlyFrom.dateFrom, 'the filled bound is kept')
    assert.equal(onlyFrom.dateTo, undefined, 'the empty bound is dropped')
  })

  test('une date inexistante est refusée, pas roulée au 2 mars', () => {
    // `new Date(2026, 1, 31)` donne le 3 mars : accepter la valeur ferait
    // filtrer sur un jour que l'admin n'a jamais choisi.
    assert.deepEqual(buildWaitlistDateRange('2026-02-31', ''), {
      dateFrom: undefined,
      dateTo: undefined
    })
  })

  test('une valeur hors format `yyyy-mm-dd` est ignorée', () => {
    assert.deepEqual(buildWaitlistDateRange('22/10/2026', '2026-10-22T10:00'), {
      dateFrom: undefined,
      dateTo: undefined
    })
  })
})

describe('qualificationSummary — une demande non qualifiée n\'est pas trois tirets', () => {
  test('les trois champs absents marquent le bloc comme vide', () => {
    const summary = qualificationSummary({
      activityStage: null,
      mainBlocker: null,
      discoverySource: null
    })

    assert.equal(summary.empty, true)
  })

  test('un seul champ renseigné suffit à rendre le bloc détaillé', () => {
    const summary = qualificationSummary({
      activityStage: 'lancement-recent',
      mainBlocker: null,
      discoverySource: null
    })

    assert.equal(summary.empty, false)
    assert.equal(summary.stage, 'Je viens de me lancer')
    assert.equal(summary.blocker, '—', 'the missing field keeps its own fallback')
    assert.equal(summary.source, '—')
  })

  test('les libellés viennent de la source partagée avec le formulaire public', () => {
    const summary = qualificationSummary({
      activityStage: 'structuration',
      mainBlocker: 'creer-site',
      discoverySource: 'autre-praticienne'
    })

    assert.deepEqual(summary, {
      empty: false,
      stage: 'Mon activité existe déjà et je la structure',
      blocker: 'Créer ou terminer mon site',
      source: 'Une autre praticienne'
    })
  })
})
