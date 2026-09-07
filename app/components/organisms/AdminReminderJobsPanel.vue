<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { formatDateTime } from '~/composables/useDateFormat'
import { createAdminRemindersStore } from '~/features/admin/admin-reminders-store'
import { reminderBatchSummary, reminderJobLabel, reminderStatusLabel } from '~/features/admin/admin-reminders-helpers'
import type { ReminderBatch, ReminderOverview } from '~/features/admin/api/admin-reminders.contract'

const emit = defineEmits<{ executed: [] }>()
const { overview, result, loading, running, loadError, runError, canRun, refresh, run } = createAdminRemindersStore({
  get: () => apiFetch<ReminderOverview>('/admin/reminders'),
  run: () => apiFetch<ReminderBatch>('/admin/reminders/run', { method: 'POST', retry: 0, retryOn401: false })
})
const summary = computed(() => result.value ? reminderBatchSummary(result.value) : null)
onMounted(() => {
  void refresh()
})

async function runDueReminders() {
  if (await run()) emit('executed')
}
</script>

<template>
  <section
    aria-labelledby="reminders-title"
    class="mb-8 space-y-4 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-5"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2
          id="reminders-title"
          class="text-lg font-semibold text-[color:var(--color-brand-primary)]"
        >
          Rappels automatiques
        </h2>
        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
          Lancez les rappels actuellement dus et consultez leur dernier résultat. Les rappels déjà envoyés sont exclus.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :loading="loading"
          :disabled="running"
          @click="refresh()"
        >
          Actualiser
        </UButton>
        <UButton
          icon="i-lucide-send"
          :loading="running"
          :disabled="!canRun"
          @click="runDueReminders"
        >
          Exécuter les rappels dus
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="loadError"
      color="error"
      :description="loadError"
      title="Suivi indisponible"
    />
    <USkeleton
      v-if="loading && !overview"
      class="h-32 w-full"
    />

    <template v-if="overview">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <UBadge
          :color="overview.schedulerEnabled ? 'success' : 'warning'"
          variant="subtle"
        >
          {{ overview.schedulerEnabled ? 'Déclenchement automatique actif' : 'Déclenchement automatique désactivé' }}
        </UBadge>
        <span class="text-[color:var(--color-brand-secondary)]">Service email : {{ overview.mailProvider }}</span>
      </div>
      <UAlert
        v-if="!overview.enabled"
        color="warning"
        title="Les rappels sont désactivés"
        description="Le lancement manuel est également désactivé. Vérifiez la configuration de l’API."
      />
      <UAlert
        v-if="overview.mailProvider === 'console'"
        color="warning"
        title="Aucun email réel ne sera délivré"
        description="Le service email est en mode simulation. Les compteurs d’envoi ne prouvent pas une livraison. Configurez le fournisseur SMTP pour envoyer les rappels."
      />

      <div
        v-if="running || runError || summary"
        aria-live="polite"
      >
        <p
          v-if="running"
          class="text-sm text-[color:var(--color-brand-secondary)]"
        >
          Traitement des rappels en cours…
        </p>
        <UAlert
          v-else-if="runError"
          color="warning"
          title="Résultat non confirmé"
          :description="runError"
        />
        <UAlert
          v-else-if="summary"
          :color="summary.error ? 'error' : 'info'"
          title="Bilan du lancement"
          :description="summary.message"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Dernière exécution de chaque rappel
          </caption>
          <thead class="text-[color:var(--color-brand-muted)]">
            <tr>
              <th class="p-2 font-medium">
                Rappel
              </th>
              <th class="p-2 font-medium">
                Dernière exécution
              </th>
              <th class="p-2 font-medium">
                Résultat
              </th>
              <th class="p-2 font-medium">
                Envoyés / erreurs
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="job in overview.jobs"
              :key="job.key"
              class="border-t border-[color:var(--color-border-subtle)]"
            >
              <th
                scope="row"
                class="p-2 font-medium text-[color:var(--color-brand-primary)]"
              >
                {{ reminderJobLabel(job.key) }}
                <span
                  v-if="!job.enabled"
                  class="block text-xs font-normal"
                >Désactivé</span>
              </th>
              <td class="whitespace-nowrap p-2">
                {{ job.lastRun ? formatDateTime(job.lastRun.startedAt) : 'Aucune exécution enregistrée' }}
              </td>
              <td class="p-2">
                {{ job.lastRun ? reminderStatusLabel(job.lastRun.status) : '—' }}
                <span
                  v-if="job.lastRun?.errorCode"
                  class="block text-xs text-[color:var(--color-error-700)]"
                >Consultez les logs de notifications et de l’API.</span>
              </td>
              <td class="p-2 tabular-nums">
                {{ job.lastRun ? (job.lastRun.countsComplete ? `${job.lastRun.sent} / ${job.lastRun.failed}` : 'Bilan incomplet') : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <UAlert
        v-if="overview.unfinishedRuns.length"
        color="warning"
        title="Des exécutions n’ont pas de fin confirmée"
        description="Elles peuvent être encore en cours ou avoir été interrompues. Vérifiez les logs avant de relancer."
      />
      <ul
        v-if="overview.unfinishedRuns.length"
        class="space-y-1 text-sm text-[color:var(--color-brand-secondary)]"
      >
        <li
          v-for="unfinished in overview.unfinishedRuns"
          :key="unfinished.id ?? unfinished.startedAt"
        >
          {{ reminderJobLabel(unfinished.jobKey) }} — {{ formatDateTime(unfinished.startedAt) }}
        </li>
      </ul>
    </template>
  </section>
</template>
