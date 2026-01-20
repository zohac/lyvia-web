<script setup lang="ts">
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
    :title="title"
    :description="description"
    @update:open="updateOpen"
  >
    <template #body>
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Action impossible"
        :description="error"
        icon="i-lucide-alert-circle"
      />
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
