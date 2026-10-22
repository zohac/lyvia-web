<template>
  <USlideover
    :open="open"
    :content="{ onOpenAutoFocus, onCloseAutoFocus }"
    :ui="{ content: 'sm:max-w-xl' }"
    side="right"
    @update:open="emit('update:open', $event)"
  >
    <template #title>
      <h2
        ref="titleRef"
        tabindex="-1"
        data-testid="admin-waitlist-detail-title"
        class="focus:outline-none"
      >
        Détail de la demande
      </h2>
    </template>

    <!--
      reka-ui exige une description (`aria-describedby`) sur `DialogContent` ;
      sans ce slot il journalise un avertissement à chaque ouverture. Le titre
      du slot est le nom accessible du panneau.
    -->
    <template #description>
      <span class="text-xs text-[color:var(--color-brand-muted)]">
        Lecture seule — le changement de statut reste dans le menu de ligne.
      </span>
    </template>

    <template #body>
      <div
        v-if="lead"
        class="space-y-6"
        data-testid="admin-waitlist-detail"
      >
        <!--
          Identité — dense et hiérarchisée. Le panneau est plus large qu'avant
          (xl au lieu de md) : une fiche de lecture seule dont tout le contenu
          tient dans les 200 premiers pixels laisse une grande zone vide qui se
          lit comme un panneau inachevé.
        -->
        <div class="space-y-3">
          <div>
            <p
              data-testid="admin-waitlist-detail-name"
              class="text-lg font-semibold leading-tight text-[color:var(--color-brand-primary)]"
            >
              {{ fullName(lead) }}
            </p>
            <p class="mt-1 flex items-baseline gap-1.5 text-sm text-[color:var(--color-brand-secondary)]">
              <UIcon
                name="lucide:mail"
                size="14"
                class="translate-y-0.5 shrink-0 text-[color:var(--color-brand-muted)]"
              />
              <span
                data-testid="admin-waitlist-detail-email"
                class="break-words"
              >{{ lead.email }}</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${statusBadgeClasses(lead.status)}`"
            >
              {{ WAITLIST_STATUS_LABELS[lead.status] }}
            </span>
            <span class="rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--color-brand-primary)]">
              {{ WAITLIST_SPECIALTY_LABELS[lead.specialty] ?? lead.specialty }}
            </span>
          </div>
        </div>

        <!--
          Message — la donnée que l'admin ne pouvait pas lire avant WA.1.
          `whitespace-pre-wrap` respecte les retours à la ligne saisis ;
          `break-words` évite le débordement horizontal sur un mot long
          (URL collée). Aucune troncature, aucune info-bulle : FR-WA7.

          Le fond teinté sépare le verbatim du reste de la fiche : sans lui, le
          message se confondait avec les libellés de qualification.
        -->
        <section class="border-t border-[color:var(--color-border-subtle)] pt-5">
          <h3 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-brand-muted)]">
            Message
          </h3>
          <p
            v-if="lead.message"
            data-testid="admin-waitlist-detail-message"
            class="mt-3 whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-[color:var(--color-crepuscule-50)]/70 p-4 text-sm leading-relaxed text-[color:var(--color-brand-primary)] ring-1 ring-inset ring-[color:var(--color-border-subtle)]"
          >
            {{ lead.message }}
          </p>
          <p
            v-else
            data-testid="admin-waitlist-detail-message-empty"
            class="mt-3 text-sm italic text-[color:var(--color-brand-muted)]"
          >
            Aucun message renseigné.
          </p>
        </section>

        <!--
          Qualification — liste libellée (UX-DR-WA4). Deux colonnes à partir de
          `sm` : les valeurs ne sont plus poussées par un libellé qui se casse
          sur deux lignes (« Stade de l'activité : »), ce qui rendait la
          colonne de droite irrégulière d'une ligne à l'autre.
        -->
        <section class="border-t border-[color:var(--color-border-subtle)] pt-5">
          <h3 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-brand-muted)]">
            Qualification
          </h3>
          <dl
            class="mt-3 space-y-2.5 text-sm"
            data-testid="admin-waitlist-detail-qualification"
          >
            <div class="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-2 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-3">
              <dt class="text-[color:var(--color-brand-muted)]">
                Stade de l'activité
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(ACTIVITY_STAGE_LABELS, lead.activityStage) }}
              </dd>
            </div>
            <div class="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-2 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-3">
              <dt class="text-[color:var(--color-brand-muted)]">
                Frein principal
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(MAIN_BLOCKER_LABELS, lead.mainBlocker) }}
              </dd>
            </div>
            <div class="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-2 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-3">
              <dt class="text-[color:var(--color-brand-muted)]">
                Source
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(DISCOVERY_SOURCE_LABELS, lead.discoverySource) }}
              </dd>
            </div>
          </dl>
        </section>

        <!--
          Horodatages — **ordre décroissant** (WA.2).

          La section s'appelle « Historique » : un ordre figé sous un titre qui
          promet une chronologie ment quand les dates ne suivent pas cet ordre. Un
          lead contacté en septembre puis réinscrit en octobre afficherait la date
          de réinscription avant la date de contact. L'ordre vient donc des dates,
          pas du gabarit — voir le `computed history`.

          ⚠️ Aucun libellé de ligne n'est recopié dans ce commentaire : le harness
          SSR conserve les commentaires de gabarit, donc y écrire les libellés
          ferait passer les assertions négatives qui les cherchent dans le HTML
          entier — elles cesseraient de porter sur le rendu.
        -->
        <section class="border-t border-[color:var(--color-border-subtle)] pt-5">
          <h3 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-brand-muted)]">
            Historique
          </h3>
          <dl
            class="mt-2 divide-y divide-[color:var(--color-border-subtle)] text-sm"
            data-testid="admin-waitlist-detail-timestamps"
          >
            <div
              v-for="entry in history"
              :key="entry.key"
              class="flex items-baseline justify-between gap-4 py-2.5"
            >
              <dt class="text-[color:var(--color-brand-muted)]">
                {{ entry.label }}
              </dt>
              <dd
                :data-testid="entry.testId"
                class="text-right tabular-nums text-[color:var(--color-brand-primary)]"
              >
                {{ entry.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!--
          Pas d'action ici : le changement de statut reste dans le menu de ligne
          (UX-DR-WA5). Deux surfaces de mutation divergeraient.
        -->
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  fullName,
  focusSlideoverTitle,
  restoreFocusToTrigger,
  statusBadgeClasses
} from '~/features/admin/admin-waitlist-helpers'
import {
  WAITLIST_SPECIALTY_LABELS,
  WAITLIST_STATUS_LABELS
} from '~/features/admin/use-admin-waitlist'
import {
  ACTIVITY_STAGE_LABELS,
  DISCOVERY_SOURCE_LABELS,
  MAIN_BLOCKER_LABELS,
  qualificationLabel
} from '~/features/waitlist/waitlist-labels'
import { formatDateTime } from '~/composables/useDateFormat'
import type { AdminWaitlistLead } from '~/features/admin/api/admin-waitlist.contract'

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const props = defineProps<{
  open: boolean
  lead: AdminWaitlistLead | null
  /**
   * Éléments à re-focuser à la fermeture, par ordre de préférence : la ligne et
   * la carte qui ont ouvert le détail. Mémorisés par le panneau, qui en a deux
   * parce qu'une même demande est rendue deux fois (desktop / mobile) — voir
   * `restoreFocusToTrigger`.
   */
  returnFocusTo?: ReadonlyArray<HTMLElement> | null
}>()

const titleRef = ref<HTMLElement | null>(null)

/**
 * `USlideover` transmet `content` à `DialogContent` via `v-bind`, donc
 * `onOpenAutoFocus` et `onCloseAutoFocus` sont surchargeables.
 *
 * - Ouverture : sans cette surcharge, reka-ui autofocus le premier élément
 *   focusable, c'est-à-dire le bouton fermer. UX-DR-WA2 veut le titre.
 * - Fermeture : `onCloseAutoFocus` est surchargé *malgré* la note de spec
 *   qui Conseillait de ne pas le faire. Constaté au gate A-35 : le défaut de
 *   reka mémorise `document.activeElement`, qui n'est pas la ligne cliquée
 *   (celle-ci n'est pas focusable par le clic dans tous les navigateurs), donc
 *   le focus revenait sur `body`. Voir `restoreFocusToTrigger`.
 */
function onOpenAutoFocus(event: Event): void {
  focusSlideoverTitle(event, titleRef.value)
}

function onCloseAutoFocus(event: Event): void {
  restoreFocusToTrigger(event, props.returnFocusTo ?? [])
}

/**
 * Une ligne de « Historique », prête à rendre. `value` est calculé au dernier
 * moment : une date illisible doit faire disparaître la ligne, pas s'imprimer.
 */
interface HistoryEntry {
  key: string
  label: string
  value: string
  testId: string
}

/** Idem, avant calcul de `value` : la date brute est encore à valider. */
interface PendingHistoryEntry {
  key: string
  label: string
  testId: string
  at: string
}

/**
 * WA.2 — la demande a-t-elle été réinscrite ?
 *
 * `updatedAt > createdAt` est le signal. Il est vrai seulement parce que :
 *
 * - la réinscription rafraîchit `updated_at` (c'est le seul écrivain de la
 *   colonne côté personne) ;
 * - le changement de statut **admin** ne la touche plus (décision 3a) ;
 * - la migration `1791247800000-normalize-waitlist-updated-at` a aplati
 *   `updated_at` à `created_at` sur la population antérieure, qui portait sinon
 *   `updated_at > created_at` sans qu'aucune réinscription ait eu lieu (date de
 *   CONTACT lue comme une date de réinscription — une affirmation fausse).
 *
 * Une horloge incohérente (`Number.isFinite` faux) masque l'indicateur plutôt que
 * d'afficher une date invalide : l'indicateur manquant est une information en
 * moins, une date fausse en est une de trop.
 */
const wasResubmitted = computed<boolean>(() => {
  if (!props.lead) return false
  const created = Date.parse(props.lead.createdAt)
  const updated = Date.parse(props.lead.updatedAt)
  if (!Number.isFinite(created) || !Number.isFinite(updated)) return false
  return updated > created
})

/**
 * Les quatre dates de « Historique », de la plus récente à la plus ancienne.
 *
 * Tri décroissant sur la valeur ISO : `createdAt` est le plancher de l'ordre,
 * donc aucune entrée ne disparaît et l'égalité (dates confondues à la
 * milliseconde) reste stable.
 */
const byRecency = (a: { atMs: number }, b: { atMs: number }): number => b.atMs - a.atMs

const history = computed<HistoryEntry[]>(() => {
  const lead = props.lead
  if (!lead) return []

  // « Reçue le » est la seule ligne toujours présente : elle est construite à
  // part pour ne jamais disparaître, même si son horodatage est illisible.
  const created: PendingHistoryEntry = {
    key: 'created',
    label: 'Reçue le',
    testId: 'admin-waitlist-detail-created-cell',
    at: lead.createdAt
  }

  const optional: PendingHistoryEntry[] = []
  if (wasResubmitted.value) {
    optional.push({
      key: 'resubmitted',
      label: 'Réinscrite le',
      testId: 'admin-waitlist-detail-resubmitted-cell',
      at: lead.updatedAt
    })
  }
  if (lead.contactedAt) {
    optional.push({
      key: 'contacted',
      label: 'Contactée le',
      testId: 'admin-waitlist-detail-contacted-cell',
      at: lead.contactedAt
    })
  }
  if (lead.onboardedAt) {
    optional.push({
      key: 'onboarded',
      label: 'Onboardée le',
      testId: 'admin-waitlist-detail-onboarded-cell',
      at: lead.onboardedAt
    })
  }

  const toEntry = (entry: PendingHistoryEntry): HistoryEntry => ({
    key: entry.key,
    label: entry.label,
    value: formatDateTime(entry.at),
    testId: entry.testId
  })

  // Même politique que `wasResubmitted` : une horloge illisible fait disparaître
  // la ligne optionnelle plutôt que d'afficher « Invalid Date ». Un indicateur
  // absent est une information en moins ; une date fausse en est une de trop.
  const datedOptional = optional
    .map(entry => ({ ...entry, atMs: Date.parse(entry.at) }))
    .filter((entry): entry is PendingHistoryEntry & { atMs: number } =>
      Number.isFinite(entry.atMs)
    )

  const createdMs = Date.parse(created.at)
  if (!Number.isFinite(createdMs)) {
    // `createdAt` illisible : la ligne d'accueil reste, en dernier, avec un
    // tiret — vider tout « Historique » cacherait même la date de réception.
    return [...datedOptional.sort(byRecency).map(toEntry), { ...created, value: '—' }]
  }

  return [{ ...created, atMs: createdMs }, ...datedOptional]
    .sort(byRecency)
    .map(toEntry)
})
</script>
