<script setup lang="ts">
import SystemAlert from '../atoms/SystemAlert.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    loading?: boolean
    error?: string | null
  }>(),
  {
    cancelLabel: 'Annuler',
    loading: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'confirm'): void
}>()

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
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
      {{ title }}
    </template>
    <template #description>
      {{ description }}
    </template>

    <template #body>
      <SystemAlert
        v-if="error"
        variant="error"
        title="Action impossible"
        :description="error"
      />
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
          {{ cancelLabel }}
        </UButton>
        <UButton
          color="primary"
          class="rounded-full px-6"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
