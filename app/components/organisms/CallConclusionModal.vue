<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    clientName: string
    defaultConvertToClient?: boolean
    loading?: boolean
    error?: string | null
  }>(),
  {
    defaultConvertToClient: false,
    loading: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (
    event: 'submit',
    payload: { convertToClient: boolean, conversionNote?: string }
  ): void
}>()

const conversionNote = ref('')
const convertToClient = ref(props.defaultConvertToClient)
const formId = 'call-conclusion-form'

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    conversionNote.value = ''
    convertToClient.value = props.defaultConvertToClient
  }
)

const primaryActionLabel = computed(() =>
  convertToClient.value ? 'Terminer & Convertir' : 'Terminer sans suite'
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function submit() {
  const note = conversionNote.value.trim()
  emit('submit', {
    convertToClient: convertToClient.value,
    conversionNote: note ? note : undefined
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
      L’appel est terminé. Décidez de la suite.
    </template>

    <template #body>
      <SystemAlert
        v-if="error"
        class="mb-5"
        variant="error"
        title="Action impossible"
        :description="error"
      />

      <form
        :id="formId"
        class="grid gap-6"
        @submit.prevent="submit"
      >
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
            placeholder="Impressions, besoins spécifiques, points de vigilance…"
            :rows="4"
            :disabled="loading"
            variant="none"
            class="w-full rounded-[var(--radius-md)] border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] px-4 py-3 text-sm text-[color:var(--color-brand-primary)] shadow-soft focus:outline-none focus:ring-2 focus:ring-[rgba(212,184,160,0.75)]"
          />
        </div>

        <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
          <div class="min-w-0">
            <span class="block font-bold text-[color:var(--color-brand-primary)]">
              Convertir en cliente active ?
            </span>
            <span class="text-xs text-[color:var(--color-brand-secondary)]">
              Donne accès à la prise de rendez-vous payants.
            </span>
          </div>
          <USwitch
            v-model="convertToClient"
            size="lg"
            color="primary"
            :disabled="loading"
            class="self-start md:self-auto"
          />
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          type="submit"
          :form="formId"
          color="primary"
          class="rounded-full px-6"
          :loading="loading"
        >
          {{ primaryActionLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
