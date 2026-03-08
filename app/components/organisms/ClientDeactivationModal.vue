<script setup lang="ts">
import { formatCurrency } from '~/features/analytics/helpers/format-kpi'

const props = defineProps<{
  open: boolean
  clientName: string
  loading: boolean
  impact: {
    scheduledAppointmentsCount: number
    pendingPaymentsCount: number
    completedAppointmentsCount: number
    totalPaidAmount: number
    hasActiveTransactions: boolean
  } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const confirmChecked = ref(false)

const canConfirm = computed(() => !props.impact?.hasActiveTransactions || confirmChecked.value)

watch(() => props.open, (v) => {
  if (!v) confirmChecked.value = false
})

function updateOpen(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    @update:open="updateOpen"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <UIcon
            name="lucide:alert-triangle"
            size="20"
            class="text-red-600"
          />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
            Désactiver {{ clientName }}
          </h3>
          <p class="text-sm text-[color:var(--color-brand-muted)]">
            Cette action est réversible
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Loading impact -->
      <div
        v-if="!impact"
        class="flex items-center justify-center py-8"
      >
        <UIcon
          name="lucide:loader-2"
          size="24"
          class="animate-spin text-[color:var(--color-brand-muted)]"
        />
      </div>

      <!-- Impact data -->
      <div
        v-else
        class="space-y-4"
      >
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          La désactivation de ce client aura les conséquences suivantes :
        </p>

        <div class="grid gap-3">
          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:calendar"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.scheduledAppointmentsCount }}</strong> rendez-vous planifié{{ impact.scheduledAppointmentsCount > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:wallet"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.pendingPaymentsCount }}</strong> paiement{{ impact.pendingPaymentsCount > 1 ? 's' : '' }} en attente
            </span>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:check-circle"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.completedAppointmentsCount }}</strong> RDV complété{{ impact.completedAppointmentsCount > 1 ? 's' : '' }} pour un total de <strong>{{ formatCurrency(impact.totalPaidAmount) }}</strong>
            </span>
          </div>
        </div>

        <!-- Double confirmation for active transactions (FR-Q9) -->
        <div
          v-if="impact.hasActiveTransactions"
          class="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <UAlert
            color="warning"
            variant="soft"
            icon="i-lucide-alert-circle"
            title="Transactions en cours"
            description="Ce client a des rendez-vous planifiés ou paiements en attente. Ils ne seront pas automatiquement annulés."
            class="mb-3"
          />
          <label class="flex cursor-pointer items-start gap-3">
            <UCheckbox
              v-model="confirmChecked"
              class="mt-0.5"
            />
            <span class="text-sm text-[color:var(--color-brand-secondary)]">
              Je confirme avoir pris connaissance des transactions en cours
            </span>
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="error"
          :loading="loading"
          :disabled="!impact || !canConfirm"
          @click="emit('confirm')"
        >
          Confirmer la désactivation
        </UButton>
      </div>
    </template>
  </UModal>
</template>
