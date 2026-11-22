<template>
  <UCard
    v-if="visibility === 'private'"
    class="bg-[color:var(--color-surface-card)]"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-[color:var(--color-text-primary)]">
          Partage
        </h3>
      </div>
    </template>

    <div v-if="cs.pending.value" class="space-y-2">
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
              Partagé le {{ formatDate(item.sharedAt) }}
            </p>
          </div>
          <UButton
            variant="ghost"
            color="error"
            size="sm"
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
        Aucun client n'a accès à ce contenu.
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
    </template>

    <UModal
      v-model:open="cs.selectorOpen.value"
    >
      <template #header>
        <h4 class="text-base font-semibold text-[color:var(--color-text-primary)]">
          Ajouter des clientes
        </h4>
      </template>
      <template #body>
        <div class="space-y-3">
          <UInput
            :model-value="cs.selectorQuery.value"
            placeholder="Rechercher une cliente…"
            @input="onSearchInput"
          />

          <div v-if="cs.rosterPending.value" class="space-y-2">
            <USkeleton class="h-6 w-full" />
            <USkeleton class="h-6 w-5/6" />
          </div>

          <AtomsDsErrorState
            v-else-if="cs.rosterError.value"
            :message="cs.rosterError.value"
            @retry="cs.loadRoster(cs.selectorQuery.value)"
          />

          <ul v-else class="max-h-64 space-y-1 overflow-y-auto">
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
                <span class="text-sm text-[color:var(--color-text-primary)]">
                  {{ client.firstname }} {{ client.lastname }}
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
import { onMounted } from 'vue'
import type { ContentVisibility } from '../../features/contents/api/contents.contract'
import {
  listContentShares,
  shareContent,
  unshareContent
} from '../../features/contents/services/content-shares.service'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import { createContentShares } from '../../features/contents/createContentShares'
import { shareResultMessage } from '../../features/contents/domain/content-shares'
import { mapProviderContentMutationErrorToMessage } from '../../features/contents/api/contents-error'
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

onMounted(() => {
  if (props.visibility === 'private') {
    void cs.loadShares()
  }
})

function onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  cs.scheduleRosterSearch(value)
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

async function handleRemove(clientProfileId: string) {
  try {
    await cs.remove(clientProfileId)
    toast.add({ title: 'Partage retiré', color: 'success' })
  } catch (err) {
    toast.add({
      title: mapProviderContentMutationErrorToMessage(err, 'Impossible de retirer le partage.'),
      color: 'error'
    })
  }
}

async function handleShareSelected() {
  try {
    const count = await cs.shareSelected()
    toast.add({
      title: shareResultMessage(count, false),
      color: count > 0 ? 'success' : 'neutral'
    })
  } catch (err) {
    toast.add({
      title: mapProviderContentMutationErrorToMessage(err, 'Impossible de partager.'),
      color: 'error'
    })
  }
}

async function handleShareAll() {
  try {
    const count = await cs.shareAll()
    toast.add({
      title: shareResultMessage(count, true),
      color: count > 0 ? 'success' : 'neutral'
    })
  } catch (err) {
    toast.add({
      title: mapProviderContentMutationErrorToMessage(err, 'Impossible de partager avec toutes.'),
      color: 'error'
    })
  }
}
</script>
