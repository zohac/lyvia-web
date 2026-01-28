<!--
  ProviderAcceptRequestModal.vue

  Modal for accepting a client request (cancellation or reschedule).
  For reschedule, requires selecting a new date.

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
  'confirm': [providerNote: string | null, newScheduledAt?: string]
}>()

const providerNote = ref('')
const newScheduledAt = ref('')

const isReschedule = computed(() => props.request?.type === 'reschedule')

const clientName = computed(() => {
  if (!props.request) return ''
  return `${props.request.appointment.client.firstName} ${props.request.appointment.client.lastName}`
})

/**
 * Minimum datetime for date picker (now)
 */
const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

/**
 * Validate and submit
 */
function handleConfirm() {
  const note = providerNote.value.trim() || null
  if (isReschedule.value) {
    if (!newScheduledAt.value) return
    emit('confirm', note, newScheduledAt.value)
  } else {
    emit('confirm', note)
  }
}

/**
 * Reset form when modal opens/closes
 */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      providerNote.value = ''
      newScheduledAt.value = ''
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
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
          <UIcon
            :name="isReschedule ? 'lucide:calendar-clock' : 'lucide:check-circle'"
            class="h-5 w-5"
          />
        </span>
        <span>{{ isReschedule ? 'Accepter le report' : 'Accepter l\'annulation' }}</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Info message -->
        <p class="text-sm text-stone-600">
          <template v-if="isReschedule">
            En acceptant cette demande de report de <strong>{{ clientName }}</strong>,
            vous devez proposer une nouvelle date. Le client sera notifié par email.
          </template>
          <template v-else>
            En acceptant cette demande d'annulation de <strong>{{ clientName }}</strong>,
            le rendez-vous sera annulé. Le client sera notifié par email.
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

        <!-- New date picker (reschedule only) -->
        <div
          v-if="isReschedule"
          class="space-y-2"
        >
          <label class="text-sm font-medium text-stone-700">
            Nouvelle date et heure <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="newScheduledAt"
            type="datetime-local"
            :min="minDateTime"
            :disabled="processing"
            class="w-full"
          />
        </div>

        <!-- Provider note -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-stone-700">
            Message pour le client (optionnel)
          </label>
          <UTextarea
            v-model="providerNote"
            :rows="3"
            :maxlength="500"
            :disabled="processing"
            placeholder="Ex: Merci de votre compréhension..."
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
          color="success"
          :loading="processing"
          :disabled="isReschedule && !newScheduledAt"
          @click="handleConfirm"
        >
          <UIcon
            name="lucide:check"
            class="mr-1.5 h-4 w-4"
          />
          Confirmer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
