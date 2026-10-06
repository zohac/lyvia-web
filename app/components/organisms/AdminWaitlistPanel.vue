<template>
  <div ref="panelRoot">
    <!-- Filters -->
    <section class="mb-8 space-y-4">
      <!-- Row 1: Status pills + Specialty select -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[color:var(--color-brand-muted)]">Statut :</span>
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            type="button"
            :class="filterPillClasses(statusFilter === opt.value, 'sm')"
            @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
          <button
            v-if="statusFilter"
            type="button"
            class="ml-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="selectStatus(null)"
          >
            Tous
          </button>
        </div>

        <div class="flex items-center gap-2">
          <label
            for="specialtyFilter"
            class="text-sm text-[color:var(--color-brand-muted)]"
          >Spécialité :</label>
          <USelect
            id="specialtyFilter"
            :model-value="specialtyFilter || 'all'"
            :items="SPECIALTY_SELECT_ITEMS"
            size="sm"
            class="min-w-[180px]"
            @update:model-value="onSpecialtyChange"
          />
        </div>
      </div>

      <!-- Row 2: Search + Dates -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="relative max-w-md flex-1">
          <UIcon
            name="lucide:search"
            size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
          />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Rechercher nom ou email…"
            autocomplete="off"
            class="w-full rounded-full border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] py-3 pl-12 pr-4 text-sm text-[color:var(--color-brand-primary)] placeholder-[color:var(--color-brand-muted)] shadow-sm transition-shadow focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
            @input="onSearchInput"
          >
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label
              for="waitlistDateFrom"
              class="text-sm text-[color:var(--color-brand-muted)]"
            >Du :</label>
            <input
              id="waitlistDateFrom"
              v-model="dateFromInput"
              type="datetime-local"
              autocomplete="off"
              class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
              @change="onDateChange"
            >
          </div>

          <div class="flex items-center gap-2">
            <label
              for="waitlistDateTo"
              class="text-sm text-[color:var(--color-brand-muted)]"
            >Au :</label>
            <input
              id="waitlistDateTo"
              v-model="dateToInput"
              type="datetime-local"
              autocomplete="off"
              class="rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] px-3 py-2 text-sm text-[color:var(--color-brand-primary)] focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-field-ring)]"
              @change="onDateChange"
            >
          </div>

          <button
            v-if="dateFromInput || dateToInput || statusFilter || specialtyFilter || searchInput"
            type="button"
            class="text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-primary)]"
            @click="onResetFilters"
          >
            Tout effacer
          </button>
        </div>
      </div>
    </section>

    <!-- Leads Table -->
    <section
      class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-gradient-to-br from-[color:var(--color-surface-elevated)] to-[color:var(--ui-color-primary-50)]/55 shadow-soft"
      data-testid="admin-waitlist-panel"
    >
      <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--ui-color-primary-100)] opacity-30 blur-[100px]" />

      <div
        v-if="loading && !initialized"
        class="relative z-10 space-y-3 p-8"
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
        :message="error || 'Erreur lors du chargement de la waitlist'"
        class="relative z-10"
        @retry="fetchInitial"
      />

      <AtomsDsEmptyState
        v-else-if="isEmpty"
        icon="i-lucide-list"
        title="Aucun lead"
        :description="hasActiveFilters ? 'Essayez avec d\'autres filtres.' : 'Aucune praticienne ne s\'est inscrite sur la waitlist.'"
        class="relative z-10"
      />

      <div
        v-else
        class="relative z-10"
      >
        <!-- Desktop table -->
        <div class="hidden md:block">
          <table
            class="w-full text-sm"
            data-testid="admin-waitlist-table"
          >
            <thead class="border-b border-[color:var(--color-brand-subtle)]/50">
              <tr class="text-left text-xs uppercase tracking-[0.12em] text-[color:var(--color-brand-muted)]">
                <th class="px-6 py-3 font-semibold">
                  Nom complet
                </th>
                <th class="px-6 py-3 font-semibold">
                  Email
                </th>
                <th class="px-6 py-3 font-semibold">
                  Spécialité
                </th>
                <th class="px-6 py-3 font-semibold">
                  Qualification
                </th>
                <th class="px-6 py-3 font-semibold">
                  Statut
                </th>
                <th class="px-6 py-3 font-semibold">
                  Reçu le
                </th>
                <th class="px-6 py-3 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <!--
                Toute la ligne ouvre le détail (WA.1, option A retenue) : la
                surface cliquable doit être maximale, et c'est elle qui est
                mémorisée comme déclencheur, donc la ligne à laquelle le focus
                revient à la fermeture (AC-2). Le menu de ligne garde la
                mutation de statut et arrête la propagation pour ne pas
                déclencher le détail en même temps.
              -->
              <tr
                v-for="lead in items"
                :key="lead.id"
                class="cursor-pointer border-b border-[color:var(--color-brand-subtle)]/30 transition-colors last:border-0 hover:bg-[color:var(--color-crepuscule-50)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-brand-primary)]"
                :data-testid="`admin-waitlist-row-${lead.id}`"
                :data-detail-trigger="lead.id"
                tabindex="0"
                :aria-label="`Ouvrir le détail de la demande de ${fullName(lead)}, ${lead.email}`"
                aria-haspopup="dialog"
                :aria-expanded="detailOpen && selectedLead?.id === lead.id"
                @click="openDetail(lead, $event)"
                @keydown.enter.prevent="openDetail(lead, $event)"
                @keydown.space.prevent="openDetail(lead, $event)"
              >
                <td class="px-6 py-3 text-[color:var(--color-brand-primary)]">
                  {{ fullName(lead) }}
                </td>
                <td class="px-6 py-3 text-[color:var(--color-brand-secondary)]">
                  {{ lead.email }}
                </td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--color-brand-primary)]">
                    {{ specialtyLabel(lead.specialty) }}
                  </span>
                </td>
                <td class="px-6 py-3 text-xs text-[color:var(--color-brand-secondary)]">
                  <p>
                    <span class="sr-only">Stade de l'activité&nbsp;:</span>
                    {{ qualificationLabel(ACTIVITY_STAGE_LABELS, lead.activityStage) }}
                  </p>
                  <p>
                    <span class="sr-only">Frein principal&nbsp;:</span>
                    {{ qualificationLabel(MAIN_BLOCKER_LABELS, lead.mainBlocker) }}
                  </p>
                  <p>
                    <span class="sr-only">Source&nbsp;:</span>
                    {{ qualificationLabel(DISCOVERY_SOURCE_LABELS, lead.discoverySource) }}
                  </p>
                </td>
                <td class="px-6 py-3">
                  <span :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(lead.status)}`">
                    {{ statusLabel(lead.status) }}
                  </span>
                </td>
                <td class="px-6 py-3 text-[color:var(--color-brand-secondary)]">
                  {{ formatDateShort(lead.createdAt) }}
                </td>
                <!--
                  Le menu doit arrêter la propagation, sinon cliquer « Actions »
                  ouvre aussi le détail. L'arrêt se pose sur la cellule, pas sur
                  `UDropdownMenu` : `DropdownMenuRoot` de reka-ui ne rend aucun
                  élément racine, donc un `@click.stop` posé sur le composant
                  est silencieusement ignoré — défaut trouvé au gate A-35.
                -->
                <td
                  class="px-6 py-3 text-right"
                  @click.stop
                  @keydown.stop
                >
                  <UDropdownMenu :items="actionsFor(lead)">
                    <UButton
                      icon="i-lucide-more-horizontal"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      :loading="pendingUpdates[lead.id] === true"
                      :aria-label="`Actions pour ${fullName(lead)}`"
                    />
                  </UDropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="block space-y-3 p-4 md:hidden">
          <!--
            Même contrat que la ligne desktop (option A) : la carte entière
            ouvre le détail. `role="button"` est a11y-fragile puisqu'elle
            contient le menu de ligne — c'est pourquoi le parcours clavier est
            une vérification A-35 explicite, pas une capture d'écran.
          -->
          <div
            v-for="lead in items"
            :key="lead.id"
            class="cursor-pointer rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4 transition-colors hover:bg-[color:var(--color-crepuscule-50)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-brand-primary)]"
            :data-testid="`admin-waitlist-card-${lead.id}`"
            :data-detail-trigger="lead.id"
            role="button"
            tabindex="0"
            :aria-label="`Ouvrir le détail de la demande de ${fullName(lead)}, ${lead.email}`"
            aria-haspopup="dialog"
            :aria-expanded="detailOpen && selectedLead?.id === lead.id"
            @click="openDetail(lead, $event)"
            @keydown.enter.prevent="openDetail(lead, $event)"
            @keydown.space.prevent="openDetail(lead, $event)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                  {{ fullName(lead) }}
                </p>
                <p class="text-xs text-[color:var(--color-brand-secondary)]">
                  {{ lead.email }}
                </p>
              </div>
              <span :class="`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(lead.status)}`">
                {{ statusLabel(lead.status) }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-brand-muted)]">
              <span class="rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2 py-0.5 text-[color:var(--color-brand-primary)]">
                {{ specialtyLabel(lead.specialty) }}
              </span>
              <span>{{ formatDateShort(lead.createdAt) }}</span>
            </div>
            <div class="mt-2 space-y-0.5 text-xs text-[color:var(--color-brand-secondary)]">
              <p>
                <span class="text-[color:var(--color-brand-muted)]">Stade&nbsp;:</span>
                {{ qualificationLabel(ACTIVITY_STAGE_LABELS, lead.activityStage) }}
              </p>
              <p>
                <span class="text-[color:var(--color-brand-muted)]">Frein&nbsp;:</span>
                {{ qualificationLabel(MAIN_BLOCKER_LABELS, lead.mainBlocker) }}
              </p>
              <p>
                <span class="text-[color:var(--color-brand-muted)]">Source&nbsp;:</span>
                {{ qualificationLabel(DISCOVERY_SOURCE_LABELS, lead.discoverySource) }}
              </p>
            </div>
            <div
              class="mt-3 flex justify-end"
              @click.stop
              @keydown.stop
            >
              <UDropdownMenu :items="actionsFor(lead)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :aria-label="`Actions pour ${fullName(lead)}`"
                  :loading="pendingUpdates[lead.id] === true"
                >
                  Actions
                </UButton>
              </UDropdownMenu>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="nextCursor"
          class="flex justify-center border-t border-[color:var(--color-brand-subtle)]/50 p-4"
        >
          <UButton
            variant="outline"
            color="neutral"
            class="rounded-full"
            :loading="loadingMore"
            @click="loadMore"
          >
            <UIcon
              name="lucide:chevron-down"
              size="16"
            />
            Charger plus
          </UButton>
        </div>
      </div>
    </section>

    <!--
      Vue de détail (WA.1). Elle lit `selectedLead`, une référence vers l'objet
      déjà présent dans le store : **aucun appel réseau** à l'ouverture
      (NFR-WA1). Le changement de statut reste dans le menu de ligne.
    -->
    <AdminWaitlistLeadDetail
      v-model:open="detailOpen"
      :lead="selectedLead"
      :return-focus-to="detailTriggers"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'

/**
 * Import explicite, pas l'auto-import Nuxt : l'auto-import d'un composant
 * imbriqué est préfixé par le dossier (`Organisms…`), donc un renommage, un
 * déplacement ou un purge de `.nuxt` laisserait les lignes cliquables, sans
 * détail et sans erreur visible. L'import explicite supprime la classe.
 */
import AdminWaitlistLeadDetail from './AdminWaitlistLeadDetail.vue'
import { filterPillClasses } from '~/features/admin/admin-filter-pills'
import { formatDateShort } from '~/composables/useDateFormat'
import {
  computeActionsForStatus,
  fullName,
  statusBadgeClasses
} from '~/features/admin/admin-waitlist-helpers'
import {
  useAdminWaitlist,
  WAITLIST_SPECIALTY_LABELS,
  WAITLIST_STATUS_LABELS
} from '~/features/admin/use-admin-waitlist'
import {
  ACTIVITY_STAGE_LABELS,
  DISCOVERY_SOURCE_LABELS,
  MAIN_BLOCKER_LABELS,
  qualificationLabel
} from '~/features/waitlist/waitlist-labels'
import {
  WAITLIST_SPECIALTY_VALUES,
  type AdminWaitlistLead,
  type WaitlistSpecialty,
  type WaitlistStatus
} from '~/features/admin/api/admin-waitlist.contract'

const toast = useToast()

const STATUS_OPTIONS: Array<{ value: WaitlistStatus, label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'onboarded', label: 'Onboardé' },
  { value: 'declined', label: 'Décliné' }
]

const SPECIALTY_SELECT_ITEMS = [
  { label: 'Toutes', value: 'all' },
  ...WAITLIST_SPECIALTY_VALUES.map(value => ({
    label: WAITLIST_SPECIALTY_LABELS[value] ?? value,
    value
  }))
]

const {
  items,
  loading,
  loadingMore,
  error,
  nextCursor,
  filters,
  isEmpty,
  fetchInitial,
  loadMore,
  applyFilters,
  resetFilters,
  updateStatus
} = useAdminWaitlist()

const initialized = ref(false)
const statusFilter = ref<WaitlistStatus | null>(null)
const specialtyFilter = ref<WaitlistSpecialty | ''>('')
const searchInput = ref('')
const dateFromInput = ref('')
const dateToInput = ref('')

const pendingUpdates = reactive<Record<string, boolean>>({})

const detailOpen = ref(false)
const selectedLead = ref<AdminWaitlistLead | null>(null)
/**
 * Rendu du panneau : sert à retrouver la ligne ET la carte d'une même demande,
 * pour que la restitution du focus ait toujours une cible focusable.
 */
const panelRoot = ref<HTMLElement | null>(null)
/**
 * Déclencheurs mémorisés à l'ouverture, par ordre de préférence — la ligne ou la
 * carte qui a reçu l'événement en premier, puis l'autre rendu de la même
 * demande. `shallowRef` : on stocke des nœuds DOM, aucune réactivité n'est
 * attendue dessus.
 */
const detailTriggers = shallowRef<HTMLElement[]>([])

const hasActiveFilters = computed(() =>
  !!(statusFilter.value || specialtyFilter.value || searchInput.value || dateFromInput.value || dateToInput.value)
)

onMounted(async () => {
  await fetchInitial()
  initialized.value = true
})

function selectStatus(value: WaitlistStatus | null) {
  statusFilter.value = value
  applyFilters({ status: value ?? undefined })
}

function onSpecialtyChange(value: string) {
  // 'all' is the sentinel value of the "Toutes" option — map to undefined.
  const next = value === 'all' || !value ? '' : value
  specialtyFilter.value = next as WaitlistSpecialty | ''
  applyFilters({ specialty: (next || undefined) as WaitlistSpecialty | undefined })
}

function onSearchInput() {
  applyFilters({ search: searchInput.value || undefined })
}

function onDateChange() {
  const dateFrom = dateFromInput.value ? new Date(dateFromInput.value).toISOString() : undefined
  const dateTo = dateToInput.value ? new Date(dateToInput.value).toISOString() : undefined
  applyFilters({ dateFrom, dateTo })
}

function onResetFilters() {
  statusFilter.value = null
  specialtyFilter.value = ''
  searchInput.value = ''
  dateFromInput.value = ''
  dateToInput.value = ''
  resetFilters()
}

function statusLabel(status: WaitlistStatus): string {
  return WAITLIST_STATUS_LABELS[status]
}

function specialtyLabel(specialty: WaitlistSpecialty): string {
  return WAITLIST_SPECIALTY_LABELS[specialty] ?? specialty
}

/**
 * Le clic qui termine une sélection par glissement émet quand même `click` :
 * sans ce garde, l'admin ne peut plus copier un email ou une date hors du
 * tableau, le panneau s'ouvre par-dessus sa sélection.
 *
 * Décision de portée : ce motif n'existe que pour le **glissement**. `Entrée` et
 * `Espace` ne changent pas la sélection — les appliquer là aussi rendait le
 * détail inatteignable au clavier dès qu'une sélection traînait ailleurs dans
 * le document (y compris dans un autre onglet `UTabs` maintenu en vie par
 * `:unmount-on-hide="false"`), sans aucun retour pour l'admin. La fonction est
 * donc pure : elle reçoit la sélection et décide, ce qui la rend testable dans
 * les deux sens sans DOM.
 *
 * Compromis assumé : surligner ailleurs puis cliquer une ligne sans avoir
 * désélectionné n'ouvre pas le détail. C'est le comportement standard des zones
 * activables entières, et le prix de l'option A.
 */
function shouldIgnoreClickForSelection(selection: string): boolean {
  return selection !== ''
}

/**
 * Les deux rendus d'une même demande portent `data-detail-trigger="<id>"` :
 * la ligne du tableau desktop et la carte mobile. On les mémorise **tous les
 * deux**, celui qui a reçu l'événement d'abord : après un redimensionnement
 * franchissant `md`, le rendu déclenché devient `display:none` et `.focus()` y
 * est un no-op silencieux qui envoie le focus sur `body`. Sans l'autre
 * candidat, AC-2 (« pas sur le début du document ») ne tient pas.
 */
function resolveTriggers(leadId: string, fired: HTMLElement | null): HTMLElement[] {
  const matches = panelRoot.value?.querySelectorAll<HTMLElement>(
    `[data-detail-trigger="${leadId}"]`
  )
  const all = matches ? Array.from(matches) : []
  return fired ? [fired, ...all.filter(element => element !== fired)] : all
}

/**
 * Sélection de texte active dans le document, ou chaîne vide côté SSR où
 * `getSelection` n'existe pas.
 */
function currentTextSelection(): string {
  if (import.meta.server) return ''
  return window.getSelection()?.toString() ?? ''
}

/**
 * Ouvre le détail d'une demande. `selectedLead` pointe vers l'objet du store :
 * la vue de détail ne déclenche donc aucun fetch (NFR-WA1).
 *
 * Les déclencheurs sont mémorisés depuis l'événement : ce sont eux que le
 * détail re-focusera à la fermeture (AC-2). `event.currentTarget` est la ligne
 * (desktop) ou la carte (mobile), y compris au clavier.
 *
 * Le garde anti-sélection ne vaut **que pour le clic** : `Entrée` et `Espace`
 * ouvrent toujours le détail, quelle que soit la sélection qui traîne ailleurs.
 */
function openDetail(lead: AdminWaitlistLead, event: Event): void {
  if (event.type === 'click' && shouldIgnoreClickForSelection(currentTextSelection())) return
  detailTriggers.value = resolveTriggers(lead.id, event.currentTarget as HTMLElement | null)
  selectedLead.value = lead
  detailOpen.value = true
}

async function performUpdate(lead: AdminWaitlistLead, next: WaitlistStatus) {
  pendingUpdates[lead.id] = true
  try {
    await updateStatus(lead.id, next)
    toast.add({
      title: 'Statut mis à jour',
      color: 'success'
    })
  } catch (e) {
    // Codex F5 — error toast stays visible until the admin dismisses it.
    // duration: 0 means no auto-close (Nuxt UI v4 convention).
    toast.add({
      title: 'Impossible de mettre à jour le statut',
      description: e instanceof Error ? e.message : undefined,
      color: 'error',
      duration: 0
    })
  } finally {
    pendingUpdates[lead.id] = false
  }
}

interface ActionItem {
  label: string
  icon: string
  onSelect: () => void
}

function actionsFor(lead: AdminWaitlistLead): ActionItem[][] {
  const actions: ActionItem[] = computeActionsForStatus(lead.status).map(a => ({
    label: a.label,
    icon: a.icon,
    onSelect: () => performUpdate(lead, a.nextStatus)
  }))
  return [actions]
}

// Expose filters value reference (unused but keeps filters reactive coverage)
void filters
</script>
