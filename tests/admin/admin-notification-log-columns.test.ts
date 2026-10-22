/**
 * WA.7 — C1 : la colonne « Motif » du tableau des notifications admin.
 *
 * La liste est la **source de vérité opérationnelle** : le motif doit y être
 * lisible sans ouvrir le détail. Cette suite couvre le rendu de la cellule
 * desktop — le `UTable` étant un stub dans le harnais, la cellule est
 * construite et inspectée directement.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import type * as Vue from 'vue'

import {
  buildNotificationLogColumns,
  formatRecipient
} from '../../app/features/admin/domain/admin-notification-log-columns'
import type { AdminNotificationLogListItem } from '../../app/features/admin/api/admin-notification-log.contract'

function logFixture(
  overrides: Partial<AdminNotificationLogListItem> = {}
): AdminNotificationLogListItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'email',
    channel: 'waitlist_admin',
    status: 'skipped',
    recipient: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    appointmentId: null,
    reason: 'honeypot_detected',
    createdAt: '2026-10-20T17:50:11.000Z',
    ...overrides
  }
}

/**
 * Colonne telle que le module la construit — le type public de `UTable` est
 * une union dont `accessorKey` n'est pas garanti.
 */
type ReasonColumn = {
  accessorKey?: string
  header?: unknown
  cell?: unknown
}

function reasonColumn(): ReasonColumn {
  const columns = buildNotificationLogColumns({ openDetail: () => {} })
  const column = columns.find(
    entry => (entry as ReasonColumn).accessorKey === 'reason'
  )
  if (!column) throw new Error('the table must expose a "reason" column')
  return column as ReasonColumn
}

/** Rend la cellule « Motif » d'une ligne et renvoie son contenu textuel. */
function renderReasonCell(item: AdminNotificationLogListItem): Vue.VNode {
  const column = reasonColumn()
  const cell = column.cell as (
    args: { row: { original: AdminNotificationLogListItem } }
  ) => Vue.VNode
  return cell({ row: { original: item } })
}

describe('WA.7 — colonne « Motif » du tableau (C1)', () => {
  test('la colonne existe et s\'intitule « Motif »', () => {
    assert.equal(reasonColumn().header, 'Motif')
  })

  test('un rejet de robot est lisible dans la cellule', () => {
    const vnode = renderReasonCell(logFixture({ reason: 'honeypot_detected' }))

    assert.equal(vnode.children, 'Rejet robot')
  })

  test('une ligne sans motif rend le tiret neutre', () => {
    const vnode = renderReasonCell(logFixture({ reason: null }))

    assert.equal(vnode.children, '—')
  })

  test('la cellule ne porte pas le message brut', () => {
    // La ligne de liste n'a **pas** de `error_message` : c'est le détail qui
    // le porte. La cellule ne peut donc pas l'afficher.
    const vnode = renderReasonCell(logFixture())

    assert.equal(
      Object.prototype.hasOwnProperty.call(vnode.props ?? {}, 'title'),
      false
    )
    assert.equal(JSON.stringify(vnode.children).includes('honeypot_detected'), false)
  })

  test('le destinataire reste tronqué dans la table', () => {
    const shown = formatRecipient(
      'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )

    assert.match(shown, /^sha256:[0-9a-f]{8}…$/)
  })
})
