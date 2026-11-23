import { ref } from 'vue'
import type { NotificationPreferences } from './api/notification-preferences.contract'

export interface CreateNotificationPreferencesDependencies {
  get: () => Promise<NotificationPreferences>
  update: (payload: { platformContentPublished: boolean }) => Promise<NotificationPreferences>
  notify: (notice: { title?: string, description?: string, color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' }) => void
}

export function createNotificationPreferences(deps: CreateNotificationPreferencesDependencies) {
  const loading = ref(true)
  const saving = ref(false)
  const errorMessage = ref<string | null>(null)
  const platformContentPublished = ref(true)

  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = null
    try {
      const response = await deps.get()
      platformContentPublished.value = response.platformContentPublished
    } catch {
      errorMessage.value = 'Impossible de charger les réglages de notification. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function toggle(value: boolean): Promise<void> {
    // The switch is disabled while saving, but a second event delivered before
    // the re-render would otherwise snapshot the optimistic value and roll back
    // to it — losing the value the server actually holds.
    if (saving.value) return
    const previous = platformContentPublished.value
    platformContentPublished.value = value
    saving.value = true
    try {
      const response = await deps.update({ platformContentPublished: value })
      platformContentPublished.value = response.platformContentPublished
    } catch {
      platformContentPublished.value = previous
      deps.notify({ title: 'Impossible d’enregistrer le réglage. Veuillez réessayer.', color: 'error' })
    } finally {
      saving.value = false
    }
  }

  return {
    loading,
    saving,
    errorMessage,
    platformContentPublished,
    load,
    toggle
  }
}
