import { apiFetch } from '../../../services/api/apiFetch'

import type { NotificationPreferences } from '../api/notification-preferences.contract'

export type { NotificationPreferences }

export type UpdateNotificationPreferencesRequest = {
  platformContentPublished?: boolean
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return await apiFetch<NotificationPreferences>('/provider/notifications/preferences', { method: 'GET', withAuth: true })
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesRequest
): Promise<NotificationPreferences> {
  return await apiFetch<NotificationPreferences>('/provider/notifications/preferences', {
    method: 'PATCH',
    withAuth: true,
    body: payload
  })
}
