<template>
  <div ref="panelRoot">
    <!--
      Filtres et liste vivent dans **une seule surface** : les filtres décrivent
      la liste, ils n'ont pas à flotter au-dessus comme un formulaire autonome.
      Le bandeau de filtres garde ses états de chargement / erreur / vide : ils
      se rendent sous lui, jamais à sa place.
    -->
    <section
      class="relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] shadow-soft"
      data-testid="admin-waitlist-panel"
    >
      <!-- Bandeau de filtres -->
      <div class="border-b border-[color:var(--color-border-subtle)] px-4 py-4 sm:px-5">
        <!-- Ligne 1 — statut : des pastilles, pas des contrôles de formulaire -->
        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filtrer par statut"
        >
          <span class="mr-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-brand-muted)]">
            Statut
          </span>
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.label"
            type="button"
            :class="filterPillClasses(statusFilter === opt.value, 'sm')"
            :aria-pressed="statusFilter === opt.value"
            @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!--
          Ligne 2 — recherche, spécialité et période. Tous les contrôles font
          44 px (taille `md` du design system) : une même rangée ne mélange plus
          une pastille de 30 px et un select de 44 px, qui se lisaient comme un
          défaut d'alignement.
        -->
        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-3">
          <div class="relative min-w-56 flex-1 sm:max-w-sm">
            <UIcon
              name="lucide:search"
              size="18"
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
            />
            <input
              v-model="searchInput"
              type="text"
              placeholder="Rechercher nom ou email…"
              autocomplete="off"
              aria-label="Rechercher un nom ou un email"
              class="h-11 w-full rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] pl-11 pr-4 text-sm text-[color:var(--color-brand-primary)] placeholder-[color:var(--color-brand-muted)] transition-colors focus:border-[color:var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[color:var(--color-field-ring)]/60"
              @input="onSearchInput"
            >
          </div>

          <div class="flex items-center gap-2">
            <!--
              `label[for]` ne nomme pas un `<button>` : le select est nommé par
              `aria-labelledby`, qui pointe sur le libellé visible.
            -->
            <span
              id="specialtyFilterLabel"
              class="whitespace-nowrap text-sm text-[color:var(--color-brand-muted)]"
            >Spécialité</span>
            <div class="w-52">
              <USelect
                id="specialtyFilter"
                :model-value="specialtyFilter || 'all'"
                :items="SPECIALTY_SELECT_ITEMS"
                aria-labelledby="specialtyFilterLabel"
                size="sm"
                @update:model-value="onSpecialtyChange"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label
              for="waitlistDateFrom"
              class="whitespace-nowrap text-sm text-[color:var(--color-brand-muted)]"
            >Du</label>
            <input
              id="waitlistDateFrom"
              v-model="dateFromInput"
              type="date"
              autocomplete="off"
              :class="DATE_INPUT_CLASSES"
              @change="onDateChange"
            >
          </div>

          <div class="flex items-center gap-2">
            <label
              for="waitlistDateTo"
              class="whitespace-nowrap text-sm text-[color:var(--color-brand-muted)]"
            >au</label>
            <input
              id="waitlistDateTo"
              v-model="dateToInput"
              type="date"
              autocomplete="off"
              :class="DATE_INPUT_CLASSES"
              @change="onDateChange"
            >
          </div>

          <UButton
            v-if="hasActiveFilters"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-rotate-ccw"
            class="ml-auto shrink-0 rounded-full text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)]"
            @click="onResetFilters"
          >
            Tout effacer
          </UButton>
        </div>
      </div>

      <div
        v-if="loading && !initialized"
        class="space-y-3 p-6"
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
        @retry="fetchInitial"
      />

      <AtomsDsEmptyState
        v-else-if="isEmpty"
        icon="i-lucide-list"
        title="Aucun lead"
        :description="hasActiveFilters ? 'Essayez avec d\'autres filtres.' : 'Aucune praticienne ne s\'est inscrite sur la waitlist.'"
      />

      <div v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto md:block">
          <table
            class="w-full text-sm"
            data-testid="admin-waitlist-table"
          >
            <thead class="border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50">
              <tr class="text-left text-[11px] uppercase tracking-[0.09em] text-[color:var(--color-brand-muted)]">
                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                  Nom complet
                </th>
                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                  Email
                </th>
                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                  Spécialité
                </th>
                <th class="px-4 py-3 font-semibold">
                  Qualification
                </th>
                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                  Statut
                </th>
                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                  Reçu le
                </th>
                <th class="whitespace-nowrap px-4 py-3 text-right font-semibold">
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
                v-for="row in rows"
                :key="row.lead.id"
                class="cursor-pointer border-b border-[color:var(--color-border-subtle)]/70 transition-colors last:border-0 hover:bg-[color:var(--color-crepuscule-50)]/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--color-brand-primary)]"
                :data-testid="`admin-waitlist-row-${row.lead.id}`"
                :data-detail-trigger="row.lead.id"
                tabindex="0"
                :aria-label="`Ouvrir le détail de la demande de ${row.name}, ${row.lead.email}`"
                aria-haspopup="dialog"
                :aria-expanded="detailOpen && selectedLead?.id === row.lead.id"
                @click="openDetail(row.lead, $event)"
                @keydown.enter.prevent="openDetail(row.lead, $event)"
                @keydown.space.prevent="openDetail(row.lead, $event)"
              >
                <td class="whitespace-nowrap px-4 py-4 font-medium text-[color:var(--color-brand-primary)]">
                  {{ row.name }}
                </td>
                <td class="px-4 py-4 text-[color:var(--color-brand-secondary)]">
                  <span
                    class="block max-w-[10.5rem] truncate"
                    :title="row.lead.email"
                  >{{ row.lead.email }}</span>
                </td>
                <td class="whitespace-nowrap px-4 py-4">
                  <span class="inline-flex items-center rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--color-brand-primary)]">
                    {{ row.specialtyLabel }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <!--
                    Une demande non qualifiée n'affiche **qu'un** tiret : trois
                    lignes de tirets empilés se lisaient comme un défaut de
                    rendu. Le détail, lui, liste les trois libellés — c'est là
                    que l'absence de chaque champ est une information.
                  -->
                  <div
                    v-if="row.qualification.empty"
                    class="text-[color:var(--color-brand-muted)]"
                    :data-qualification-block="row.lead.id"
                  >
                    —
                  </div>
                  <div
                    v-else
                    class="max-w-[22rem]"
                    :data-qualification-block="row.lead.id"
                  >
                    <p class="text-[13px] leading-snug text-[color:var(--color-brand-primary)]">
                      <span class="sr-only">Stade de l'activité&nbsp;:</span>
                      {{ row.qualification.stage }}
                    </p>
                    <p class="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-xs leading-snug text-[color:var(--color-brand-muted)]">
                      <span class="sr-only">Frein principal&nbsp;:</span>
                      <span>{{ row.qualification.blocker }}</span>
                      <span
                        aria-hidden="true"
                        class="text-[color:var(--color-brand-muted)]"
                      >·</span>
                      <span class="sr-only">Source&nbsp;:</span>
                      <span>{{ row.qualification.source }}</span>
                    </p>
                  </div>
                </td>
                <td class="whitespace-nowrap px-4 py-4">
                  <span :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${row.statusClasses}`">
                    {{ row.statusLabel }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-4 tabular-nums text-[color:var(--color-brand-secondary)]">
                  {{ row.createdLabel }}
                </td>
                <!--
                  Le menu doit arrêter la propagation, sinon cliquer « Actions »
                  ouvre aussi le détail. L'arrêt se pose sur la cellule, pas sur
                  `UDropdownMenu` : `DropdownMenuRoot` de reka-ui ne rend aucun
                  élément racine, donc un `@click.stop` posé sur le composant
                  est silencieusement ignoré — défaut trouvé au gate A-35.
                -->
                <td
                  class="px-4 py-3 text-right"
                  data-testid="admin-waitlist-row-actions"
                  @click.stop
                  @keydown.stop
                >
                  <UDropdownMenu :items="actionsFor(row.lead)">
                    <UButton
                      icon="i-lucide-more-horizontal"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      class="h-10 w-10 justify-center rounded-full text-[color:var(--color-brand-muted)] hover:bg-[color:var(--color-crepuscule-100)]/70 hover:text-[color:var(--color-brand-primary)]"
                      :loading="pendingUpdates[row.lead.id] === true"
                      :aria-label="`Actions pour ${row.name}`"
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
            v-for="row in rows"
            :key="row.lead.id"
            class="cursor-pointer rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-4 transition-colors hover:bg-[color:var(--color-crepuscule-50)]/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--color-brand-primary)]"
            :data-testid="`admin-waitlist-card-${row.lead.id}`"
            :data-detail-trigger="row.lead.id"
            role="button"
            tabindex="0"
            :aria-label="`Ouvrir le détail de la demande de ${row.name}, ${row.lead.email}`"
            aria-haspopup="dialog"
            :aria-expanded="detailOpen && selectedLead?.id === row.lead.id"
            @click="openDetail(row.lead, $event)"
            @keydown.enter.prevent="openDetail(row.lead, $event)"
            @keydown.space.prevent="openDetail(row.lead, $event)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[color:var(--color-brand-primary)]">
                  {{ row.name }}
                </p>
                <p class="truncate text-xs text-[color:var(--color-brand-secondary)]">
                  {{ row.lead.email }}
                </p>
              </div>
              <span :class="`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${row.statusClasses}`">
                {{ row.statusLabel }}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-brand-muted)]">
              <span class="rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2 py-0.5 text-[color:var(--color-brand-primary)]">
                {{ row.specialtyLabel }}
              </span>
              <span class="tabular-nums">{{ row.createdLabel }}</span>
            </div>

            <div
              v-if="row.qualification.empty"
              class="mt-2 text-xs text-[color:var(--color-brand-muted)]"
              :data-qualification-block="row.lead.id"
            >
              —
            </div>
            <div
              v-else
              class="mt-2 text-xs"
              :data-qualification-block="row.lead.id"
            >
              <p class="leading-snug text-[color:var(--color-brand-secondary)]">
                <span class="text-[color:var(--color-brand-muted)]">Stade&nbsp;:</span>
                {{ row.qualification.stage }}
              </p>
              <p class="mt-0.5 leading-snug text-[color:var(--color-brand-secondary)]">
                <span class="text-[color:var(--color-brand-muted)]">Frein&nbsp;:</span>
                {{ row.qualification.blocker }}
              </p>
              <p class="mt-0.5 leading-snug text-[color:var(--color-brand-secondary)]">
                <span class="text-[color:var(--color-brand-muted)]">Source&nbsp;:</span>
                {{ row.qualification.source }}
              </p>
            </div>

            <div
              class="mt-3 flex justify-end"
              data-testid="admin-waitlist-card-actions"
              @click.stop
              @keydown.stop
            >
              <UDropdownMenu :items="actionsFor(row.lead)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :aria-label="`Actions pour ${row.name}`"
                  :loading="pendingUpdates[row.lead.id] === true"
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
          class="flex justify-center border-t border-[color:var(--color-border-subtle)] p-4"
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
  buildWaitlistDateRange,
  computeActionsForStatus,
  fullName,
  qualificationSummary,
  resolveTriggers,
  shouldIgnoreClickForSelection,
  statusBadgeClasses
} from '~/features/admin/admin-waitlist-helpers'
import {
  useAdminWaitlist,
  WAITLIST_SPECIALTY_LABELS,
  WAITLIST_STATUS_LABELS
} from '~/features/admin/use-admin-waitlist'
import {
  WAITLIST_SPECIALTY_VALUES,
  type AdminWaitlistLead,
  type WaitlistSpecialty,
  type WaitlistStatus
} from '~/features/admin/api/admin-waitlist.contract'

const toast = useToast()

/**
 * « Toutes » est une pastille comme les autres : sans elle, l'état « aucun
 * filtre » n'était représenté que par l'absence de surbrillance, et le seul
 * retour possible était « Tout effacer », qui efface aussi la recherche et les
 * dates alors qu'on voulait seulement relâcher le statut.
 */
const STATUS_OPTIONS: Array<{ value: WaitlistStatus | null, label: string }> = [
  { value: null, label: 'Toutes' },
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

/**
 * Styles des deux bornes de date.
 *
 * Partagés pour que les deux champs ne puissent pas diverger ; `h-11` et
 * `rounded-full` les alignent sur le select et la recherche (44 px, forme
 * pilule du design system). L'icône native du sélecteur de date est atténuée
 * puis renforcée au survol, seule indication qu'elle est cliquable.
 */
const DATE_INPUT_CLASSES = [
  'h-11 w-[10.5rem] rounded-full border border-[color:var(--color-border-subtle)]',
  'bg-[color:var(--color-surface-elevated)] px-4 text-sm text-[color:var(--color-brand-primary)]',
  'transition-colors [color-scheme:light]',
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
  '[&::-webkit-calendar-picker-indicator]:opacity-50',
  '[&:hover::-webkit-calendar-picker-indicator]:opacity-80',
  'focus:border-[color:var(--color-brand-primary)] focus:outline-none',
  'focus:ring-4 focus:ring-[color:var(--color-field-ring)]/60'
].join(' ')

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

/**
 * Une ligne de liste, prête à rendre. Le calcul est fait une fois par demande
 * plutôt que dans le gabarit : les trois libellés de qualification, le badge de
 * statut et la date formatée étaient autrement recalculés à chaque re-rendu, et
 * la carte mobile dupliquait la même dérivation.
 */
const rows = computed(() => items.value.map(lead => ({
  lead,
  name: fullName(lead),
  specialtyLabel: WAITLIST_SPECIALTY_LABELS[lead.specialty] ?? lead.specialty,
  statusLabel: WAITLIST_STATUS_LABELS[lead.status],
  statusClasses: statusBadgeClasses(lead.status),
  qualification: qualificationSummary(lead),
  createdLabel: formatDateShort(lead.createdAt)
})))

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
  applyFilters(buildWaitlistDateRange(dateFromInput.value, dateToInput.value))
}

function onResetFilters() {
  statusFilter.value = null
  specialtyFilter.value = ''
  searchInput.value = ''
  dateFromInput.value = ''
  dateToInput.value = ''
  resetFilters()
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
  detailTriggers.value = resolveTriggers(
    panelRoot.value,
    lead.id,
    event.currentTarget as HTMLElement | null
  )
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
