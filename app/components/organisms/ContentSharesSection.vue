<template>
  <UCard
    v-if="visibility === 'private'"
    class="bg-[color:var(--color-surface-card)]"
  >
    <template #header>
      <h3 class="text-base font-semibold text-[color:var(--color-text-primary)]">
        Partage
      </h3>
    </template>

    <div
      v-if="cs.pending.value"
      class="space-y-2"
    >
      <USkeleton class="h-6 w-1/2" />
      <USkeleton class="h-6 w-2/3" />
    </div>

    <AtomsDsErrorState
      v-else-if="cs.error.value"
      :message="cs.error.value"
      @retry="cs.loadShares()"
    />

    <template v-else>
      <ul
        v-if="cs.shared.value.length > 0"
        class="space-y-2"
      >
        <li
          v-for="item in cs.shared.value"
          :key="item.clientProfileId"
          class="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--color-brand-subtle)] px-3 py-2"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
              {{ item.firstname }} {{ item.lastname }}
            </p>
            <p class="text-xs text-[color:var(--color-text-muted)]">
              Partagé le {{ formatSharedAt(item.sharedAt) }}
            </p>
          </div>
          <UButton
            variant="ghost"
            color="error"
            size="sm"
            :aria-label="`Retirer le partage avec ${item.firstname} ${item.lastname}`"
            :loading="cs.removing.value.has(item.clientProfileId)"
            :disabled="cs.removing.value.has(item.clientProfileId)"
            @click="handleRemove(item.clientProfileId)"
          >
            Retirer
          </UButton>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-[color:var(--color-text-muted)]"
      >
        Aucun partage pour l'instant. Utilisez « Ajouter un client » pour donner accès à ce contenu.
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <UButton
          color="primary"
          variant="soft"
          @click="cs.openSelector()"
        >
          Ajouter un client
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :loading="cs.sharingAll.value"
          :disabled="cs.sharingAll.value"
          @click="handleShareAll"
        >
          Partager avec tous
        </UButton>
      </div>

      <!--
        `all: true` is narrower than the picker: the API covers only clients
        with at least one non-cancelled appointment (story 5.3). The sentence
        states that scope so the button never promises « toutes vos clientes ».
      -->
      <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
        « Partager avec tous » couvre les clientes ayant déjà eu un rendez-vous avec vous.
      </p>
    </template>

    <UModal
      v-model:open="cs.selectorOpen.value"
      title="Ajouter des clientes"
      description="Choisissez une ou plusieurs clientes à qui donner accès à ce contenu."
    >
      <template #body>
        <div class="space-y-3">
          <UInput
            v-model="searchQuery"
            placeholder="Rechercher une cliente…"
            autocomplete="off"
            aria-label="Rechercher une cliente"
          />

          <div
            v-if="cs.rosterPending.value"
            class="space-y-2"
          >
            <USkeleton class="h-6 w-full" />
            <USkeleton class="h-6 w-5/6" />
          </div>

          <AtomsDsErrorState
            v-else-if="cs.rosterError.value"
            :message="cs.rosterError.value"
            @retry="cs.loadRoster(cs.selectorQuery.value)"
          />

          <ul
            v-else
            aria-label="Clientes disponibles"
            class="max-h-64 space-y-1 overflow-y-auto"
          >
            <li
              v-for="client in cs.selectableClients.value"
              :key="client.clientProfileId"
            >
              <label class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-[color:var(--color-surface-muted)]">
                <input
                  type="checkbox"
                  :checked="cs.selected.value.has(client.clientProfileId)"
                  @change="cs.toggleSelected(client.clientProfileId)"
                >
                <span class="min-w-0">
                  <span class="block text-sm text-[color:var(--color-text-primary)]">
                    {{ client.firstname }} {{ client.lastname }}
                  </span>
                  <span class="block truncate text-xs text-[color:var(--color-text-muted)]">
                    {{ client.email }}
                  </span>
                </span>
              </label>
            </li>
            <li
              v-if="cs.selectableClients.value.length === 0"
              class="text-sm text-[color:var(--color-text-muted)]"
            >
              Aucune cliente disponible.
            </li>
          </ul>

          <UButton
            v-if="cs.rosterNextCursor.value"
            variant="ghost"
            size="sm"
            :loading="cs.rosterPending.value"
            @click="cs.loadMoreRoster()"
          >
            Charger plus
          </UButton>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="cs.closeSelector()"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="cs.adding.value"
            :disabled="cs.selected.value.size === 0 || cs.adding.value"
            @click="handleShareSelected"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import type { ContentVisibility } from '../../features/contents/api/contents.contract'
import {
  listContentShares,
  shareContent,
  unshareContent
} from '../../features/contents/services/content-shares.service'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import { createContentShares } from '../../features/contents/createContentShares'
import { shareResultMessage } from '../../features/contents/domain/content-shares'
import { mapContentShareErrorToMessage } from '../../features/contents/api/content-shares-error'
import { formatDateShort } from '../../composables/useDateFormat'
import AtomsDsErrorState from '../atoms/DsErrorState.vue'

const props = defineProps<{
  contentId: string
  visibility: ContentVisibility
}>()

const toast = useToast()

const cs = createContentShares(
  {
    listShares: listContentShares,
    share: shareContent,
    unshare: unshareContent,
    listClients: listProviderClients
  },
  props.contentId
)

/**
 * The section lives for the whole edit page, so the decision to load is not a
 * mount-time one: `public` content mounts with no fetch, and a save that turns
 * it private must load the list instead of showing it empty. `immediate` covers
 * the initial mount; the composable ignores a repeated `private` so no second
 * request is issued.
 */
watch(
  () => props.visibility,
  visibility => void cs.applyVisibility(visibility),
  { immediate: true }
)

onUnmounted(() => cs.dispose())

/**
 * The selector search writes through this setter, so the debounced request owns
 * the query while the field still displays what was typed. The declared
 * `update:modelValue` emit is also what the render test can execute: a
 * `:model-value` + `@input` pair is merged from `$attrs` and read
 * `event.target`, which no test can drive.
 */
const searchQuery = computed({
  get: () => cs.selectorQuery.value,
  set: (value: string) => cs.scheduleRosterSearch(value)
})

function formatSharedAt(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : formatDateShort(iso)
}

async function handleRemove(clientProfileId: string) {
  if (cs.removing.value.has(clientProfileId)) return
  try {
    await cs.remove(clientProfileId)
    toast.add({ title: 'Partage retiré', color: 'success' })
  } catch (err) {
    toast.add({
      title: mapContentShareErrorToMessage(err, 'Impossible de retirer le partage.'),
      color: 'error'
    })
  }
}

async function handleShareSelected() {
  if (cs.adding.value) return
  try {
    const count = await cs.shareSelected()
    toast.add({
      title: shareResultMessage(count),
      color: count > 0 ? 'success' : 'neutral'
    })
  } catch (err) {
    toast.add({
      title: mapContentShareErrorToMessage(err, 'Impossible de partager.'),
      color: 'error'
    })
  }
}

async function handleShareAll() {
  if (cs.sharingAll.value) return
  try {
    const count = await cs.shareAll()
    toast.add({
      title: shareResultMessage(count),
      color: count > 0 ? 'success' : 'neutral'
    })
  } catch (err) {
    toast.add({
      title: mapContentShareErrorToMessage(err, 'Impossible de partager avec tous.'),
      color: 'error'
    })
  }
}
</script>
