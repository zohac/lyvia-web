<template>
  <div class="space-y-3">
    <UInput
      v-model="query"
      placeholder="Rechercher une cliente…"
      autocomplete="off"
      aria-label="Rechercher une cliente"
      class="w-full"
    />

    <div
      v-if="pending"
      class="space-y-2"
      data-testid="checklist-loading"
    >
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-5/6" />
    </div>

    <AtomsDsErrorState
      v-else-if="error"
      :message="error"
      @retry="load()"
    />

    <template v-else>
      <ul
        v-if="items.length > 0"
        aria-label="Clientes disponibles"
        class="max-h-64 space-y-1 overflow-y-auto"
      >
        <li
          v-for="client in items"
          :key="client.clientProfileId"
        >
          <!--
            diffusion-14 AC1: the design system's checkbox, not a native input.
            `UCheckbox` renders a `<Label :for="id">` around its `#label` slot, so
            the two lines stay the box's accessible name; the row keeps its hover
            background. An in-flight share disables the row: `toggle()` already
            refuses a second call, and a box that still looks clickable tells the
            opposite.
          -->
          <div class="cursor-pointer rounded-md px-2 py-1 hover:bg-[color:var(--color-surface-muted)]">
            <UCheckbox
              :model-value="checked.has(client.clientProfileId)"
              :disabled="toggling.has(client.clientProfileId)"
              :aria-busy="toggling.has(client.clientProfileId) ? 'true' : 'false'"
              @update:model-value="toggle(client)"
            >
              <template #label>
                <span class="min-w-0">
                  <span class="block text-sm text-[color:var(--color-text-primary)]">
                    {{ client.firstname }} {{ client.lastname }}
                  </span>
                  <span class="block truncate text-xs text-[color:var(--color-text-muted)]">
                    {{ client.email }}
                  </span>
                </span>
              </template>
            </UCheckbox>
          </div>
        </li>
      </ul>

      <p
        v-else-if="query.trim().length > 0"
        class="text-sm text-[color:var(--color-text-muted)]"
      >
        Aucune cliente ne correspond à cette recherche.
      </p>
      <p
        v-else
        class="text-sm text-[color:var(--color-text-muted)]"
      >
        Aucune cliente à afficher.
      </p>

      <UButton
        v-if="nextCursor"
        variant="ghost"
        size="sm"
        :loading="loadingMore"
        @click="loadMore()"
      >
        Charger plus
      </UButton>

      <p
        v-if="loadMoreError"
        class="text-sm text-[color:var(--color-error)]"
      >
        {{ loadMoreError }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import {
  listContentShares,
  shareContent,
  unshareContent
} from '../../features/contents/services/content-shares.service'
import {
  createContentClientChecklist,
  type ChecklistClient
} from '../../features/contents/createContentClientChecklist'
// Explicit import, as for the sibling surface: a tag the resolver misses renders
// nothing while lint, typecheck and the build stay green (AGENTS §11.6).
import AtomsDsErrorState from '../atoms/DsErrorState.vue'

const props = defineProps<{
  contentId: string
}>()

const toast = useToast()

const checklist = createContentClientChecklist({
  contentId: props.contentId,
  listClients: params => listProviderClients(params),
  listShares: () => listContentShares(props.contentId),
  share: clientProfileId => shareContent(props.contentId, { clientProfileIds: [clientProfileId] }),
  unshare: clientProfileId => unshareContent(props.contentId, clientProfileId),
  notify: notice => toast.add(notice)
})

const { query, items, pending, loadingMore, error, loadMoreError, nextCursor, checked, toggling } = checklist

function load() {
  return checklist.load()
}

function loadMore() {
  return checklist.loadMore()
}

function toggle(client: ChecklistClient) {
  return checklist.toggle(client)
}

onMounted(() => void checklist.load())
onBeforeUnmount(() => checklist.dispose())
</script>
