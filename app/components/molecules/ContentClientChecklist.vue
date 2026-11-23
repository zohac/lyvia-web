<template>
  <div class="space-y-3">
    <UInput
      v-model="searchQuery"
      placeholder="Rechercher une cliente…"
      autocomplete="off"
      aria-label="Rechercher une cliente"
      class="w-full"
    />

    <div v-if="pending" class="space-y-2">
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
          <label class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-[color:var(--color-surface-muted)]">
            <input
              type="checkbox"
              :checked="checked.has(client.clientProfileId)"
              :disabled="toggling.has(client.clientProfileId)"
              @change="toggle(client)"
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
      </ul>

      <p
        v-else-if="searchQuery.trim().length > 0"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listProviderClients } from '../../features/clients/services/provider-clients.service'
import { shareContent, unshareContent, listContentShares } from '../../features/contents/services/content-shares.service'

const props = defineProps<{
  contentId: string
}>()

const emit = defineEmits<{
  shared: [count: number]
  unshared: [clientProfileId: string]
}>()

const toast = useToast()

const searchQuery = ref('')
const pending = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const items = ref<Array<{ clientProfileId: string, firstname: string, lastname: string, email: string }>>([])
const nextCursor = ref<string | null>(null)
const checked = ref<Set<string>>(new Set())
const toggling = ref<Set<string>>(new Set())

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

async function load(cursor?: string) {
  const id = ++requestId
  if (!cursor) {
    pending.value = true
    error.value = null
  } else {
    loadingMore.value = true
  }
  try {
    const roster = await listProviderClients({ q: searchQuery.value.trim() || undefined, limit: 20, cursor })
    const shares = await listContentShares(props.contentId)
    const sharedIds = new Set(shares.items.map((s: { clientProfileId: string }) => s.clientProfileId))
    if (id !== requestId) return
    const mapped = roster.items.map((c: { clientProfileId: string, firstname: string, lastname: string, email: string }) => ({
      clientProfileId: c.clientProfileId,
      firstname: c.firstname,
      lastname: c.lastname,
      email: c.email
    }))
    if (cursor) {
      items.value = [...items.value, ...mapped]
    } else {
      items.value = mapped
    }
    nextCursor.value = roster.page?.nextCursor ?? null
    if (!cursor) {
      checked.value = new Set(sharedIds)
    }
  } catch {
    if (id !== requestId) return
    error.value = 'Impossible de charger les clientes.'
  } finally {
    if (id === requestId) {
      pending.value = false
      loadingMore.value = false
    }
  }
}

function loadMore() {
  if (loadingMore.value || !nextCursor.value) return
  load(nextCursor.value)
}

watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    items.value = []
    nextCursor.value = null
    load()
  }, 350)
})

onMounted(() => load())

async function toggle(client: { clientProfileId: string }) {
  const id = client.clientProfileId
  if (toggling.value.has(id)) return
  const wasChecked = checked.value.has(id)
  // optimistic
  const next = new Set(checked.value)
  if (wasChecked) {
    next.delete(id)
  } else {
    next.add(id)
  }
  checked.value = next

  toggling.value = new Set(toggling.value).add(id)
  try {
    if (wasChecked) {
      await unshareContent(props.contentId, id)
      emit('unshared', id)
      toast.add({ title: 'Partage retiré', color: 'success' })
    } else {
      await shareContent(props.contentId, { clientProfileIds: [id] })
      emit('shared', 1)
      toast.add({ title: 'Contenu partagé', color: 'success' })
    }
  } catch {
    // rollback
    const rollback = new Set(checked.value)
    if (wasChecked) {
      rollback.add(id)
    } else {
      rollback.delete(id)
    }
    checked.value = rollback
    toast.add({ title: 'Impossible de modifier le partage.', color: 'error' })
  } finally {
    const s = new Set(toggling.value)
    s.delete(id)
    toggling.value = s
  }
}
</script>
