import { h } from 'vue'

import type { TableColumn } from '@nuxt/ui'

import type { AdminNotificationLogListItem } from '../api/admin-notification-log.contract'
import {
  getNotificationReasonBadgeClasses,
  getNotificationReasonLabel
} from './admin-notification-log-filters'
import {
  getNotificationStatusBadgeClasses,
  getNotificationStatusLabel,
  getNotificationTypeBadgeClasses
} from '../../../composables/useAdminBadges'
import { formatNotificationDate } from '../format-notification-date'

/**
 * Destinataire affichable : le haché `sha256:` est tronqué pour la table.
 * Le hachage complet reste dans l'attribut `title`.
 */
export function formatRecipient(recipient: string): string {
  if (recipient.startsWith('sha256:')) {
    return `sha256:${recipient.slice(7, 15)}…`
  }
  return recipient
}

export type NotificationLogColumnsOptions = {
  /** Ouvre le détail de la notification — le panneau est seul à le savoir. */
  openDetail: (notification: AdminNotificationLogListItem) => void
}

/**
 * Colonnes du tableau des notifications admin.
 *
 * La colonne **Motif** (WA.7, C1) rend le motif court déduit de
 * `error_message` : un rejet de robot est donc lisible **dans la liste**, sans
 * ouvrir le détail. Le message brut, lui, reste dans le détail.
 */
export function buildNotificationLogColumns(
  options: NotificationLogColumnsOptions
): TableColumn<AdminNotificationLogListItem>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        return h('span', { class: 'text-sm text-[color:var(--color-brand-secondary)]' }, formatNotificationDate(row.original.createdAt))
      }
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        return h('span', {
          class: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationTypeBadgeClasses(row.original.type)}`
        }, row.original.type)
      }
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }) => {
        return h('span', {
          class: 'text-sm text-[color:var(--color-brand-primary)]'
        }, row.original.channel)
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return h('span', {
          class: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationStatusBadgeClasses(row.original.status)}`
        }, getNotificationStatusLabel(row.original.status))
      }
    },
    {
      accessorKey: 'reason',
      header: 'Motif',
      cell: ({ row }) => {
        const reason = row.original.reason
        if (!reason) {
          return h('span', {
            class: 'text-xs text-[color:var(--color-brand-muted)]'
          }, '—')
        }
        return h('span', {
          'data-testid': 'admin-notification-log-reason-cell',
          'class': `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationReasonBadgeClasses(reason)}`
        }, getNotificationReasonLabel(reason))
      }
    },
    {
      accessorKey: 'recipient',
      header: 'Destinataire',
      cell: ({ row }) => {
        return h('span', {
          class: 'font-mono text-xs text-[color:var(--color-brand-muted)]',
          title: row.original.recipient
        }, formatRecipient(row.original.recipient))
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return h('button', {
          class: 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:bg-[color:var(--color-ui-primary-50)] hover:text-[color:var(--color-brand-primary)]',
          onClick: () => options.openDetail(row.original)
        }, [
          h('span', {}, 'Détails'),
          h('svg', {
            'class': 'h-3.5 w-3.5',
            'xmlns': 'http://www.w3.org/2000/svg',
            'fill': 'none',
            'viewBox': '0 0 24 24',
            'stroke': 'currentColor',
            'stroke-width': '2'
          }, [
            h('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'd': 'M9 5l7 7-7 7'
            })
          ])
        ])
      }
    }
  ]
}
