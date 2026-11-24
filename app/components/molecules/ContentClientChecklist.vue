<template>
  <div class="space-y-3">
    <UInput
      v-model="query"
      placeholder="Rechercher une cliente…"
      autocomplete="off"
      aria-label="Rechercher une cliente"
      icon="i-lucide-search"
      class="w-full"
      :ui="CONTENT_INPUT_UI"
    />

    <div
      v-if="pending"
      class="space-y-2"
      data-testid="checklist-loading"
    >
      <USkeleton class="h-12 w-full rounded-[8px]" />
      <USkeleton class="h-12 w-5/6 rounded-[8px]" />
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
        class="max-h-72 divide-y divide-[color:var(--color-border-subtle)] overflow-y-auto rounded-[12px] border border-[color:var(--color-border-subtle)]"
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

            diffusion-15 AC5: the row is the touch target, so it holds a 48 px
            minimum height; the checkbox stays 16 px but the whole row toggles.
          -->
          <div class="flex min-h-12 w-full min-w-0 items-center px-3 py-2 hover:bg-[color:var(--color-surface-muted)]">
            <UCheckbox
              class="min-w-0 flex-1"
              :size="'lg'"
              :ui="{ base: '!rounded-[4px]', wrapper: '!w-auto !min-w-0 !flex-1', label: 'cursor-pointer' }"
              :model-value="checked.has(client.clientProfileId)"
              :disabled="toggling.has(client.clientProfileId)"
              :aria-busy="toggling.has(client.clientProfileId) ? 'true' : 'false'"
              @update:model-value="toggle(client)"
            >
              <template #label>
                <span class="block min-w-0 flex-1">
                  <span class="block text-sm font-medium text-[color:var(--color-text-primary)]">
                    {{ client.firstname }} {{ client.lastname }}
                  </span>
                  <span class="block truncate text-xs text-[color:var(--color-neutral-600)]">
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
        :class="CONTENT_CAPTION_CLASS"
      >
        Aucune cliente ne correspond à cette recherche.
      </p>
      <p
        v-else
        :class="CONTENT_CAPTION_CLASS"
      >
        Aucune cliente à afficher.
      </p>

      <UButton
        v-if="nextCursor"
        variant="outline"
        color="neutral"
        size="md"
        :loading="loadingMore"
        @click="loadMore()"
      >
        Charger plus
      </UButton>

      <p
        v-if="loadMoreError"
        role="alert"
        class="text-xs font-medium text-[color:var(--color-error-700)]"
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
import { CONTENT_CAPTION_CLASS, CONTENT_INPUT_UI } from '../../features/contents/domain/content-field-ui'
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
