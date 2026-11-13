<template>
  <div class="space-y-6">
    <!-- Provider -->
    <section class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-[color:var(--color-brand-primary)]">Fournisseur configuré :</span>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] border border-[color:var(--color-border-subtle)]">
          {{ providerLabel }}
        </span>
        <span
          v-if="simulated"
          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--color-warning-100)] text-[color:var(--color-warning-700)]"
        >
          Simulation (console) — aucun email réel n'est envoyé
        </span>
      </div>
      <p
        v-if="simulated"
        class="mt-2 text-xs text-[color:var(--color-brand-muted)]"
      >
        En mode console, un email de test ne prouve pas la chaîne complète : il est tracé comme « simulé ».
      </p>
    </section>

    <!-- Test email form -->
    <section class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4 space-y-3">
      <h3 class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
        Envoyer un email de test
      </h3>
      <div class="flex flex-col gap-3 md:flex-row md:items-end">
        <div class="flex-1">
          <label
            class="text-xs text-[color:var(--color-brand-muted)]"
            for="testKind"
          >Modèle</label>
          <select
            id="testKind"
            v-model="testKind"
            class="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] px-3 text-sm text-[color:var(--color-brand-primary)]"
          >
            <option
              v-for="entry in catalogue"
              :key="entry.kind"
              :value="entry.kind"
            >
              {{ entry.label }} ({{ entry.kind }})
            </option>
          </select>
        </div>
        <div class="flex-1">
          <label
            class="text-xs text-[color:var(--color-brand-muted)]"
            for="testTo"
          >Destinataire</label>
          <input
            id="testTo"
            v-model="testTo"
            type="email"
            autocomplete="off"
            placeholder="praticienne@exemple.fr"
            class="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] px-3 text-sm text-[color:var(--color-brand-primary)]"
          >
        </div>
        <UButton
          color="primary"
          :loading="sending"
          :disabled="!testKind || !testTo"
          @click="sendTest"
        >
          Envoyer
        </UButton>
      </div>
      <p
        v-if="testResult"
        class="text-xs text-[color:var(--color-brand-secondary)]"
      >
        {{ testResult }}
      </p>
    </section>

    <!-- Catalogue table -->
    <section class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)]">
      <div
        v-if="pending"
        class="space-y-3 p-8"
      >
        <USkeleton class="h-10 rounded-xl" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 rounded-xl"
        />
      </div>
      <AtomsDsErrorState
        v-else-if="error"
        :message="error?.message || 'Erreur lors du chargement des emails'"
        @retry="refresh()"
      />
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[color:var(--color-border-subtle)] text-left text-xs text-[color:var(--color-brand-muted)]">
              <th class="px-4 py-3">
                Email
              </th>
              <th class="px-4 py-3">
                Catégorie
              </th>
              <th class="px-4 py-3">
                Canal
              </th>
              <th class="px-4 py-3">
                Traçabilité
              </th>
              <th class="px-4 py-3">
                Dernier envoi
              </th>
              <th class="px-4 py-3">
                Dernier échec
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in catalogue"
              :key="entry.kind"
              class="border-b border-[color:var(--color-border-subtle)]/50"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-[color:var(--color-brand-primary)]">
                  {{ entry.label }}
                </div>
                <div class="text-xs text-[color:var(--color-brand-muted)]">
                  {{ entry.kind }}
                </div>
                <div class="text-xs text-[color:var(--color-brand-muted)] mt-1">
                  {{ entry.trigger }}
                </div>
              </td>
              <td class="px-4 py-3 text-[color:var(--color-brand-secondary)]">
                {{ entry.category }}
              </td>
              <td class="px-4 py-3 text-[color:var(--color-brand-secondary)]">
                {{ entry.channels.length ? entry.channels.join(', ') : '—' }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="entry.traceability === 'tracked'
                    ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
                    : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'"
                >
                  {{ entry.traceability === 'tracked' ? 'Tracé' : 'Non tracé' }}
                </span>
              </td>
              <td class="px-4 py-3 text-[color:var(--color-brand-secondary)]">
                <template v-if="activityFor(entry.kind)?.lastSend">
                  <div>{{ activityFor(entry.kind)!.lastSend!.status }}</div>
                  <div class="text-xs text-[color:var(--color-brand-muted)]">
                    {{ formatDate(activityFor(entry.kind)!.lastSend!.createdAt) }}
                  </div>
                  <div
                    v-if="activityFor(entry.kind)!.lastSend!.providerMessageId"
                    class="text-xs font-mono text-[color:var(--color-brand-muted)]"
                  >
                    {{ activityFor(entry.kind)!.lastSend!.providerMessageId }}
                  </div>
                  <div
                    v-else-if="simulated"
                    class="text-xs text-[color:var(--color-warning-700)]"
                  >
                    simulé
                  </div>
                </template>
                <span
                  v-else
                  class="text-[color:var(--color-brand-muted)]"
                >—</span>
              </td>
              <td class="px-4 py-3 text-[color:var(--color-brand-secondary)]">
                <template v-if="activityFor(entry.kind)?.lastFailure">
                  <div class="text-xs text-[color:var(--color-error-700)]">
                    {{ activityFor(entry.kind)!.lastFailure!.errorMessage || 'échec' }}
                  </div>
                  <div class="text-xs text-[color:var(--color-brand-muted)]">
                    {{ formatDate(activityFor(entry.kind)!.lastFailure!.createdAt) }}
                  </div>
                </template>
                <span
                  v-else
                  class="text-[color:var(--color-brand-muted)]"
                >—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { listAdminEmailCatalogue, getAdminEmailsActivity, sendAdminTestEmail } from '~/features/admin/services/admin-emails.service'
import type { EmailCatalogueEntry, AdminEmailsActivity } from '~/features/admin/api/admin-emails.contract'

const toast = useToast()

const testKind = ref<string>('')
const testTo = ref<string>('')
const sending = ref(false)
const testResult = ref<string>('')

const { data: catalogueData, pending, error, refresh } = await useAsyncData<EmailCatalogueEntry[]>(
  'admin-emails-catalogue',
  () => listAdminEmailCatalogue()
)

const { data: activityData, refresh: refreshActivity } = await useAsyncData<AdminEmailsActivity>(
  'admin-emails-activity',
  () => getAdminEmailsActivity()
)

const catalogue = computed<EmailCatalogueEntry[]>(() => catalogueData.value ?? [])
const activity = computed<AdminEmailsActivity | null>(() => activityData.value ?? null)

const providerLabel = computed(() => activity.value?.provider ?? 'console')
const simulated = computed(() => activity.value?.simulated ?? providerLabel.value === 'console')

watch(catalogue, (items) => {
  if (!testKind.value && items.length) {
    testKind.value = items[0]?.kind ?? testKind.value
  }
}, { immediate: true })

function activityFor(kind: string) {
  return activity.value?.items.find(i => i.kind === kind) ?? null
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('fr-FR')
  } catch {
    return value
  }
}

async function sendTest() {
  if (!testKind.value || !testTo.value) return
  sending.value = true
  testResult.value = ''
  try {
    const result = await sendAdminTestEmail({ kind: testKind.value, toEmail: testTo.value })
    testResult.value = result.status === 'sent'
      ? `Email de test envoyé (${result.simulated ? 'simulé' : result.providerMessageId ?? 'accepté'}).`
      : 'Échec de l\'envoi de l\'email de test.'
    toast.add({
      title: result.status === 'sent' ? 'Envoyé' : 'Échec',
      description: testResult.value,
      color: result.status === 'sent' ? 'success' : 'error'
    })
    await refreshActivity()
  } catch (e) {
    const msg = (e as Error)?.message || 'Erreur lors de l\'envoi.'
    testResult.value = msg
    toast.add({ title: 'Erreur', description: msg, color: 'error' })
  } finally {
    sending.value = false
  }
}
</script>
