/**
 * WA.4 — Détail d'une notification : le lien client peut être nul.
 *
 * `client_id` est devenu nullable (une notification d'administration de
 * waitlist n'a pas de client). Les tests existants n'assertaient que la **source**
 * du panneau (`ds4-responsive-tables`, `ds4-modal-slideover-convention`) : une
 * assertion de regex passe sur du markup mort. Ici le détail réel est **rendu**
 * par le harness SFC, avec `clientId: null` puis une valeur, pour prouver le
 * repli `—` à l'exécution.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { renderSfc } from '../helpers/render-sfc'
import type { AdminNotificationLogDetail } from '../../app/features/admin/api/admin-notification-log.contract'

const DETAIL_PATH = 'app/components/organisms/AdminNotificationLogDetail.vue'

function baseDetail(
  overrides: Partial<AdminNotificationLogDetail> = {}
): AdminNotificationLogDetail {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'email',
    channel: 'waitlist_admin',
    status: 'sent',
    recipient: 'sha256:1842d80d41e083d30a38dc8b06e8f5f5e086fde61d9c0eff43227298728bb70e',
    payloadPreview:
      'specialty=naturopathie;activityStage=preparation-lancement;mainBlocker=partie-technique',
    errorMessage: null,
    providerMessageId: null,
    attemptCount: 1,
    appointmentId: null,
    clientId: null,
    createdAt: '2026-10-10T17:50:11.000Z',
    ...overrides
  }
}

/**
 * Contenu de la cellule « Client ID », commentaires de gabarit retirés. Cibler
 * la cellule par son `data-testid` évite qu'un `—` d'une autre ligne (Provider
 * Message ID, par exemple) fasse passer l'assertion.
 */
function clientIdText(html: string): string {
  const cell = html.match(
    /<p[^>]*data-testid="admin-notification-log-client-id"[^>]*>([\s\S]*?)<\/p>/
  )
  assert.ok(cell, 'the client id cell must render')
  return cell![1].replace(/<!--[\s\S]*?-->/g, '').trim()
}

describe('WA.4 — détail d\'une notification : clientId nullable (AC-3)', () => {
  test('clientId null : la cellule rend « — »', async () => {
    const html = await renderSfc(DETAIL_PATH, {
      props: { detail: baseDetail({ clientId: null }) }
    })

    assert.equal(clientIdText(html), '—')
    // L'assertion est portée sur la cellule (« Client ID »), pas sur tout le HTML :
    // un attribut, une classe ou un libellé contenant « null » ailleurs dans le
    // composant ne doit pas faire passer ou casser ce test.
    assert.ok(
      !clientIdText(html).includes('null'),
      'no "null" may leak where the admin expects a dash'
    )
  })

  test('clientId non nul : l\'identifiant est rendu tel quel', async () => {
    const clientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const html = await renderSfc(DETAIL_PATH, {
      props: { detail: baseDetail({ clientId }) }
    })

    assert.equal(clientIdText(html), clientId)
  })
})
