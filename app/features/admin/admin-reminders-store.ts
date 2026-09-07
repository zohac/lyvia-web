import { computed, ref, shallowRef } from 'vue'
import type { ReminderBatch, ReminderOverview } from './api/admin-reminders.contract'

export interface AdminRemindersService {
  get(): Promise<ReminderOverview>
  run(): Promise<ReminderBatch>
}

export function createAdminRemindersStore(service: AdminRemindersService) {
  const overview = shallowRef<ReminderOverview | null>(null)
  const result = shallowRef<ReminderBatch | null>(null)
  const loading = ref(false)
  const running = ref(false)
  const loadError = ref<string | null>(null)
  const runError = ref<string | null>(null)
  const canRun = computed(() => !running.value && !loading.value
    && overview.value?.enabled === true && overview.value.jobs.some(job => job.enabled))

  async function refresh(): Promise<void> {
    if (loading.value) return
    loading.value = true
    loadError.value = null
    try {
      overview.value = await service.get()
    } catch {
      loadError.value = 'Impossible de charger le suivi des rappels. Actualisez pour réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function run(): Promise<boolean> {
    if (!canRun.value) return false
    running.value = true
    result.value = null
    runError.value = null
    try {
      result.value = await service.run()
    } catch {
      runError.value = 'Le résultat du lancement n’a pas pu être confirmé. Consultez les dernières exécutions avant de relancer : des emails ont pu être envoyés.'
    } finally {
      await refresh()
      running.value = false
    }
    return true
  }

  return { overview, result, loading, running, loadError, runError, canRun, refresh, run }
}
