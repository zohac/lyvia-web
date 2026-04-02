<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'

/**
 * US-8: Modal bilan discovery à 3 options.
 *
 * Options:
 * - Convertir (primary) → discovery → active
 * - À suivre (outline) → discovery → lead
 * - Sans suite (ghost) → discovery → paused
 */

export type BilanTargetStage = 'active' | 'lead' | 'paused'

const props = withDefaults(
  defineProps<{
    open: boolean
    clientName: string
    loading?: boolean
    error?: string | null
  }>(),
  {
    loading: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { targetStage: BilanTargetStage, note?: string }): void
}>()

const conversionNote = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    conversionNote.value = ''
  }
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function submitWithStage(stage: BilanTargetStage) {
  const note = conversionNote.value.trim()
  emit('submit', {
    targetStage: stage,
    note: note || undefined
  })
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    :ui="{
      content:
        'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
      header: 'px-8 pt-8 pb-4',
      body: 'px-8 pb-6',
      footer: 'px-8 pb-8 pt-6',
      title:
        'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
      description: 'text-sm text-[color:var(--color-brand-secondary)]'
    }"
    :close="{ class: 'rounded-full' }"
    @update:open="updateOpen"
  >
    <template #title>
      Bilan avec <span class="font-bold not-italic">{{ clientName }}</span>
    </template>
    <template #description>
      L'appel est terminé. Décidez de la suite.
    </template>

    <template #body>
      <SystemAlert
        v-if="error"
        class="mb-5"
        variant="error"
        title="Action impossible"
        :description="error"
      />

      <div class="grid gap-6">
        <div>
          <label
            for="conversion-note"
            class="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]"
          >
            Note de conversion (privé)
          </label>
          <UTextarea
            id="conversion-note"
            v-model="conversionNote"
            placeholder="Impressions, besoins spécifiques, points de vigilance..."
            :rows="4"
            :disabled="loading"
            :maxlength="1000"
            variant="none"
            class="w-full rounded-[var(--radius-md)] border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] px-4 py-3 text-sm text-[color:var(--color-brand-primary)] shadow-soft focus:outline-none focus:ring-2 focus:ring-[rgba(212,184,160,0.75)]"
          />
          <p class="mt-1 text-right text-xs text-[color:var(--color-brand-muted)]">
            {{ conversionNote.length }}/1000
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap gap-3">
        <!-- Sans suite - à gauche (ghost) -->
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full"
          :disabled="loading"
          @click="submitWithStage('paused')"
        >
          Sans suite
        </UButton>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- À suivre - outline -->
        <UButton
          color="neutral"
          variant="outline"
          class="rounded-full"
          :disabled="loading"
          @click="submitWithStage('lead')"
        >
          À suivre
        </UButton>

        <!-- Convertir - primary -->
        <UButton
          color="primary"
          class="rounded-full px-6"
          :loading="loading"
          @click="submitWithStage('active')"
        >
          <UIcon
            name="lucide:check"
            class="mr-2 h-4 w-4"
          />
          Convertir
        </UButton>
      </div>
    </template>
  </UModal>
</template>
