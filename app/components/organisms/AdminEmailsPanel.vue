<template>
  <div class="space-y-6">
    <!-- Provider -->
    <section class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-[color:var(--color-brand-primary)]">Fournisseur configuré :</span>
        <!--
          Tant que l'activité n'est pas chargée, le fournisseur est **inconnu** :
          afficher « console » par défaut annoncerait une simulation qui n'a
          peut-être pas lieu (et l'inverse après un changement de MAIL_PROVIDER).
        -->
        <span
          v-if="providerKnown"
          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] border border-[color:var(--color-border-subtle)]"
        >
          {{ providerLabel }}
        </span>
        <USkeleton
          v-else
          class="h-6 w-24 rounded-full"
        />
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
        @retry="reload()"
      />
      <div
        v-else
        class="overflow-x-auto"
      >
        <!--
          `table-fixed` + `colgroup` : la colonne « Email » porte le déclencheur,
          une phrase longue. En largeur automatique elle poussait « Dernier
          échec » hors de l'écran à 1440 px (constat de revue : la colonne était
          coupée, pas seulement scrollable). Les proportions sont donc fixées et
          le texte passe à la ligne ; sur téléphone, `min-w` garde des colonnes
          lisibles et la boîte défile horizontalement (les six colonnes restent
          atteignables).
        -->
        <table class="w-full min-w-[64rem] table-fixed text-sm">
          <colgroup>
            <col class="w-[24%]">
            <col class="w-[10%]">
            <col class="w-[20%]">
            <col class="w-[14%]">
            <col class="w-[16%]">
            <col class="w-[16%]">
          </colgroup>
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
                  <!--
                    « simulé » vient de la ligne (`simulated` persisté), pas du
                    fournisseur courant : une ligne écrite en console reste
                    simulée même après un passage à brevo.
                  -->
                  <div
                    v-if="activityFor(entry.kind)?.lastSend?.simulated"
                    class="text-xs text-[color:var(--color-warning-700)]"
                  >
                    simulé (aucun envoi réel)
                  </div>
                  <div v-else>
                    {{ activityFor(entry.kind)?.lastSend?.status }}
                  </div>
                  <div class="text-xs text-[color:var(--color-brand-muted)]">
                    {{ formatDate(activityFor(entry.kind)?.lastSend?.createdAt) }}
                  </div>
                  <div
                    v-if="activityFor(entry.kind)?.lastSend?.providerMessageId"
                    class="text-xs font-mono break-all text-[color:var(--color-brand-muted)]"
                  >
                    {{ activityFor(entry.kind)?.lastSend?.providerMessageId }}
                  </div>
                </template>
                <span
                  v-else
                  class="text-[color:var(--color-brand-muted)]"
                >—</span>
              </td>
              <td class="px-4 py-3 text-[color:var(--color-brand-secondary)]">
                <template v-if="activityFor(entry.kind)?.lastFailure">
                  <div class="text-xs break-words text-[color:var(--color-error-700)]">
                    {{ activityFor(entry.kind)?.lastFailure?.errorMessage || 'échec' }}
                  </div>
                  <div class="text-xs text-[color:var(--color-brand-muted)]">
                    {{ formatDate(activityFor(entry.kind)?.lastFailure?.createdAt) }}
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
import type {
  AdminEmailsActivity,
  AdminEmailActivityItem,
  EmailCatalogueEntry
} from '~/features/admin/api/admin-emails.contract'

const toast = useToast()

const testKind = ref<string>('')
const testTo = ref<string>('')
const sending = ref(false)
const testResult = ref<string>('')

const {
  data: catalogueData,
  pending: cataloguePending,
  error: catalogueError,
  refresh: refreshCatalogue
} = await useAsyncData<EmailCatalogueEntry[]>(
  'admin-emails-catalogue',
  () => listAdminEmailCatalogue()
)

/**
 * L'activité a **son propre** état de chargement et d'erreur. Les fusionner
 * sous celui du catalogue laissait un écran qui affichait « — » partout quand
 * `/admin/emails/activity` échouait : une absence de données présentée comme
 * une absence d'envoi.
 */
const {
  data: activityData,
  pending: activityPending,
  error: activityError,
  refresh: refreshActivity
} = await useAsyncData<AdminEmailsActivity>(
  'admin-emails-activity',
  () => getAdminEmailsActivity()
)

const catalogue = computed<EmailCatalogueEntry[]>(() => catalogueData.value ?? [])
const activity = computed<AdminEmailsActivity | null>(() => activityData.value ?? null)

const pending = computed(() => cataloguePending.value || activityPending.value)
const error = computed(() => catalogueError.value ?? activityError.value ?? null)

const providerKnown = computed(() => activity.value !== null)
const providerLabel = computed<string>(() => activity.value?.provider ?? '')
const simulated = computed<boolean>(() => activity.value?.simulated === true)

/** Index kind → activité : un `find` par cellule ferait 90 parcours par rendu. */
const activityByKind = computed<Map<string, AdminEmailActivityItem>>(() =>
  new Map((activity.value?.items ?? []).map(item => [item.kind, item]))
)

function activityFor(kind: string): AdminEmailActivityItem | null {
  return activityByKind.value.get(kind) ?? null
}

watch(catalogue, (items) => {
  if (!testKind.value && items.length) {
    testKind.value = items[0]?.kind ?? testKind.value
  }
}, { immediate: true })

async function reload(): Promise<void> {
  await Promise.all([refreshCatalogue(), refreshActivity()])
}

function formatDate(value: string | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  // `toLocaleString` ne lève pas sur une date invalide : il rend « Invalid
  // Date ». Un `try/catch` autour laissait donc passer la chaîne anglaise.
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR')
}

async function sendTest(): Promise<void> {
  if (!testKind.value || !testTo.value) return
  sending.value = true
  testResult.value = ''
  try {
    const result = await sendAdminTestEmail({ kind: testKind.value, toEmail: testTo.value })
    if (result.status === 'sent') {
      testResult.value = result.simulated
        ? 'Email de test simulé : aucun email réel n\'a été envoyé (mode console).'
        : `Email de test accepté par le fournisseur (${result.providerMessageId ?? 'sans identifiant fournisseur'}).`
    } else {
      // Le motif technique est dans le registre : on renvoie vers la colonne
      // qui le porte au lieu d'inventer un message dans le navigateur.
      testResult.value = 'Échec de l\'envoi de l\'email de test — motif dans la colonne « Dernier échec ».'
    }
    toast.add({
      title: result.status === 'sent' ? (result.simulated ? 'Simulé' : 'Envoyé') : 'Échec',
      description: testResult.value,
      color: result.status === 'sent' ? (result.simulated ? 'warning' : 'success') : 'error'
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
