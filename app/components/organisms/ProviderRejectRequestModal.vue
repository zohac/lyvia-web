<!--
  ProviderRejectRequestModal.vue

  Modal for rejecting a client request (cancellation or reschedule).
  Allows provider to add an optional note explaining the rejection.

  @see US-6 - Provider request processing
-->
<script setup lang="ts">
import type { ProviderRequestItem } from '../../features/provider-requests/api/provider-requests.contract'

const props = defineProps<{
  open: boolean
  request: ProviderRequestItem | null
  processing?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [providerNote: string | null]
}>()

const providerNote = ref('')

const isReschedule = computed(() => props.request?.type === 'reschedule')

const clientName = computed(() => {
  if (!props.request) return ''
  return `${props.request.appointment.client.firstName} ${props.request.appointment.client.lastName}`
})

/**
 * Submit rejection
 */
function handleConfirm() {
  const note = providerNote.value.trim() || null
  emit('confirm', note)
}

/**
 * Reset form when modal opens/closes
 */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      providerNote.value = ''
    }
  }
)

function updateOpen(value: boolean) {
  if (props.processing) return
  emit('update:open', value)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!processing"
    :ui="{
      content: 'rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg max-w-md',
      header: 'px-6 pt-6 pb-4',
      body: 'px-6 pb-6',
      footer: 'px-6 pb-6 pt-4 border-t border-stone-100',
      title: 'font-serif text-xl text-stone-900'
    }"
    @update:open="updateOpen"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <UIcon
            name="lucide:x-circle"
            class="h-5 w-5"
          />
        </span>
        <span>{{ isReschedule ? 'Refuser le report' : 'Refuser l\'annulation' }}</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Info message -->
        <p class="text-sm text-stone-600">
          <template v-if="isReschedule">
            En refusant cette demande de report de <strong>{{ clientName }}</strong>,
            le rendez-vous sera maintenu à la date initiale. Le client sera notifié par email.
          </template>
          <template v-else>
            En refusant cette demande d'annulation de <strong>{{ clientName }}</strong>,
            le rendez-vous sera maintenu. Le client sera notifié par email.
          </template>
        </p>

        <!-- Error message -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          icon="i-lucide-alert-circle"
        />

        <!-- Provider note -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-stone-700">
            Motif du refus (optionnel)
          </label>
          <UTextarea
            v-model="providerNote"
            :rows="3"
            :maxlength="500"
            :disabled="processing"
            placeholder="Ex: Je ne peux pas modifier ce rendez-vous car..."
          />
          <p class="text-right text-xs text-stone-400">
            {{ providerNote.length }}/500
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="processing"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="error"
          :loading="processing"
          @click="handleConfirm"
        >
          <UIcon
            name="lucide:x"
            class="mr-1.5 h-4 w-4"
          />
          Refuser la demande
        </UButton>
      </div>
    </template>
  </UModal>
</template>
