<template>
  <USlideover
    :open="open"
    :content="{ onOpenAutoFocus, onCloseAutoFocus }"
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
        class="space-y-6 p-4"
        data-testid="admin-waitlist-detail"
      >
        <!-- Identité : ce que l'admin peut lire sans ouvrir le détail -->
        <div class="space-y-1">
          <p
            data-testid="admin-waitlist-detail-name"
            class="text-base font-semibold text-[color:var(--color-brand-primary)]"
          >
            {{ fullName(lead) }}
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            <span class="text-[color:var(--color-brand-muted)]">Email&nbsp;:</span>
            <span data-testid="admin-waitlist-detail-email">{{ lead.email }}</span>
          </p>
          <p class="flex flex-wrap items-center gap-2 text-sm">
            <span
              :class="`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(lead.status)}`"
            >
              {{ WAITLIST_STATUS_LABELS[lead.status] }}
            </span>
            <span class="rounded-full bg-[color:var(--ui-color-primary-100)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--color-brand-primary)]">
              {{ WAITLIST_SPECIALTY_LABELS[lead.specialty] ?? lead.specialty }}
            </span>
          </p>
        </div>

        <!--
          Message — la donnée que l'admin ne pouvait pas lire avant WA.1.
          `whitespace-pre-wrap` respecte les retours à la ligne saisis ;
          `break-words` évite le débordement horizontal sur un mot long
          (URL collée). Aucune troncature, aucune info-bulle : FR-WA7.
        -->
        <section>
          <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
            Message
          </h3>
          <p
            v-if="lead.message"
            data-testid="admin-waitlist-detail-message"
            class="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--color-brand-primary)]"
          >
            {{ lead.message }}
          </p>
          <p
            v-else
            data-testid="admin-waitlist-detail-message-empty"
            class="mt-2 text-sm italic text-[color:var(--color-brand-muted)]"
          >
            Aucun message renseigné.
          </p>
        </section>

        <!-- Qualification : liste libellée (UX-DR-WA4) -->
        <section>
          <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
            Qualification
          </h3>
          <dl
            class="mt-2 space-y-1 text-sm"
            data-testid="admin-waitlist-detail-qualification"
          >
            <div class="flex gap-2">
              <dt class="text-[color:var(--color-brand-muted)]">
                Stade de l'activité&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(ACTIVITY_STAGE_LABELS, lead.activityStage) }}
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-[color:var(--color-brand-muted)]">
                Frein principal&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(MAIN_BLOCKER_LABELS, lead.mainBlocker) }}
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-[color:var(--color-brand-muted)]">
                Source&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ qualificationLabel(DISCOVERY_SOURCE_LABELS, lead.discoverySource) }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Horodatages -->
        <section>
          <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
            Historique
          </h3>
          <dl
            class="mt-2 space-y-1 text-sm"
            data-testid="admin-waitlist-detail-timestamps"
          >
            <div class="flex gap-2">
              <dt class="text-[color:var(--color-brand-muted)]">
                Reçue le&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ formatDateTime(lead.createdAt) }}
              </dd>
            </div>
            <div
              v-if="lead.contactedAt"
              class="flex gap-2"
            >
              <dt class="text-[color:var(--color-brand-muted)]">
                Contactée le&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ formatDateTime(lead.contactedAt) }}
              </dd>
            </div>
            <div
              v-if="lead.onboardedAt"
              class="flex gap-2"
            >
              <dt class="text-[color:var(--color-brand-muted)]">
                Onboardée le&nbsp;:
              </dt>
              <dd class="text-[color:var(--color-brand-primary)]">
                {{ formatDateTime(lead.onboardedAt) }}
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
import { ref } from 'vue'

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
 * - Ouverture : sans cette surcharge, reka-ui autofocuse le premier élément
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
</script>
