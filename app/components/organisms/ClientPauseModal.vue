<script setup lang="ts">
/**
 * US-7: Modal de confirmation pour mettre une cliente en pause.
 * Permet de saisir une raison optionnelle (max 500 caractères).
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    clientName: string
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', reason: string): void
}>()

const reason = ref('')

// Reset reason when modal opens
watch(() => props.open, (next) => {
  if (next) {
    reason.value = ''
  }
})

function handleConfirm() {
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <UModal
    :open="open"
    title="Mettre en pause"
    :description="`Archiver ${clientName} ? Elle n'apparaîtra plus dans les clientes actives.`"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Raison (optionnelle)">
          <UTextarea
            v-model="reason"
            placeholder="Fin de parcours, souhait de la cliente..."
            :rows="3"
            :maxlength="500"
            :disabled="loading"
          />
        </UFormField>
        <p class="text-xs text-[color:var(--color-text-muted)]">
          {{ reason.length }}/500 caractères
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Annuler
        </UButton>
        <UButton
          color="warning"
          :loading="loading"
          @click="handleConfirm"
        >
          Confirmer la pause
        </UButton>
      </div>
    </template>
  </UModal>
</template>
