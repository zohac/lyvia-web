<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  validateExternalLink,
  type GuidedDestination,
  type GuidedLinkInsert
} from '~/features/pages/domain/guided-links'

/**
 * V2.2b — Guided link insertion modal.
 *
 * Two tabs:
 * - "Destinations du site": a list resolved from real public routes
 *   (`buildGuidedDestinations`), so the coach never types an internal URL.
 * - "Lien externe": a free `https://` / `mailto:` URL, with an optional
 *   `target="_blank"` that always carries `rel="noopener noreferrer"`.
 *
 * The modal only emits the resolved link; the text block owns the DOM insertion.
 */
const props = defineProps<{
  open: boolean
  destinations: readonly GuidedDestination[]
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'insert', payload: GuidedLinkInsert): void
}>()

type GuidedTab = 'site' | 'external'

const activeTab = ref<GuidedTab>('site')
const selectedId = ref<string | null>(null)
const externalUrl = ref('')
const openInNewTab = ref(false)
const externalError = ref<string | null>(null)
const urlInputRef = ref<{ focus: () => void } | null>(null)

const tabItems = [
  { label: 'Destinations du site', value: 'site' as const },
  { label: 'Lien externe', value: 'external' as const }
]

const selectedDestination = computed(() =>
  props.destinations.find(destination => destination.id === selectedId.value) ?? null
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    activeTab.value = 'site'
    selectedId.value = props.destinations[0]?.id ?? null
    externalUrl.value = ''
    openInNewTab.value = false
    externalError.value = null
  }
)

watch(activeTab, (tab) => {
  if (tab !== 'external') return
  nextTick(() => urlInputRef.value?.focus())
})

// Destinations are loaded asynchronously by the page: when they arrive after
// the modal opened, pre-select the first one so the insert button is usable.
watch(
  () => props.destinations,
  (destinations) => {
    if (destinations.length === 0) return
    if (selectedId.value && destinations.some(destination => destination.id === selectedId.value)) return
    selectedId.value = destinations[0]!.id
  },
  { immediate: true }
)

function close() {
  emit('update:open', false)
}

function insertFromSite() {
  const destination = selectedDestination.value
  if (!destination) return
  emit('insert', { href: destination.href, label: destination.label })
  close()
}

function insertExternal() {
  const validation = validateExternalLink({ url: externalUrl.value, newTab: openInNewTab.value })
  if (!validation.ok) {
    externalError.value = validation.message
    return
  }
  externalError.value = null
  emit('insert', {
    href: validation.href,
    label: validation.href,
    ...(validation.target ? { target: validation.target } : {}),
    ...(validation.rel ? { rel: validation.rel } : {})
  })
  close()
}
</script>

<template>
  <UModal
    :open="open"
    title="Insérer un lien"
    description="Choisissez une destination de votre site ou ajoutez une adresse externe."
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <template #body>
      <div class="space-y-4">
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :unmount-on-hide="false"
        />

        <div
          v-if="activeTab === 'site'"
          class="space-y-2"
        >
          <p
            v-if="destinations.length === 0"
            class="text-sm text-[color:var(--color-text-muted)]"
          >
            Aucune destination disponible pour le moment.
          </p>
          <div
            v-else
            class="flex flex-col gap-2"
            role="group"
            aria-label="Destinations du site"
          >
            <button
              v-for="destination in destinations"
              :key="destination.id"
              type="button"
              :aria-pressed="selectedId === destination.id"
              class="flex w-full flex-col rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)]"
              :class="selectedId === destination.id
                ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-highlight)]'
                : 'border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-brand-subtle)]'"
              @click="selectedId = destination.id"
            >
              <span class="text-sm font-medium text-[color:var(--color-text-primary)]">{{ destination.label }}</span>
              <span class="text-xs text-[color:var(--color-text-muted)]">{{ destination.description }}</span>
            </button>
          </div>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <UFormField
            label="Adresse du lien"
            :error="externalError ?? undefined"
          >
            <UInput
              ref="urlInputRef"
              v-model="externalUrl"
              class="w-full"
              placeholder="https://exemple.fr"
              @update:model-value="externalError = null"
            />
          </UFormField>
          <label class="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
            <UCheckbox v-model="openInNewTab" />
            Ouvrir dans un nouvel onglet
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="close"
        >
          Annuler
        </UButton>
        <UButton
          v-if="activeTab === 'site'"
          color="primary"
          :disabled="!selectedDestination"
          @click="insertFromSite"
        >
          Insérer le lien
        </UButton>
        <UButton
          v-else
          color="primary"
          @click="insertExternal"
        >
          Insérer le lien
        </UButton>
      </div>
    </template>
  </UModal>
</template>
