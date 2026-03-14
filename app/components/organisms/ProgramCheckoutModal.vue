<script setup lang="ts">
/**
 * X3.3 AC-6: Modal de choix du mode de paiement pour un programme.
 *
 * Affiche les options paiement unique / mensualités (si applicable),
 * puis redirige vers Stripe Checkout.
 */
import type { PublicProgramListItem } from '../../features/programs/api/programs.contract'
import type { ProgramCheckoutPaymentMode } from '../../features/programs/api/program-checkout.contract'
import { createProgramCheckout } from '../../features/programs/services/program-checkout.service'
import { formatProgramInstallments } from '../../features/programs/domain/programs'
import { formatCurrency } from '../../features/analytics/helpers/format-kpi'
import {
  buildCheckoutReturnUrls,
  getCurrentOrigin,
  isValidReturnUrl,
  CHECKOUT_SESSION_ID_PLACEHOLDER
} from '../../features/consultation/domain/return-urls'

const props = defineProps<{
  open: boolean
  program: PublicProgramListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const toast = useToast()

const selectedMode = ref<ProgramCheckoutPaymentMode>('one_time')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const installmentsLabel = computed(() => {
  if (!props.program) return null
  return formatProgramInstallments(props.program)
})

const hasInstallments = computed(() => {
  return props.program?.allowInstallments && props.program?.installmentCount
})

// Reset state when modal opens
watch(() => props.open, (next) => {
  if (next) {
    selectedMode.value = 'one_time'
    loading.value = false
    errorMessage.value = null
  }
})

const PROGRAM_CHECKOUT_PATHS = {
  success: `/client/program/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`,
  cancel: '/client/dashboard'
} as const

async function handleCheckout() {
  if (!props.program) return

  loading.value = true
  errorMessage.value = null

  try {
    const origin = getCurrentOrigin()
    const returnUrls = buildCheckoutReturnUrls(origin, PROGRAM_CHECKOUT_PATHS)

    if (!isValidReturnUrl(returnUrls.success) || !isValidReturnUrl(returnUrls.cancel)) {
      errorMessage.value = 'Erreur de configuration. Veuillez rafraîchir la page.'
      loading.value = false
      return
    }

    const response = await createProgramCheckout({
      programId: props.program.id,
      paymentMode: selectedMode.value,
      returnUrls
    })

    if (typeof window !== 'undefined' && response.checkoutSessionUrl) {
      window.location.assign(response.checkoutSessionUrl)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Une erreur est survenue'
    errorMessage.value = message
    toast.add({
      title: 'Erreur',
      description: message,
      color: 'error'
    })
    loading.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    title="Choisir ce programme"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div
        v-if="program"
        class="space-y-6"
      >
        <!-- Program summary -->
        <div class="rounded-xl bg-stone-50 p-4">
          <h3 class="font-serif text-lg font-semibold text-stone-900">
            {{ program.name }}
          </h3>
          <div class="mt-2 flex flex-wrap gap-3 text-sm text-stone-600">
            <span>{{ program.totalSessions }} séances</span>
            <span class="text-stone-300">·</span>
            <span>{{ program.sessionDurationMinutes }} min</span>
            <span class="text-stone-300">·</span>
            <span>{{ program.validityMonths }} mois</span>
          </div>
        </div>

        <!-- Payment mode selection -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-stone-700">
            Mode de paiement
          </p>

          <!-- One-time payment -->
          <label
            class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors"
            :class="selectedMode === 'one_time'
              ? 'border-primary-500 bg-primary-50'
              : 'border-stone-200 hover:border-stone-300'"
          >
            <input
              v-model="selectedMode"
              type="radio"
              value="one_time"
              class="accent-primary-600"
            >
            <div class="flex-1">
              <p class="font-medium text-stone-900">
                Paiement unique
              </p>
              <p class="text-2xl font-bold text-stone-900">
                {{ formatCurrency(program.priceCents) }}
              </p>
            </div>
          </label>

          <!-- Installments -->
          <label
            v-if="hasInstallments"
            class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors"
            :class="selectedMode === 'installments'
              ? 'border-primary-500 bg-primary-50'
              : 'border-stone-200 hover:border-stone-300'"
          >
            <input
              v-model="selectedMode"
              type="radio"
              value="installments"
              class="accent-primary-600"
            >
            <div class="flex-1">
              <p class="font-medium text-stone-900">
                En mensualités
              </p>
              <p class="text-lg font-bold text-stone-900">
                {{ installmentsLabel }}
              </p>
              <p class="text-sm text-stone-500">
                Total : {{ formatCurrency(program.priceCents) }}
              </p>
            </div>
          </label>
        </div>

        <!-- Error -->
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          :description="errorMessage"
          icon="i-lucide-alert-circle"
        />
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
          color="primary"
          :loading="loading"
          @click="handleCheckout"
        >
          <UIcon
            name="lucide:lock"
            class="mr-1.5 h-4 w-4"
          />
          Payer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
